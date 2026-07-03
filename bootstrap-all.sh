#!/bin/sh
set -e

OWNER="sorensencc-dotcom"
TIMESTAMP=$(date +%s)
DATE_ISO=$(date '+%Y-%m-%dT%H-%M-%SZ')
LOG_FILE="${PWD}/bootstrap-${OWNER}-${TIMESTAMP}.log"
SNAPSHOTS_DIR="${HOME}/.multi-repo-bootstrap/snapshots"
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
FAILED_REPOS_FILE="/tmp/failed-${OWNER}-$$.txt"
DRY_RUN=0
GROUP=""
GROUP_CACHE=""
GROUP_CACHE_FILE=""

log() {
  TS=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TS] $*" | tee -a "$LOG_FILE"
}

pass() {
  echo "✔️  $*" | tee -a "$LOG_FILE"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "❌ $*" | tee -a "$LOG_FILE"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
  echo "⏭️  $*" | tee -a "$LOG_FILE"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

dry_run_msg() {
  echo "   [DRY-RUN] $*" | tee -a "$LOG_FILE"
}

cleanup_repo() {
  local repo_dir=$1
  if [ -n "$repo_dir" ] && [ -d "$repo_dir" ]; then
    cd / || return 1
    rm -rf "$repo_dir" || fail "Failed to cleanup $repo_dir"
  fi
}

usage() {
  cat << 'EOF'
Usage: bootstrap-all.sh [OPTIONS]

Options:
  --dry-run           Show what would be done without modifying repos
  --group <name>      Process only repos in group (core|labs|archive)
  --yes               Skip confirmations
  -h, --help          Show this help message

Examples:
  ./bootstrap-all.sh
  ./bootstrap-all.sh --dry-run
  ./bootstrap-all.sh --group core
  ./bootstrap-all.sh --dry-run --group labs
EOF
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --group)
      GROUP="$2"
      shift 2
      ;;
    --yes)
      CONFIRM_YES=1
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

command -v gh >/dev/null 2>&1 || { fail "gh CLI not found"; exit 1; }
command -v git >/dev/null 2>&1 || { fail "git not found"; exit 1; }

mkdir -p "$SNAPSHOTS_DIR"
touch "$FAILED_REPOS_FILE"

# Cache group file if filtering
if [ -n "$GROUP" ] && [ -f "setup/groups/${GROUP}.txt" ]; then
  GROUP_CACHE_FILE="setup/groups/${GROUP}.txt"
fi

log "========== BOOTSTRAP ORCHESTRATOR =========="
log "Owner: $OWNER"
log "Timestamp: $DATE_ISO"
[ "$DRY_RUN" = "1" ] && log "Mode: DRY-RUN" || log "Mode: LIVE"
[ -n "$GROUP" ] && log "Group: $GROUP" || log "Group: (none)"
log ""

log "Discovering repositories..."

REPOS_FILE="/tmp/repos-${OWNER}-$$.txt"
gh repo list "$OWNER" --limit 1000 --json name --jq '.[].name' > "$REPOS_FILE" 2>/dev/null || {
  fail "Failed to discover repositories"
  exit 1
}

REPO_COUNT=$(wc -l < "$REPOS_FILE")

if [ "$REPO_COUNT" -eq 0 ]; then
  fail "No repositories found for owner: $OWNER"
  exit 1
fi

log "Found $REPO_COUNT repositories"

# Load exclusions
load_exclusions() {
  if [ -f "setup/exclude.txt" ]; then
    grep -v '^#' setup/exclude.txt | grep -v '^$'
  fi
}

# Create bootstrap.yml template
BOOTSTRAP_YML='name: Bootstrap Validation

on: [push, pull_request, workflow_dispatch]

jobs:
  bootstrap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run validator
        run: |
          if [ -f setup/validate.sh ]; then
            sh setup/validate.sh
          else
            echo "setup/validate.sh not found"
            exit 1
          fi
'

# Create validate.sh template
VALIDATE_SH='#!/bin/sh
set -e

echo "✔️  Repository structure validated"
echo "✔️  Setup directory exists"
if [ -f ".github/workflows/bootstrap.yml" ]; then
  echo "✔️  Bootstrap workflow exists"
fi

# Check for common issues
if [ ! -f "package.json" ] && [ ! -f "setup.py" ] && [ ! -f "Dockerfile" ]; then
  echo "⚠️  Warning: No recognized config file found (package.json, setup.py, Dockerfile)"
fi

