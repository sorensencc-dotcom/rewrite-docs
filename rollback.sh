#!/bin/sh
set -e

SNAPSHOTS_DIR="${HOME}/.multi-repo-bootstrap/snapshots"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

pass() {
  echo "✔️  $*"
}

fail() {
  echo "❌ $*" >&2
}

cleanup_temp() {
  local temp_dir=$1
  if [ -n "$temp_dir" ] && [ -d "$temp_dir" ]; then
    cd / || return 1
    rm -rf "$temp_dir" || fail "Failed to cleanup $temp_dir"
  fi
}

usage() {
  cat << 'EOF'
Usage: rollback.sh [OPTIONS] [REPO] [TIMESTAMP]

Modes:
  rollback.sh <owner/repo> last
  rollback.sh <owner/repo> <timestamp>
  rollback.sh --all <timestamp>
  rollback.sh --list [owner/repo]
  rollback.sh --help

Options:
  --yes               Skip confirmation prompts
  --help              Show this message

Examples:
  # Rollback to most recent snapshot
  ./rollback.sh sorensencc-dotcom/castironforge last

  # Rollback to specific timestamp
  ./rollback.sh sorensencc-dotcom/castironforge 2024-06-17T12-30-45Z

  # Rollback all repos to timestamp
  ./rollback.sh --all 2024-06-17T12-30-45Z

  # List snapshots
  ./rollback.sh --list sorensencc-dotcom/castironforge
  ./rollback.sh --list
EOF
  exit 0
}

list_snapshots() {
  local repo=$1

  if [ -z "$repo" ]; then
    # List all snapshots
    if [ ! -d "$SNAPSHOTS_DIR" ]; then
      fail "No snapshots found"
      exit 1
    fi

    log "All snapshots:"
    find "$SNAPSHOTS_DIR" -name "*.txt" | sort | while read -r snap_file; do
      snap_repo=$(echo "$snap_file" | sed "s|${SNAPSHOTS_DIR}/||" | sed 's|/.*||')
      snap_ts=$(echo "$snap_file" | sed 's|.*/\(.*\).txt|\1|')
      log "  $snap_repo @ $snap_ts"
    done
  else
    # List snapshots for specific repo
    repo_snap_dir="${SNAPSHOTS_DIR}/${repo}"
    if [ ! -d "$repo_snap_dir" ]; then
      fail "No snapshots found for $repo"
      exit 1
    fi

    log "Snapshots for $repo:"
    find "$repo_snap_dir" -name "*.txt" | sort | while read -r snap_file; do
      snap_ts=$(basename "$snap_file" .txt)
      log "  $snap_ts"
    done
  fi
}

get_last_snapshot() {
  local repo=$1
  local repo_snap_dir="${SNAPSHOTS_DIR}/${repo}"

  if [ ! -d "$repo_snap_dir" ]; then
    fail "No snapshots found for $repo"
    return 1
  fi

  find "$repo_snap_dir" -name "*.txt" | sort | tail -1
}

get_snapshot_by_timestamp() {
  local repo=$1
  local timestamp=$2
  local snap_file="${SNAPSHOTS_DIR}/${repo}/${timestamp}.txt"

  if [ ! -f "$snap_file" ]; then
    fail "No snapshot found for $repo at $timestamp"
    return 1
  fi

  echo "$snap_file"
}

