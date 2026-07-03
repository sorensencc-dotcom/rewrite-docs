#!/usr/bin/env bash
# CIC Docker Entrypoint — Main startup coordinator
# Validates environment, runs smoke tests, launches startup sequence
# Version: 1.0.0

set -euo pipefail
IFS=$'\n\t'

# Colors
RED='\033[0;31m'; YEL='\033[0;33m'; GRN='\033[0;32m'
CYN='\033[0;36m'; BLD='\033[1m'; RST='\033[0m'

info()    { echo -e "${CYN}[INFO]${RST}  $*"; }
warn()    { echo -e "${YEL}[WARN]${RST}  $*"; }
error()   { echo -e "${RED}[ERROR]${RST} $*" >&2; }
success() { echo -e "${GRN}[OK]${RST}    $*"; }
die()     { error "$*"; exit 1; }

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIC_ROOT="${CIC_PROJECT_ROOT:-.}"
LOG_DIR="${CIC_LOG_DIR:-${CIC_ROOT}/logs}"
LOG_FILE="${LOG_DIR}/cic-$(date +%Y%m%d).log"
LOCK_FILE="${CIC_ROOT}/.cic/startup.lock"
MCP_PORT="${CIC_MCP_PORT:-3100}"
STARTUP_TIMEOUT="${CIC_STARTUP_TIMEOUT:-60}"
DRY_RUN="${CIC_DRY_RUN:-false}"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Trap cleanup
cleanup() {
  local exit_code=$?
  [[ -f "$LOCK_FILE" ]] && rm -f "$LOCK_FILE"
  exit $exit_code
}
trap cleanup EXIT INT TERM

# Banner
print_banner() {
  echo -e "${BLD}${CYN}"
  echo "╔══════════════════════════════════════════════════╗"
  echo "║    CIC DOCKER ENTRYPOINT v1.0.0                 ║"
  echo "║    $(date '+%Y-%m-%d %H:%M:%S')  •  Mode: $1"
  echo "╚══════════════════════════════════════════════════╝"
  echo -e "${RST}"
}

# Validate environment (no CLAUDE_API_KEY required in dry-run)
validate_env() {
  info "Validating environment..."
  [[ -d "$CIC_ROOT" ]] || die "CIC_PROJECT_ROOT does not exist: $CIC_ROOT"
  [[ "$DRY_RUN" == "true" ]] && { success "Dry-run mode: skipping API validation."; return 0; }
  [[ -z "${CLAUDE_API_KEY:-}" ]] && die "CLAUDE_API_KEY is not set."
  success "Environment valid."
}

# Validate project root structure
validate_project_root() {
  info "Validating CIC project root..."
  # Create .cic if missing (first-run setup)
  mkdir -p "$CIC_ROOT/.cic" "$CIC_ROOT/logs"

  # Initialize mcp-manifest if missing
  if [[ ! -f "$CIC_ROOT/.cic/mcp-manifest.json" ]]; then
    cat > "$CIC_ROOT/.cic/mcp-manifest.json" <<'EOF'
{
  "version": "1.0.0",
  "servers": []
}
EOF
    info "Initialized mcp-manifest.json"
  fi

  jq empty "$CIC_ROOT/.cic/mcp-manifest.json" 2>/dev/null \
    || die ".cic/mcp-manifest.json is not valid JSON."
  success "Project root validated."
}