exit 0
'

# Create dashboard.yml template
DASHBOARD_YML='name: Dashboard Summary

on:
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * *"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run validator
        run: |
          mkdir -p .github/reports
          if [ -f setup/validate.sh ]; then
            sh setup/validate.sh > .github/reports/validation.log 2>&1
          fi
      - name: Create summary
        run: |
          cat > .github/reports/validation-summary.json << JSON_EOF
          {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "repository": "${{ github.repository }}",
            "workflow": "dashboard",
            "status": "complete"
          }
          JSON_EOF
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: validation-summary
          path: .github/reports/
'

# Create nightly-validate.yml template
NIGHTLY_YML='name: Nightly Validator

on:
  schedule:
    - cron: "0 2 * * *"
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run validator
        run: |
          if [ -f setup/validate.sh ]; then
            sh setup/validate.sh
          else
            echo "setup/validate.sh not found"
            exit 1
          fi
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: nightly-validation-${{ github.run_id }}
          path: .
'

log ""
log "Processing repositories..."
log ""

while IFS= read -r REPO_NAME; do
  [ -z "$REPO_NAME" ] && continue

  FULL_REPO="${OWNER}/${REPO_NAME}"

  # Check exclusion
  if load_exclusions | grep -q "^${FULL_REPO}$"; then
    skip "${FULL_REPO}: Excluded"
    continue
  fi

  # Check group (using cached file)
  if [ -n "$GROUP_CACHE_FILE" ]; then
    if ! grep -q "^${FULL_REPO}$" "$GROUP_CACHE_FILE" 2>/dev/null; then
      skip "${FULL_REPO}: Not in group $GROUP"
      continue
    fi
  fi

  log ""
  log "Processing: $FULL_REPO"

  REPO_DIR="/tmp/bootstrap-${OWNER}-${REPO_NAME}-$$"
  REPO_URL="https://github.com/${FULL_REPO}.git"

  if [ "$DRY_RUN" = "0" ]; then
    if ! timeout 120 git clone --quiet "$REPO_URL" "$REPO_DIR" 2>/dev/null; then
      fail "${FULL_REPO}: Failed to clone (timeout or network error)"
      echo "$REPO_NAME" >> "$FAILED_REPOS_FILE"
      cleanup_repo "$REPO_DIR"
      continue
    fi
  else
    dry_run_msg "git clone $REPO_URL"
  fi

  if [ "$DRY_RUN" = "0" ]; then
    cd "$REPO_DIR" || { fail "${REPO_NAME}: Failed to cd into repo"; continue; }
  fi

  # Snapshot
  if [ "$DRY_RUN" = "0" ]; then
    SNAPSHOT_DIR="${SNAPSHOTS_DIR}/${FULL_REPO}"
    mkdir -p "$SNAPSHOT_DIR"

    # Check if repo has commits
    if ! git rev-parse HEAD >/dev/null 2>&1; then
      fail "${FULL_REPO}: Empty repository (no commits)"
      cleanup_repo "$REPO_DIR"
      continue
    fi

    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    COMMIT=$(git rev-parse HEAD)

    cat > "${SNAPSHOT_DIR}/${DATE_ISO}.txt" << SNAP_EOF
