#!/usr/bin/env bash
# CIC Docker Recovery — Cleanup stale state and prepare for restart
# Runs automatically on container startup if lock/PID files are stale
# Manual usage: bash scripts/cic-docker-recovery.sh
# Version: 1.0.0

set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; GRN='\033[0;32m'; YEL='\033[0;33m'; RST='\033[0m'

ok()   { echo -e "${GRN}[RECOVERED]${RST} $*"; }
warn() { echo -e "${YEL}[WARN]${RST}     $*"; }
err()  { echo -e "${RED}[FAILED]${RST}   $*" >&2; }

CIC_ROOT="${CIC_PROJECT_ROOT:-.}"
MCP_PORT="${CIC_MCP_PORT:-3100}"
LOCK_FILE="$CIC_ROOT/.cic/startup.lock"
LOG_DIR="${CIC_LOG_DIR:-$CIC_ROOT/logs}"

# Better process detection: use ps instead of kill -0
is_process_alive() {
  local pid=$1
  ps -p "$pid" -o state= &>/dev/null
}

# 1. Recover stale lock
recover_lock() {
  echo "━━━ 1. Lock File Recovery ━━━"
  if [[ -f "$LOCK_FILE" ]]; then
    local pid; pid=$(jq -r '.pid // 0' "$LOCK_FILE" 2>/dev/null || echo "0")
    if [[ "$pid" -gt 0 ]] && is_process_alive "$pid"; then
      warn "Lock held by live PID $pid — not removing."
      return 0
    fi
    warn "Stale lock (PID $pid). Removing..."
    rm -f "$LOCK_FILE"
    ok "Stale lock removed."
  else
    ok "No stale lock found."
  fi
}

# 2. Free MCP port (kill zombie process if needed)
recover_mcp_port() {
  echo "━━━ 2. MCP Port Recovery ━━━"
  if lsof -iTCP:"$MCP_PORT" -sTCP:LISTEN -t &>/dev/null 2>&1; then
    local pid; pid=$(lsof -iTCP:"$MCP_PORT" -sTCP:LISTEN -t 2>/dev/null | head -1)
    warn "Port $MCP_PORT in use by PID $pid."

    # Check if process is alive
    if is_process_alive "$pid" 2>/dev/null; then
      warn "Process $pid is alive. Sending SIGTERM..."
      kill -TERM "$pid" 2>/dev/null && sleep 2
    fi

    # Force kill if still not freed
    if lsof -iTCP:"$MCP_PORT" -sTCP:LISTEN -t &>/dev/null 2>&1; then
      warn "Port still in use. Force killing..."
      kill -9 "$pid" 2>/dev/null || true
    fi

    if ! lsof -iTCP:"$MCP_PORT" -sTCP:LISTEN -t &>/dev/null 2>&1; then
      ok "Port $MCP_PORT freed."
    else
      err "Could not free port $MCP_PORT"
      return 1
    fi
  else
    ok "Port $MCP_PORT is free."
  fi
}

# 3. Ensure log directory exists
recover_logs() {
  echo "━━━ 3. Log Directory Recovery ━━━"
  if [[ ! -d "$LOG_DIR" ]]; then
    mkdir -p "$LOG_DIR"
    ok "Log directory recreated: $LOG_DIR"
  else
    ok "Log directory exists: $LOG_DIR"
  fi

  # Ensure archive subdir exists
  mkdir -p "$LOG_DIR/archive"
  ok "Archive directory ready."
}

# 4. Validate config (restore from backup if corrupt)
recover_config() {
  echo "━━━ 4. Config File Recovery ━━━"
  local cfg="$CIC_ROOT/.cic/mcp-manifest.json"

  if ! jq empty "$cfg" 2>/dev/null; then
    warn "Config is corrupt. Attempting restore..."
    local backup; backup=$(ls -t "$CIC_ROOT/.cic/backups/mcp-manifest-"*.json 2>/dev/null | head -1)

    if [[ -n "$backup" ]]; then
      # Validate backup is readable and valid JSON before restoring
      if jq empty "$backup" 2>/dev/null; then
        cp "$backup" "$cfg"
        ok "Restored from: $(basename $backup)"
      else
        warn "Backup is corrupt. Initializing default config..."
        cat > "$cfg" <<'EOF'
{
  "version": "1.0.0",
  "servers": []
}
EOF
        ok "Default config created."
      fi
    else
      warn "No backup found. Initializing default config..."
      cat > "$cfg" <<'EOF'
{
  "version": "1.0.0",
  "servers": []
}
EOF
      ok "Default config created."
    fi
  else
    ok "Config is valid JSON."
  fi
}

# 5. API reachability with exponential backoff
recover_api() {
  echo "━━━ 5. API Reachability Check ━━━"

  [[ -z "${CLAUDE_API_KEY:-}" ]] && {
    warn "CLAUDE_API_KEY not set. Skipping API check."
    return 0
  }

  local max=3 attempt=1 delay=2
  while (( attempt <= max )); do
    if curl -sf -H "x-api-key: $CLAUDE_API_KEY" \
         "https://api.anthropic.com/v1/models" -o /dev/null 2>/dev/null; then
      ok "API reachable (attempt $attempt)."
      return 0
    fi
    warn "API check failed. Retry $attempt/$max in ${delay}s..."
    sleep "$delay"; delay=$(( delay * 2 )); (( attempt++ ))
  done

  err "API unreachable after $max attempts."
  warn "Check network and CLAUDE_API_KEY. Continuing anyway..."
  return 1
}

# 6. Cleanup stale PID files
cleanup_pids() {
  echo "━━━ 6. PID File Cleanup ━━━"
  local pid_files=$(find "$CIC_ROOT/.cic" -name "*.pids" 2>/dev/null || true)

  if [[ -z "$pid_files" ]]; then
    ok "No stale PID files found."
    return 0
  fi

  for pf in $pid_files; do
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      if ! is_process_alive "$pid" 2>/dev/null; then
        ok "Removed stale PID: $pid"
      fi
    done < "$pf"
    rm -f "$pf"
  done
}

# Main
main() {
  echo ""
  echo "┏━━━ CIC Recovery Starting: $(date '+%Y-%m-%d %H:%M:%S') ━━━┓"
  echo ""

  recover_lock
  recover_mcp_port
  recover_logs
  recover_config
  recover_api || true
  cleanup_pids

  echo ""
  echo "┗━━━ Recovery Complete ━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
  echo ""
  echo "Next step: docker-compose up --build"
}

main "$@"