# Check dependencies (lax in Docker — already installed)
check_dependencies() {
  info "Checking dependencies..."
  local deps=(node npm git curl jq lsof)
  local missing=()
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" &>/dev/null; then
      if [[ "$dep" == "lsof" ]]; then
        warn "Optional: $dep not found (port checks will be skipped)"
      else
        missing+=("$dep")
      fi
    fi
  done
  [[ ${#missing[@]} -gt 0 ]] && die "Missing required dependencies: ${missing[*]}"
  success "All required dependencies present."
}

# Better process detection: use ps instead of kill -0
is_process_alive() {
  local pid=$1
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  ps -p "$pid" -o state= &>/dev/null
}

# Acquire startup lock with stale detection
acquire_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local old_pid; old_pid=$(jq -r '.pid // 0' "$LOCK_FILE" 2>/dev/null || echo "0")
    if [[ "$old_pid" =~ ^[0-9]+$ ]] && [[ "$old_pid" -gt 0 ]] && is_process_alive "$old_pid"; then
      die "Startup already in progress (PID: $old_pid)."
    fi
    warn "Removing stale lock from PID $old_pid."
    rm -f "$LOCK_FILE"
  fi
  mkdir -p "$(dirname "$LOCK_FILE")"
  printf '{"pid":%d,"ts":"%s","version":"1.0.0","dry_run":%s}' \
    $$ "$(date -Iseconds)" "$(echo $DRY_RUN | tr '[:upper:]' '[:lower:]')" \
    > "$LOCK_FILE"
  success "Lock acquired (PID: $$)"
}

# Port availability check (handles missing lsof gracefully)
port_is_free() {
  if ! command -v lsof &>/dev/null; then
    warn "lsof not available; skipping port check for $1"
    return 0
  fi
  ! lsof -iTCP:"$1" -sTCP:LISTEN -t &>/dev/null 2>&1
}

# Wait for port with timeout
wait_for_port() {
  local port=$1 timeout=$2 elapsed=0
  info "Waiting for port $port to be ready (timeout: ${timeout}s)..."
  while ! port_is_free "$port"; do
    sleep 1; (( elapsed++ ))
    (( elapsed >= timeout )) \
      && { warn "Timeout waiting for port $port. Continuing anyway."; return 1; }
  done
  success "Port $port is ready (${elapsed}s)."
  return 0
}

# Start MCP servers (dry-run safe)
start_mcp_servers() {
  info "Starting MCP servers..."
  local manifest="$CIC_ROOT/.cic/mcp-manifest.json"
  local server_count; server_count=$(jq '.servers | length' "$manifest" 2>/dev/null || echo 0)

  if (( server_count == 0 )); then
    warn "No MCP servers in manifest. Skipping."
    return 0
  fi

  [[ "$DRY_RUN" == "true" ]] && { info "DRY-RUN: Would start $server_count MCP servers"; return 0; }

  for i in $(seq 0 $(( server_count - 1 ))); do
    local name cmd cwd
    name=$(jq -r ".servers[$i].name"          "$manifest")
    cmd=$(jq -r  ".servers[$i].command"        "$manifest")
    cwd=$(jq -r  ".servers[$i].cwd // \"$CIC_ROOT\"" "$manifest")

    info "Starting: $name"
    (cd "$cwd" && eval "$cmd" >> "$LOG_FILE" 2>&1 &)
    success "  $name launched (background)."
  done

  wait_for_port "$MCP_PORT" "$STARTUP_TIMEOUT" || true
}

# MCP health check (flexible per-server)
check_mcp_health() {
  [[ "$DRY_RUN" == "true" ]] && { info "DRY-RUN: Skipping health check"; return 0; }

  info "Running MCP health check..."
  if ! curl -sf "http://localhost:${MCP_PORT}/health" 2>/dev/null | jq empty 2>/dev/null; then
    warn "MCP health endpoint not responding. May not be ready yet."
    return 1
  fi
  success "MCP health check passed."
}

# API reachability with exponential backoff
check_api_reachability() {
  [[ "$DRY_RUN" == "true" ]] && { info "DRY-RUN: Skipping API check"; return 0; }
  [[ -z "${CLAUDE_API_KEY:-}" ]] && { warn "CLAUDE_API_KEY not set. Skipping."; return 0; }

  info "Checking Anthropic API reachability..."
  local max=3 attempt=1 delay=2
  while (( attempt <= max )); do
    if curl -sf -H "x-api-key: $CLAUDE_API_KEY" \
         "https://api.anthropic.com/v1/models" -o /dev/null 2>/dev/null; then
      success "API reachable (attempt $attempt)."
      return 0
    fi
    warn "API check failed. Retry $attempt/$max in ${delay}s..."
    sleep "$delay"; delay=$(( delay * 2 )); (( attempt++ ))
  done
  warn "API still unreachable after $max attempts. Continuing anyway."
  return 1
}

# Log rotation & archival (every 30 days, 90-day retention)
rotate_logs() {
  info "Checking log rotation policy..."
  local archive_dir="$LOG_DIR/archive"
  mkdir -p "$archive_dir"

  # Find logs older than 30 days and gzip them
  find "$LOG_DIR" -maxdepth 1 -name "cic-*.log" -mtime +30 -type f 2>/dev/null | \
  while read logfile; do
    local basename; basename=$(basename "$logfile")
    info "Archiving old log: $basename"
    gzip -f "$logfile" && mv "${logfile}.gz" "$archive_dir/" || true
  done

  # Delete archives older than 90 days
  find "$archive_dir" -name "*.log.gz" -mtime +90 -delete 2>/dev/null || true
  success "Log rotation complete."
}

# Bootstrap Claude Code (conditional on permissions)
bootstrap_claude() {
  [[ "$DRY_RUN" == "true" ]] && { info "DRY-RUN: Skipping Claude bootstrap"; return 0; }
  [[ -z "${CLAUDE_API_KEY:-}" ]] && { warn "CLAUDE_API_KEY not set. Skipping Claude bootstrap."; return 0; }

  info "Bootstrapping Claude Code..."
  local session_config="$CIC_ROOT/.cic/claude-session.json"
  printf '{
  "project_root": "%s",
  "mcp_endpoint": "http://localhost:%s",
  "env": "%s",
  "session_started": "%s"
}' "$CIC_ROOT" "$MCP_PORT" "${CIC_ENV:-development}" "$(date -Iseconds)" \
    > "$session_config"
  success "Session config written."

  # Launch Claude in background (respects CLAUDE_SKIP_PERMISSIONS env var)
  local skip_perms="${CLAUDE_SKIP_PERMISSIONS:-true}"
  if [[ "$skip_perms" == "true" ]]; then
    info "Launching Claude Code (permissions disabled for Docker)..."
    claude --dangerously-skip-permissions \
           --project-dir "$CIC_ROOT" \
           >> "$LOG_FILE" 2>&1 &
  else
    info "Launching Claude Code (interactive mode)..."
    claude --project-dir "$CIC_ROOT" \
           >> "$LOG_FILE" 2>&1 &
  fi
  success "Claude Code daemon running."
}

# Run smoke tests (validates startup correctness)
run_smoke_tests() {
  info "Running smoke tests..."
  [[ "$DRY_RUN" == "true" ]] && { info "DRY-RUN: Would run smoke tests"; return 0; }

  bash "$SCRIPT_DIR/cic-smoke-test.sh" || {
    warn "Smoke tests failed. Check logs with: tail -f logs/cic-smoke-test.log"
    return 1
  }
  success "Smoke tests passed."
}

# Main orchestrator
main() {
  local mode="${1:-start}"

  case "$mode" in
    start)
      print_banner "START"
      exec > >(tee -a "$LOG_FILE") 2>&1
      acquire_lock
      validate_env
      validate_project_root
      check_dependencies
      rotate_logs
      # Initialize SCP (Phase 28a) — run migrations + manifest setup
      info "Initializing SCP Phase 28a.2..."
      bash "${SCRIPT_DIR}/scp-init.sh" || warn "SCP initialization had issues (non-fatal)"
      start_mcp_servers
      check_mcp_health || true
      check_api_reachability || true
      bootstrap_claude
      run_smoke_tests || true
      echo ""
      success "═══════════════════════════════════════════════════"
      success " CIC Docker environment is LIVE."
      success "═══════════════════════════════════════════════════"
      echo ""
      # Keep container alive
      sleep infinity
      ;;

    validate)
      print_banner "VALIDATE"
      validate_env
      validate_project_root
      check_dependencies
      success "Validation passed."
      ;;

    test)
      print_banner "TEST (SMOKE)"
      run_smoke_tests
      ;;

    *)
      error "Unknown mode: $mode"
      error "Usage: $0 {start|validate|test}"
      exit 1
      ;;
  esac
}

main "$@"