rollback_repo() {
  local repo=$1
  local snapshot_file=$2
  local skip_confirm=${3:-0}

  if [ ! -f "$snapshot_file" ]; then
    fail "Snapshot file not found: $snapshot_file"
    return 1
  fi

  # Parse snapshot
  local snap_repo snap_branch snap_commit snap_timestamp
  eval "$(grep '^repo=' "$snapshot_file")"
  eval "$(grep '^branch=' "$snapshot_file")"
  eval "$(grep '^commit=' "$snapshot_file")"
  eval "$(grep '^timestamp=' "$snapshot_file")"

  log ""
  log "Rollback plan for $snap_repo:"
  log "  Branch: $snap_branch"
  log "  Target commit: $snap_commit"
  log "  Snapshot timestamp: $snap_timestamp"
  log ""

  if [ "$skip_confirm" = "0" ]; then
    printf "Confirm rollback? (yes/no) "
    read -r confirm
    if [ "$confirm" != "yes" ]; then
      log "Cancelled"
      return 0
    fi
  fi

  # Clone/fetch repo
  local temp_dir="/tmp/rollback-${snap_repo##*/}-$$"
  local repo_url="https://github.com/${snap_repo}.git"

  log "Cloning $snap_repo..."
  if ! git clone --quiet "$repo_url" "$temp_dir" 2>/dev/null; then
    fail "Failed to clone $snap_repo"
    return 1
  fi

  cd "$temp_dir" || return 1

  log "Fetching latest..."
  git fetch origin --quiet 2>/dev/null || true

  log "Resetting to $snap_commit..."
  if ! git reset --hard "$snap_commit" 2>/dev/null; then
    fail "Failed to reset to $snap_commit"
    cleanup_temp "$temp_dir"
    return 1
  fi

  log "Force-pushing to origin/$snap_branch..."
  if ! git remote -v | grep -q "^origin"; then
    fail "$snap_repo: Remote 'origin' not found"
    cleanup_temp "$temp_dir"
    return 1
  fi

  if git push origin "HEAD:$snap_branch" --force --quiet 2>/dev/null; then
    pass "$snap_repo: Rollback complete"
  else
    fail "$snap_repo: Failed to push"
    cleanup_temp "$temp_dir"
    return 1
  fi

  cleanup_temp "$temp_dir"
  return 0
}

rollback_all() {
  local timestamp=$1
  local skip_confirm=$2

  if [ ! -d "$SNAPSHOTS_DIR" ]; then
    fail "No snapshots found"
    exit 1
  fi

  log "Rolling back all repos to $timestamp..."
  log ""

  local success=0
  local failed=0

  find "$SNAPSHOTS_DIR" -name "${timestamp}.txt" | while read -r snap_file; do
    repo=$(echo "$snap_file" | sed "s|${SNAPSHOTS_DIR}/||" | sed 's|/.*||')
    if rollback_repo "$repo" "$snap_file" "$skip_confirm"; then
      success=$((success + 1))
    else
      failed=$((failed + 1))
    fi
  done

  log ""
  log "Rollback summary:"
  log "  Success: $success"
  log "  Failed: $failed"
}

# Parse args
SKIP_CONFIRM=0
MODE=""
REPO=""
TIMESTAMP=""

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      SKIP_CONFIRM=1
      shift
      ;;
    --list)
      shift
      if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then
        list_snapshots "$1"
      else
        list_snapshots
      fi
      exit 0
      ;;
    --all)
      MODE="all"
      TIMESTAMP="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      if [ -z "$REPO" ]; then
        REPO="$1"
      elif [ -z "$TIMESTAMP" ]; then
        TIMESTAMP="$1"
      fi
      shift
      ;;
  esac
done

# Validate args
if [ "$MODE" = "all" ]; then
  if [ -z "$TIMESTAMP" ]; then
    fail "Usage: rollback.sh --all <timestamp>"
    exit 1
  fi
  rollback_all "$TIMESTAMP" "$SKIP_CONFIRM"
else
  if [ -z "$REPO" ] || [ -z "$TIMESTAMP" ]; then
    fail "Usage: rollback.sh <owner/repo> <timestamp|last>"
    exit 1
  fi

  if [ "$TIMESTAMP" = "last" ]; then
    snap_file=$(get_last_snapshot "$REPO") || exit 1
  else
    snap_file=$(get_snapshot_by_timestamp "$REPO" "$TIMESTAMP") || exit 1
  fi

  rollback_repo "$REPO" "$snap_file" "$SKIP_CONFIRM"
fi
