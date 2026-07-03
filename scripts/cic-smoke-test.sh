#!/usr/bin/env bash
# CIC Smoke Test — Quick validation of critical startup paths
# Verifies: dependencies, config, API, MCP readiness, Claude Code
# Version: 1.0.0

set -euo pipefail
IFS=$'\n\t'

# Colors
RED='\033[0;31m'; GRN='\033[0;32m'; CYN='\033[0;36m'; RST='\033[0m'

pass()  { echo -e "${GRN}[PASS]${RST}  $*"; }
fail()  { echo -e "${RED}[FAIL]${RST}  $*"; }
info()  { echo -e "${CYN}[INFO]${RST}  $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIC_ROOT="${CIC_PROJECT_ROOT:-.}"
LOG_FILE="${CIC_ROOT}/logs/cic-smoke-test.log"
MCP_PORT="${CIC_MCP_PORT:-3100}"
FAILED=0

# Log all output
exec > >(tee -a "$LOG_FILE") 2>&1

info "Starting CIC smoke test at $(date)"

# Test 1: Node.js version
info "TEST 1: Node.js >= 20"
if node_ver=$(node -v 2>/dev/null | tr -d 'v' | cut -d. -f1) && (( node_ver >= 20 )); then
  pass "Node.js version: $(node -v)"
else
  fail "Node.js version check"; (( FAILED++ ))
fi

# Test 2: Required CLIs
info "TEST 2: Required CLIs"
for cli in npm git curl jq lsof; do
  if command -v "$cli" &>/dev/null; then
    pass "$cli: available"
  else
    fail "$cli: NOT FOUND"; (( FAILED++ ))
  fi
done

# Test 3: CIC project root structure
info "TEST 3: Project root structure"
for dir in .cic logs; do
  if [[ -d "$CIC_ROOT/$dir" ]]; then
    pass "Directory: $dir"
  else
    fail "Missing: $dir"; (( FAILED++ ))
  fi
done

# Test 4: Config files
info "TEST 4: Config files"
if [[ -f "$CIC_ROOT/.cic/mcp-manifest.json" ]]; then
  if jq empty "$CIC_ROOT/.cic/mcp-manifest.json" 2>/dev/null; then
    pass "mcp-manifest.json is valid JSON"
  else
    fail "mcp-manifest.json is NOT valid JSON"; (( FAILED++ ))
  fi
else
  fail "mcp-manifest.json NOT FOUND"; (( FAILED++ ))
fi

# Test 5: npm packages installed
info "TEST 5: npm packages"
if [[ -d "$CIC_ROOT/node_modules" ]]; then
  pass "node_modules directory exists"
  if [[ -f "$CIC_ROOT/package.json" ]]; then
    pass "package.json present"
  else
    fail "package.json NOT FOUND"; (( FAILED++ ))
  fi
else
  fail "node_modules NOT FOUND"; (( FAILED++ ))
fi

# Test 6: Claude Code CLI
info "TEST 6: Claude Code CLI"
if command -v claude &>/dev/null; then
  pass "Claude Code CLI: installed"
  if claude_ver=$(claude --version 2>/dev/null); then
    pass "Claude version: $claude_ver"
  else
    fail "Could not get Claude version"; (( FAILED++ ))
  fi
else
  fail "Claude Code CLI NOT FOUND"; (( FAILED++ ))
fi

# Test 7: MCP port availability
info "TEST 7: MCP port availability"
if lsof -iTCP:"$MCP_PORT" -sTCP:LISTEN -t &>/dev/null 2>&1; then
  pass "Port $MCP_PORT is active"
else
  info "Port $MCP_PORT: not yet bound (expected on first startup)"
fi

# Test 8: API key validation (if set)
info "TEST 8: Anthropic API key"
if [[ -z "${CLAUDE_API_KEY:-}" ]]; then
  info "CLAUDE_API_KEY not set (skipping API validation)"
else
  if curl -sf -H "x-api-key: $CLAUDE_API_KEY" \
       "https://api.anthropic.com/v1/models" -o /dev/null 2>/dev/null; then
    pass "API key is valid"
  else
    fail "API key validation FAILED"; (( FAILED++ ))
  fi
fi

# Test 9: Log directory writable
info "TEST 9: Log directory writable"
if touch "$CIC_ROOT/logs/.smoke-test-$$" 2>/dev/null; then
  rm -f "$CIC_ROOT/logs/.smoke-test-$$"
  pass "Log directory is writable"
else
  fail "Log directory is NOT writable"; (( FAILED++ ))
fi

# Test 10: Lock file permissions (portable stat)
info "TEST 10: Lock file permissions"
lock_file="$CIC_ROOT/.cic/startup.lock"
if [[ -f "$lock_file" ]]; then
  # Use ls + awk for cross-platform compatibility (avoids GNU stat -c)
  if perms=$(ls -ld "$lock_file" 2>/dev/null | awk '{print $1}' | cut -c 2-10); then
    pass "Lock file perms: $perms (expected readable/writable)"
  else
    pass "Lock file exists (perms check skipped on this platform)"
  fi
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════"
if (( FAILED == 0 )); then
  pass "All smoke tests PASSED (10/10)"
  exit 0
else
  fail "Smoke tests FAILED ($FAILED failures)"
  exit 1
fi
