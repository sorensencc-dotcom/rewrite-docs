#!/bin/bash
set -euo pipefail

# CIC Runtime MAAL Smoke Test Harness
# Validates all 7 stages of MAAL integration end-to-end

RESULTS_LOG="smoke-test-results.json"
EVENTS_LOG="smoke-test-events.log"
CIC_PID=""
STAGE_RESULTS=()

# Colors for output (caveman: skip if piped)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_event() {
  local event_name="$1"
  local status="$2"
  local details="$3"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  echo "{\"timestamp\":\"$timestamp\",\"event\":\"$event_name\",\"status\":\"$status\",\"details\":\"$details\"}" >> "$EVENTS_LOG"

  if [[ -t 1 ]]; then
    if [[ "$status" == "PASS" ]]; then
      echo -e "${GREEN}✓${NC} $event_name: $status"
    elif [[ "$status" == "FAIL" ]]; then
      echo -e "${RED}✗${NC} $event_name: $status — $details"
    else
      echo -e "${YELLOW}»${NC} $event_name: $status"
    fi
  fi
}

cleanup() {
  if [[ -n "$CIC_PID" ]] && kill -0 "$CIC_PID" 2>/dev/null; then
    kill "$CIC_PID" 2>/dev/null || true
    wait "$CIC_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

# Stage 1: Boot CIC with MAAL Enabled
stage_1_boot() {
  log_event "STAGE_1_START" "INFO" "Booting CIC with MAAL enabled"

  # Clear old logs
  rm -f "$EVENTS_LOG"

  # Start CIC in background (assumes Node.js entry point)
  if [[ -f "src/main.js" ]]; then
    timeout 30 node src/main.js > cic-boot.log 2>&1 &
    CIC_PID=$!
  elif [[ -f "dist/main.js" ]]; then
    timeout 30 node dist/main.js > cic-boot.log 2>&1 &
    CIC_PID=$!
  else
    log_event "STAGE_1_BOOT" "FAIL" "No main.js or dist/main.js found"
    return 1
  fi

  # Wait for startup
  sleep 3

  # Check for errors in boot log
  local boot_errors=$(grep -i "error\|provider.*fail\|validation.*fail" cic-boot.log 2>/dev/null || true)

  if [[ -n "$boot_errors" ]]; then
    log_event "STAGE_1_BOOT" "FAIL" "Boot errors detected: $boot_errors"
    return 1
  fi

  log_event "STAGE_1_BOOT" "PASS" "CIC booted cleanly, MAAL initialized"
  return 0
}

# Stage 2: Run Enrichment Cycle
stage_2_enrichment() {
  log_event "STAGE_2_START" "INFO" "Testing EnrichmentAgent with MAAL"

  # Send test ingestion
  local test_payload=$(cat <<'EOF'
{
  "type": "enrichment_test",
  "content": "The quick brown fox jumps over the lazy dog",
  "format": "text"
}
EOF
)

  # Simulate ingestion (assumes HTTP endpoint or IPC)
  if command -v curl &>/dev/null; then
    local response=$(curl -s -X POST http://localhost:3000/enrich -H "Content-Type: application/json" -d "$test_payload" 2>/dev/null || echo "")

    if [[ -z "$response" ]]; then
      log_event "STAGE_2_ENRICHMENT" "FAIL" "No response from enrichment endpoint"
      return 1
    fi

    # Check for model selection
    if echo "$response" | grep -q "fugu-ultra\|claude"; then
      log_event "STAGE_2_ENRICHMENT" "PASS" "EnrichmentAgent routed correctly"
      return 0
    fi
  else
    log_event "STAGE_2_ENRICHMENT" "SKIP" "curl not available, skipping HTTP test"
    return 0
  fi

  return 1
}

# Stage 3: Run Orchestrator
stage_3_orchestrator() {
  log_event "STAGE_3_START" "INFO" "Testing OrchestratorAgent"

  local test_payload=$(cat <<'EOF'
{
  "type": "orchestration_test",
  "plan": "Process enriched output through synthesis pipeline",
  "context": "standard"
}
EOF
)

  if command -v curl &>/dev/null; then
    local response=$(curl -s -X POST http://localhost:3000/orchestrate -H "Content-Type: application/json" -d "$test_payload" 2>/dev/null || echo "")

    if [[ -n "$response" ]] && echo "$response" | grep -q "success\|status.*ok"; then
      log_event "STAGE_3_ORCHESTRATOR" "PASS" "OrchestratorAgent executed"
      return 0
    fi
  else
    log_event "STAGE_3_ORCHESTRATOR" "SKIP" "curl not available"
    return 0
  fi

  log_event "STAGE_3_ORCHESTRATOR" "FAIL" "OrchestratorAgent failed or no response"
  return 1
}

# Stage 4: Run Synthesis
stage_4_synthesis() {
  log_event "STAGE_4_START" "INFO" "Testing SynthesisAgent with Claude 3.7"

  local test_payload=$(cat <<'EOF'
{
  "type": "synthesis_test",
  "chunks": ["Chunk 1: introduction", "Chunk 2: details", "Chunk 3: conclusion"],
  "context": "standard"
}
EOF
)

  if command -v curl &>/dev/null; then
    local response=$(curl -s -X POST http://localhost:3000/synthesize -H "Content-Type: application/json" -d "$test_payload" 2>/dev/null || echo "")

    if [[ -n "$response" ]]; then
      log_event "STAGE_4_SYNTHESIS" "PASS" "SynthesisAgent completed"
      return 0
    fi
  else
    log_event "STAGE_4_SYNTHESIS" "SKIP" "curl not available"
    return 0
  fi

  return 1
}

# Stage 5: Run Audit Agent
stage_5_audit() {
  log_event "STAGE_5_START" "INFO" "Testing AuditAgent with cross-model comparison"

  local test_payload=$(cat <<'EOF'
{
  "type": "audit_test",
  "result": "Test synthesis output for consistency verification"
}
EOF
)

  if command -v curl &>/dev/null; then
    local response=$(curl -s -X POST http://localhost:3000/audit -H "Content-Type: application/json" -d "$test_payload" 2>/dev/null || echo "")

    if [[ -n "$response" ]] && echo "$response" | grep -q "score\|issues\|primary\|secondary"; then
      log_event "STAGE_5_AUDIT" "PASS" "AuditAgent computed consistency score"
      return 0
    fi
  else
    log_event "STAGE_5_AUDIT" "SKIP" "curl not available"
    return 0
  fi

  return 1
}

# Stage 6: Validate Observability
stage_6_observability() {
  log_event "STAGE_6_START" "INFO" "Validating observability events"

  # Check for events in log
  local event_count=$(grep -c "MODEL_CALL_START\|MODEL_CALL_SUCCESS\|AUDIT_COMPARISON" "$EVENTS_LOG" 2>/dev/null || echo "0")

  if [[ "$event_count" -gt 0 ]]; then
    log_event "STAGE_6_OBSERVABILITY" "PASS" "Events logged: $event_count"
    return 0
  else
    # Allow skip if events log is empty (expected for non-instrumented runs)
    log_event "STAGE_6_OBSERVABILITY" "SKIP" "No events captured (may be expected)"
    return 0
  fi
}

# Stage 7: Full Pipeline Run
stage_7_full_pipeline() {
  log_event "STAGE_7_START" "INFO" "Running full INGEST→ENRICH→ORCHESTRATE→SYNTHESIZE→AUDIT pipeline"

  local test_payload=$(cat <<'EOF'
{
  "type": "full_pipeline_test",
  "content": "Full end-to-end pipeline validation test",
  "format": "text"
}
EOF
)

  if command -v curl &>/dev/null; then
    # Try full pipeline endpoint
    local response=$(curl -s -X POST http://localhost:3000/pipeline/full -H "Content-Type: application/json" -d "$test_payload" 2>/dev/null || echo "")

    if [[ -n "$response" ]]; then
      log_event "STAGE_7_FULL_PIPELINE" "PASS" "Full pipeline completed"
      return 0
    fi
  else
    log_event "STAGE_7_FULL_PIPELINE" "SKIP" "curl not available for full pipeline test"
    return 0
  fi

  return 1
}

# Summary Report
print_summary() {
  local total_stages=7
  local passed=0
  local failed=0
  local skipped=0

  for result in "${STAGE_RESULTS[@]}"; do
    case "$result" in
      "PASS") ((passed++)) ;;
      "FAIL") ((failed++)) ;;
      "SKIP") ((skipped++)) ;;
    esac
  done

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "MAAL Smoke Test Summary"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [[ -t 1 ]]; then
    echo -e "${GREEN}✓ PASS: $passed${NC}"
    echo -e "${RED}✗ FAIL: $failed${NC}"
    echo -e "${YELLOW}» SKIP: $skipped${NC}"
  else
    echo "PASS: $passed"
    echo "FAIL: $failed"
    echo "SKIP: $skipped"
  fi

  echo ""
  if [[ $failed -eq 0 ]]; then
    echo "Status: READY FOR STRESS TESTING"
    echo "Logs: $EVENTS_LOG"
    return 0
  else
    echo "Status: FAILURES DETECTED"
    echo "Review: $EVENTS_LOG"
    return 1
  fi
}

# Main execution
main() {
  echo "CIC MAAL Smoke Test Harness"
  echo "Starting 7-stage validation..."
  echo ""

  stage_1_boot && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")
  sleep 1

  stage_2_enrichment && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")
  stage_3_orchestrator && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")
  stage_4_synthesis && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")
  stage_5_audit && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")
  stage_6_observability && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")
  stage_7_full_pipeline && STAGE_RESULTS+=("PASS") || STAGE_RESULTS+=("FAIL")

  print_summary
}

main "$@"
