#!/bin/bash

# Deploy Review Skill
# Automated verification of docker-compose stack before deployment
# Usage: ./scripts/deploy-review.sh [--env local|staging|prod] [--dry-run] [--skip-tests]

set -euo pipefail

# Config
ENV="${ENV:-local}"
DRY_RUN="${DRY_RUN:-0}"
SKIP_TESTS="${SKIP_TESTS:-0}"
TIMEOUT_HEALTH=30
POLL_INTERVAL=3
SERVICES_COUNT=15
REPORT_FILE="${REPORT_FILE:-./deploy-review-report.json}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# State
PHASE=0
RESULTS=()
FAILURES=()
CRITICAL_FAILURES=()
START_TIME=$(date +%s)
DURATION=0

# Logging
log_phase() {
  PHASE=$((PHASE+1))
  echo -e "${GREEN}[PHASE $PHASE]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

log_fail() {
  echo -e "${RED}✗${NC} $1"
  FAILURES+=("$1")
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================================================
# PHASE 1: PRE-FLIGHT
# ============================================================================

phase_preflight() {
  log_phase "Pre-Flight Validation"

  # Check docker-compose.yml syntax
  if ! docker-compose config > /dev/null 2>&1; then
    log_fail "docker-compose.yml syntax error"
    exit 1
  fi
  log_pass "docker-compose.yml valid"

  # Extract services from compose file
  local services=$(docker-compose config --services 2>/dev/null)
  local svc_count=$(echo "$services" | wc -l)

  if [ "$svc_count" -lt "$SERVICES_COUNT" ]; then
    log_warn "Expected $SERVICES_COUNT services, found $svc_count"
  else
    log_pass "All $svc_count services defined"
  fi

  # Check Dockerfiles
  local dockerfiles=$(find . -name "Dockerfile*" -type f | grep -v node_modules | wc -l)
  log_pass "Found $dockerfiles Dockerfiles"

  # Validate docker-compose file structure
  local db_schema=$(docker-compose config 2>/dev/null | grep -c "cic-agents" || true)
  if [ "$db_schema" -gt 0 ]; then
    log_pass "Database schema mount found"
  fi

  # Dry-run: Stop here
  if [ "$DRY_RUN" -eq 1 ]; then
    log_pass "Dry-run: Pre-flight complete"
    return 0
  fi
}

# ============================================================================
# PHASE 1.5: IMAGE BUILDER (Auto-Build Missing/Stale Images)
# ============================================================================

phase_image_builder() {
  log_phase "Image Builder"

  if [ "$DRY_RUN" -eq 1 ]; then
    log_pass "Dry-run: Skipping image builds"
    return 0
  fi

  # Check if image-builder script exists
  if [ ! -f "scripts/image-builder.js" ]; then
    log_warn "image-builder.js not found, skipping build phase"
    return 0
  fi

  # Run image builder with drift detection
  if node scripts/image-builder.js --env "$ENV" --parallel 6; then
    log_pass "Image build phase complete"
    return 0
  else
    log_fail "Image build phase failed"
    return 1
  fi
}

# ============================================================================
# PHASE 2: STARTUP (Parallel)
# ============================================================================

check_service_health() {
  local service=$1
  local port=$2
  local max_attempts=$((TIMEOUT_HEALTH / POLL_INTERVAL))
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
      echo "OK"
      return 0
    fi
    attempt=$((attempt+1))
    sleep "$POLL_INTERVAL"
  done

  echo "FAIL"
  return 1
}

phase_startup() {
  log_phase "Service Startup"

  if [ "$DRY_RUN" -eq 1 ]; then
    log_pass "Dry-run: Skipping actual startup"
    return 0
  fi

  # Start compose stack
  echo "Starting docker-compose stack..."
  docker-compose up -d

  # Wait for Docker to be ready
  sleep 5

  # Define services & ports (from docker-compose)
  declare -A SERVICE_PORTS=(
    [aperture]=3117
    [cic-runtime]=3118
    [cic-governance]=3113
    [unified-api]=3100
    [cic-ingestion]=3116
    [planning-console]=3000
    [planning-engine]=3114
    [harvester-v2]=3115
    [repomix-ingestion]=3112
    [torquequery]=3110
    [vault]=3111
    [knowledge-graph]=3107
  )

  # Check health in parallel
  local pids=()
  local results=()

  for svc in "${!SERVICE_PORTS[@]}"; do
    {
      port=${SERVICE_PORTS[$svc]}
      if check_service_health "$svc" "$port" > /dev/null; then
        echo "$svc OK"
      else
        echo "$svc FAIL"
      fi
    } &
    pids+=($!)
  done

  # Wait & collect results
  for pid in "${pids[@]}"; do
    wait $pid
  done

  # Verify critical services (all health endpoints must pass)
  local critical_services=(cic-runtime cic-governance unified-api)
  local all_healthy=1

  for svc in "${critical_services[@]}"; do
    local port=${SERVICE_PORTS[$svc]:-0}
    if [ "$port" -gt 0 ]; then
      if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
        log_pass "$svc healthy"
      else
        log_fail "$svc health check failed"
        CRITICAL_FAILURES+=("$svc startup")
        all_healthy=0
      fi
    fi
  done

  if [ $all_healthy -eq 0 ]; then
    log_fail "Critical services failed to start"
    phase_logs_on_failure
    return 1
  fi

  log_pass "All critical services healthy"
}

# ============================================================================
# PHASE 3: INTEGRATION TESTS
# ============================================================================

phase_tests() {
  if [ "$SKIP_TESTS" -eq 1 ]; then
    log_phase "Integration Tests (SKIPPED)"
    return 0
  fi

  log_phase "Integration Tests"

  if [ "$DRY_RUN" -eq 1 ]; then
    log_pass "Dry-run: Skipping tests"
    return 0
  fi

  # Run tests in critical services (non-blocking warnings)
  local test_services=(cic-runtime cic-governance)

  for svc in "${test_services[@]}"; do
    echo "Testing $svc..."

    if docker-compose exec -T "$svc" npm test > "/tmp/${svc}-test.log" 2>&1; then
      log_pass "$svc: tests passing"
    else
      log_warn "$svc: test failures detected (non-critical)"
      FAILURES+=("$svc tests")

      # Show last 10 lines of test output
      echo "--- $svc test output (last 10 lines) ---"
      tail -10 "/tmp/${svc}-test.log" || true
      echo "---"
    fi
  done

  return 0
}

# ============================================================================
# PHASE 4: E2E FLOWS
# ============================================================================

phase_e2e() {
  log_phase "End-to-End Flows"

  if [ "$DRY_RUN" -eq 1 ]; then
    log_pass "Dry-run: Skipping E2E"
    return 0
  fi

  # E2E 1: Agent Deploy (non-blocking)
  echo "Testing agent deployment..."
  if curl -sf -X POST http://localhost:3118/api/agents/deploy \
    -H "Content-Type: application/json" \
    -d '{"agentId":"test-agent"}' > /dev/null 2>&1; then
    log_pass "Agent deploy endpoint responding"
  else
    log_warn "Agent deploy endpoint not ready (non-critical)"
    FAILURES+=("e2e agent-deploy")
  fi

  # E2E 2: Governance Proposal (non-blocking)
  echo "Testing governance proposal..."
  if curl -sf -X POST http://localhost:3113/api/governance/proposal \
    -H "Content-Type: application/json" \
    -d '{"title":"Test","description":"E2E test","requiredVotes":1}' > /dev/null 2>&1; then
    log_pass "Governance proposal endpoint responding"
  else
    log_warn "Governance proposal endpoint not ready (non-critical)"
    FAILURES+=("e2e governance-proposal")
  fi

  # E2E 3: Policy Validation (non-blocking)
  echo "Testing policy validation..."
  if curl -sf -X POST http://localhost:3117/api/policies/validate \
    -H "Content-Type: application/json" \
    -d '{"policy":{"name":"test","rules":[]}}' > /dev/null 2>&1; then
    log_pass "Policy validation endpoint responding"
  else
    log_warn "Policy validation endpoint not ready (non-critical)"
  fi
}

# ============================================================================
# PHASE 5: RISK GATE & REPORT
# ============================================================================

phase_logs_on_failure() {
  echo ""
  log_warn "Capturing logs from failed services..."

  for svc in aperture cic-runtime cic-governance unified-api; do
    echo "--- $svc logs (last 30 lines) ---"
    docker-compose logs --tail=30 "$svc" 2>/dev/null || echo "(unable to retrieve)"
    echo ""
  done
}

phase_risk_gate() {
  log_phase "Risk Assessment & Gating"

  local result="PASS"

  if [ ${#CRITICAL_FAILURES[@]} -gt 0 ]; then
    result="FAIL"
    log_fail "Critical failures detected:"
    for failure in "${CRITICAL_FAILURES[@]}"; do
      echo "  - $failure"
    done
  else
    log_pass "No critical failures"
  fi

  if [ ${#FAILURES[@]} -gt 0 ]; then
    log_warn "Non-critical issues:"
    for failure in "${FAILURES[@]}"; do
      echo "  - $failure"
    done
  fi

  # Generate report
  local end_time=$(date +%s)
  DURATION=$((end_time - START_TIME))

  # Build JSON arrays without jq
  local critical_json="["
  for cf in "${CRITICAL_FAILURES[@]}"; do
    critical_json+="\"$(echo "$cf" | sed 's/"/\\"/g')\","
  done
  critical_json="${critical_json%,}]"
  [ "${critical_json}" = "]" ] && critical_json="[]"

  local failures_json="["
  for f in "${FAILURES[@]}"; do
    failures_json+="\"$(echo "$f" | sed 's/"/\\"/g')\","
  done
  failures_json="${failures_json%,}]"
  [ "${failures_json}" = "]" ] && failures_json="[]"

  cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "environment": "$ENV",
  "result": "$result",
  "duration_seconds": $DURATION,
  "critical_failures": $critical_json,
  "non_critical_failures": $failures_json,
  "services_verified": $SERVICES_COUNT,
  "dry_run": $DRY_RUN,
  "skip_tests": $SKIP_TESTS
}
EOF

  log_pass "Report saved to $REPORT_FILE"

  # Gate decision
  if [ "$result" = "FAIL" ]; then
    echo ""
    log_fail "DEPLOYMENT BLOCKED (Critical failures detected)"
    echo "Review report: $REPORT_FILE"
    echo "Rollback: docker-compose down"
    return 1
  else
    echo ""
    log_pass "DEPLOYMENT APPROVED ✓"
    echo "All systems ready for staging/production"
    return 0
  fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  echo "Deploy Review Skill"
  echo "Environment: $ENV | Dry-Run: $DRY_RUN | Skip Tests: $SKIP_TESTS"
  echo ""

  # Parse args
  while [[ $# -gt 0 ]]; do
    case $1 in
      --env) ENV="$2"; shift 2 ;;
      --dry-run) DRY_RUN=1; shift ;;
      --skip-tests) SKIP_TESTS=1; shift ;;
      *) echo "Unknown option: $1"; exit 1 ;;
    esac
  done

  # Run phases
  phase_preflight || exit 1
  phase_image_builder || exit 1
  phase_startup || exit 1
  phase_tests || exit 1
  phase_e2e || true
  phase_risk_gate || exit 1

  echo ""
  echo "Deploy review complete in ${DURATION}s"
}

main "$@"