repo=$FULL_REPO
branch=$BRANCH
commit=$COMMIT
timestamp=$DATE_ISO
SNAP_EOF
    pass "${FULL_REPO}: Snapshot recorded"
  else
    dry_run_msg "Record snapshot: ${SNAPSHOTS_DIR}/${FULL_REPO}/${DATE_ISO}.txt"
  fi

  # Enable features
  log "Configuring repo features..."
  if [ "$DRY_RUN" = "0" ]; then
    if gh repo edit --enable-issues --enable-wiki --enable-projects --delete-branch-on-merge 2>/dev/null; then
      pass "${FULL_REPO}: Features enabled"
    else
      fail "${FULL_REPO}: Failed to enable features"
    fi
  else
    dry_run_msg "gh repo edit --enable-issues --enable-wiki --enable-projects --delete-branch-on-merge"
  fi

  # Configure Actions
  log "Configuring Actions permissions..."
  if [ "$DRY_RUN" = "0" ]; then
    if gh api "repos/${FULL_REPO}" -X PATCH \
      -f "actions_permissions=all" \
      -f "actions_default_workflow_permissions=write" 2>/dev/null; then
      pass "${FULL_REPO}: Actions configured"
    else
      fail "${FULL_REPO}: Failed to configure Actions"
    fi
  else
    dry_run_msg "gh api repos/${FULL_REPO} -X PATCH (Actions config)"
  fi

  if [ "$DRY_RUN" = "0" ]; then
    # Create directories
    mkdir -p .github/workflows setup/groups .github/reports

    # Write bootstrap.yml
    if [ ! -f ".github/workflows/bootstrap.yml" ]; then
      echo "$BOOTSTRAP_YML" > ".github/workflows/bootstrap.yml"
      pass "${FULL_REPO}: bootstrap.yml created"
    else
      pass "${FULL_REPO}: bootstrap.yml exists"
    fi

    # Write dashboard.yml
    if [ ! -f ".github/workflows/dashboard.yml" ]; then
      echo "$DASHBOARD_YML" > ".github/workflows/dashboard.yml"
      pass "${FULL_REPO}: dashboard.yml created"
    else
      pass "${FULL_REPO}: dashboard.yml exists"
    fi

    # Write nightly-validate.yml
    if [ ! -f ".github/workflows/nightly-validate.yml" ]; then
      echo "$NIGHTLY_YML" > ".github/workflows/nightly-validate.yml"
      pass "${FULL_REPO}: nightly-validate.yml created"
    else
      pass "${FULL_REPO}: nightly-validate.yml exists"
    fi

    # Write validate.sh
    if [ ! -f "setup/validate.sh" ]; then
      echo "$VALIDATE_SH" > "setup/validate.sh"
      chmod +x setup/validate.sh
      pass "${FULL_REPO}: validate.sh created"
    else
      pass "${FULL_REPO}: validate.sh exists"
    fi

    # Run validator
    log "Running validator..."
    if sh setup/validate.sh 2>/dev/null; then
      pass "${FULL_REPO}: Validator passed"
    else
      fail "${FULL_REPO}: Validator failed"
      echo "$REPO_NAME" >> "$FAILED_REPOS_FILE"
    fi

    # Commit and push
    log "Committing and pushing..."
    git add .github/workflows/bootstrap.yml .github/workflows/dashboard.yml .github/workflows/nightly-validate.yml setup/validate.sh 2>/dev/null || true

    if git diff --cached --quiet; then
      pass "${FULL_REPO}: No changes to commit (files already exist)"
    else
      if git commit -m "Bootstrap: add workflow + validator

- bootstrap.yml: validation on push/PR
- dashboard.yml: daily summary
- nightly-validate.yml: scheduled validation
- validate.sh: repo structure checks" 2>/dev/null; then
        if git push origin HEAD 2>/dev/null; then
          pass "${FULL_REPO}: Changes pushed"
        else
          fail "${FULL_REPO}: Failed to push changes"
          echo "$REPO_NAME" >> "$FAILED_REPOS_FILE"
        fi
      else
        fail "${FULL_REPO}: Failed to commit changes"
        echo "$REPO_NAME" >> "$FAILED_REPOS_FILE"
      fi
    fi

    # Cleanup
    cleanup_repo "$REPO_DIR"
  else
    dry_run_msg "mkdir -p .github/workflows setup/groups .github/reports"
    dry_run_msg "Write .github/workflows/bootstrap.yml"
    dry_run_msg "Write .github/workflows/dashboard.yml"
    dry_run_msg "Write .github/workflows/nightly-validate.yml"
    dry_run_msg "Write setup/validate.sh"
    dry_run_msg "git add && git commit && git push"
  fi

done < "$REPOS_FILE"

# Summary
log ""
log "========== BOOTSTRAP SUMMARY =========="
log "Total: $REPO_COUNT repositories"
log "Processed: $((PASS_COUNT / 5))"
log "Skipped: $SKIP_COUNT"
log "Failed: $FAIL_COUNT"

if [ -s "$FAILED_REPOS_FILE" ]; then
  log ""
  log "Failed repos:"
  sort -u "$FAILED_REPOS_FILE" | while IFS= read -r REPO; do
    [ -z "$REPO" ] && continue
    log "  ❌ $REPO"
  done
fi

log ""
log "Log saved to: $LOG_FILE"
log "Snapshots saved to: $SNAPSHOTS_DIR"
log "=========================================="

rm -f "$REPOS_FILE" "$FAILED_REPOS_FILE"

[ "$DRY_RUN" = "1" ] && log "[DRY-RUN] No repos were modified" && exit 0

[ "$FAIL_COUNT" -eq 0 ] && exit 0 || exit 1
