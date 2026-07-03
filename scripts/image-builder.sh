#!/bin/bash
# Image Builder Orchestrator v1.0.0
# Operator-grade Docker image building with drift detection, versioning, and health checks
# Usage: ./scripts/image-builder.sh [--env local|staging|prod] [--parallel N] [--skip-drift] [--force-rebuild]

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

ENV="local"
PARALLEL_JOBS=6
SKIP_DRIFT=0
FORCE_REBUILD=0
REGISTRY="local"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    --parallel) PARALLEL_JOBS="$2"; shift 2 ;;
    --skip-drift) SKIP_DRIFT=1; shift ;;
    --force-rebuild) FORCE_REBUILD=1; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

MANIFEST_FILE="docker/image-manifest.json"
METRICS_FILE="build-metrics.jsonl"
AUDIT_LOG="build-audit.log"
REPORT_FILE="build-report.json"

BUILD_DIR="docker/builds"
TEMP_DIR="/tmp/image-builder-$$"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# State
PHASE=0
BUILD_START=$(date +%s)
BUILDS_PASSED=0
BUILDS_FAILED=0
BUILDS_SKIPPED=0
DRIFT_DETECTED=0

# ============================================================================
# LOGGING
# ============================================================================

log_phase() {
  PHASE=$((PHASE + 1))
  echo -e "${BLUE}[PHASE $PHASE]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

log_fail() {
  echo -e "${RED}✗${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

audit_log() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $1" >> "$AUDIT_LOG"
}

metric_log() {
  echo "$1" >> "$METRICS_FILE"
}

# ============================================================================
# HELPERS
# ============================================================================

ensure_dir() {
  mkdir -p "$1"
}

get_service_config() {
  local service=$1
  jq -r ".services[\"$service\"]" "$MANIFEST_FILE" 2>/dev/null || echo "null"
}

get_dockerfile() {
  local service=$1
  jq -r ".services[\"$service\"].dockerfile" "$MANIFEST_FILE" 2>/dev/null
}

get_build_context() {
  local service=$1
  jq -r ".services[\"$service\"].context" "$MANIFEST_FILE" 2>/dev/null
}

get_build_order() {
  jq -r '.build_order[]' "$MANIFEST_FILE" 2>/dev/null
}

is_external_service() {
  local service=$1
  [[ $(jq -r ".services[\"$service\"].type // \"\"" "$MANIFEST_FILE") == "external" ]]
}

image_exists() {
  local service=$1
  docker images "$service" --quiet | grep -q . 2>/dev/null || return 1
}

get_image_label() {
  local service=$1
  local label=$2
  docker inspect "$service" --format="{{ index .Config.Labels \"$label\" }}" 2>/dev/null || echo ""
}

# ============================================================================
# PHASE 1: PRE-FLIGHT
# ============================================================================

phase_preflight() {
  log_phase "Pre-Flight Validation"

  # Check manifest
  if [[ ! -f "$MANIFEST_FILE" ]]; then
    log_fail "Manifest not found: $MANIFEST_FILE"
    return 1
  fi
  log_pass "Manifest found"

  # Validate JSON
  if ! jq empty "$MANIFEST_FILE" 2>/dev/null; then
    log_fail "Manifest JSON invalid"
    return 1
  fi
  log_pass "Manifest JSON valid"

  # Check Docker
  if ! command -v docker &> /dev/null; then
    log_fail "Docker not installed"
    return 1
  fi
  log_pass "Docker available"

  # Check docker-compose
  if ! docker-compose version &> /dev/null; then
    log_fail "docker-compose not available"
    return 1
  fi
  log_pass "docker-compose available"

  # Check Node.js (for drift detector)
  if ! command -v node &> /dev/null; then
    log_fail "Node.js not available (needed for drift detection)"
    return 1
  fi
  log_pass "Node.js available"

  # Create working directories
  ensure_dir "$BUILD_DIR"
  ensure_dir "$TEMP_DIR"
  log_pass "Working directories ready"

  # Count services
  local service_count=$(jq '.services | length' "$MANIFEST_FILE")
  local buildable_count=$(jq '[.services[] | select(.type != "external")] | length' "$MANIFEST_FILE")
  log_info "Found $service_count services ($buildable_count buildable)"

  return 0
}

# ============================================================================
# PHASE 2: DRIFT DETECTION
# ============================================================================

check_drift_for_service() {
  local service=$1
  local dockerfile=$(get_dockerfile "$service")
  local context=$(get_build_context "$service")

  if [[ "$dockerfile" == "null" || "$context" == "null" ]]; then
    return 0
  fi

  # Skip if image doesn't exist
  if ! image_exists "$service"; then
    return 0
  fi

  # Hash source directory
  local source_hash=$(find "$context" "$dockerfile" -type f 2>/dev/null | sort | xargs sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1)

  # Get image label
  local image_hash=$(get_image_label "$service" "build.source.hash")

  if [[ -z "$image_hash" ]]; then
    log_warn "Service $service: no source hash in image (old build?)"
    return 1
  fi

  if [[ "$source_hash" != "$image_hash" ]]; then
    log_warn "Service $service: drift detected (source changed, image stale)"
    DRIFT_DETECTED=$((DRIFT_DETECTED + 1))
    return 1
  fi

  return 0
}

phase_drift_detection() {
  log_phase "Drift Detection"

  local services=$(get_service_config "." | jq -r 'keys[]' 2>/dev/null)
  local drift_count=0

  for service in $services; do
    if is_external_service "$service"; then
      continue
    fi

    if ! check_drift_for_service "$service"; then
      drift_count=$((drift_count + 1))
    fi
  done

  if [[ $drift_count -gt 0 ]]; then
    log_warn "$drift_count services have source drift"
    DRIFT_DETECTED=$drift_count
    return 1
  fi

  log_pass "No source drift detected"
  return 0
}

# ============================================================================
# PHASE 3: PARALLEL BUILDS
# ============================================================================

build_service() {
  local service=$1
  local build_file="$BUILD_DIR/$service.build.log"
  local start_time=$(date +%s%N)

  # Skip external services
  if is_external_service "$service"; then
    BUILDS_SKIPPED=$((BUILDS_SKIPPED + 1))
    return 0
  fi

  local dockerfile=$(get_dockerfile "$service")
  local context=$(get_build_context "$service")

  if [[ "$dockerfile" == "null" || "$context" == "null" ]]; then
    log_warn "Service $service: missing build config"
    BUILDS_SKIPPED=$((BUILDS_SKIPPED + 1))
    return 0
  fi

  # Check if we should skip (fresh image + no drift)
  if image_exists "$service" && [[ $FORCE_REBUILD -eq 0 ]] && [[ $SKIP_DRIFT -eq 0 ]]; then
    if check_drift_for_service "$service" > /dev/null 2>&1; then
      log_info "Service $service: image fresh, skipping build"
      BUILDS_SKIPPED=$((BUILDS_SKIPPED + 1))
      return 0
    fi
  fi

  # Build
  local version_tag="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')-$(date +%s)"
  local image_name="$service:$version_tag"

  log_info "Building $service..."

  if docker build \
    --file "$dockerfile" \
    --tag "$image_name" \
    --tag "$service:latest" \
    --build-arg "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg "VERSION=$version_tag" \
    --label "build.source.hash=$(find "$context" "$dockerfile" -type f 2>/dev/null | sort | xargs sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1)" \
    --label "build.timestamp=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --label "build.git.sha=$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
    "$context" > "$build_file" 2>&1; then

    local end_time=$(date +%s%N)
    local duration_ms=$(( (end_time - start_time) / 1000000 ))
    local image_size=$(docker images "$image_name" --format "{{.Size}}")

    log_pass "Built $service ($image_size, ${duration_ms}ms)"
    BUILDS_PASSED=$((BUILDS_PASSED + 1))

    # Log metrics
    metric_log "{\"service\":\"$service\",\"timestamp\":\"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\",\"duration_ms\":$duration_ms,\"status\":\"pass\",\"version\":\"$version_tag\",\"size_bytes\":$(docker inspect "$image_name" --format '{{json .Size}}')}"

    audit_log "BUILD_PASS | $service | $version_tag | ${duration_ms}ms"

    return 0
  else
    log_fail "Build failed for $service (see $build_file)"
    BUILDS_FAILED=$((BUILDS_FAILED + 1))
    metric_log "{\"service\":\"$service\",\"timestamp\":\"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\",\"status\":\"fail\",\"error\":\"build failed\"}"
    audit_log "BUILD_FAIL | $service | build failed"
    return 1
  fi
}

phase_parallel_builds() {
  log_phase "Parallel Builds (max $PARALLEL_JOBS concurrent)"

  local build_order=$(get_build_order)
  local pids=()
  local active_jobs=0

  for service in $build_order; do
    # Rate-limit concurrency
    while [[ $active_jobs -ge $PARALLEL_JOBS ]]; do
      for i in "${!pids[@]}"; do
        if ! kill -0 "${pids[$i]}" 2>/dev/null; then
          unset "pids[$i]"
          active_jobs=$((active_jobs - 1))
        fi
      done
      sleep 0.1
    done

    # Start build in background
    build_service "$service" &
    pids+=($!)
    active_jobs=$((active_jobs + 1))
  done

  # Wait for all builds
  for pid in "${pids[@]}"; do
    wait "$pid" 2>/dev/null || true
  done

  log_info "Builds complete: $BUILDS_PASSED passed, $BUILDS_FAILED failed, $BUILDS_SKIPPED skipped"

  if [[ $BUILDS_FAILED -gt 0 ]]; then
    return 1
  fi

  return 0
}

# ============================================================================
# PHASE 4: HEALTH VERIFICATION
# ============================================================================

verify_service_health() {
  local service=$1
  local port=$(jq -r ".services[\"$service\"].port // \"\"" "$MANIFEST_FILE")
  local health_check=$(jq -r ".services[\"$service\"].health_check // \"\"" "$MANIFEST_FILE")

  if [[ -z "$port" || -z "$health_check" ]]; then
    return 0
  fi

  # Don't test external services
  if is_external_service "$service"; then
    return 0
  fi

  # Create temp container to verify health
  local container_name="test-$service-$$"
  local start_time=$(date +%s)

  if ! docker run --rm --name "$container_name" \
    --network cic-network \
    -d \
    -p "$port:$port" \
    "$service:latest" > /dev/null 2>&1; then
    log_fail "Service $service: failed to start container"
    return 1
  fi

  # Poll health check
  local timeout=30
  local elapsed=0

  while [[ $elapsed -lt $timeout ]]; do
    if eval "$health_check" > /dev/null 2>&1; then
      docker stop "$container_name" > /dev/null 2>&1 || true
      log_pass "Service $service: health verified"
      return 0
    fi

    elapsed=$((elapsed + 2))
    sleep 2
  done

  docker stop "$container_name" > /dev/null 2>&1 || true
  log_fail "Service $service: health check timeout"
  return 1
}

phase_health_verification() {
  log_phase "Health Verification"

  local services=$(get_build_order)
  local critical_services=$(jq -r '.services[] | select(.priority=="critical") | .name' "$MANIFEST_FILE" 2>/dev/null)

  log_info "Testing critical services..."
  for service in $critical_services; do
    if ! verify_service_health "$service"; then
      log_fail "Critical service $service failed health check"
      return 1
    fi
  done

  log_pass "All critical services healthy"
  return 0
}

# ============================================================================
# PHASE 5: CLEANUP & REPORTING
# ============================================================================

cleanup_dangling() {
  log_info "Cleaning up dangling images..."
  local removed=$(docker image prune -f --quiet 2>/dev/null | wc -l)
  log_pass "Removed $removed dangling images"
}

generate_report() {
  local end_time=$(date +%s)
  local duration=$((end_time - BUILD_START))
  local status="PASS"

  if [[ $BUILDS_FAILED -gt 0 ]]; then
    status="FAIL"
  fi

  cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "environment": "$ENV",
  "status": "$status",
  "duration_seconds": $duration,
  "builds": {
    "passed": $BUILDS_PASSED,
    "failed": $BUILDS_FAILED,
    "skipped": $BUILDS_SKIPPED
  },
  "drift": {
    "detected": $DRIFT_DETECTED
  },
  "files": {
    "metrics": "$METRICS_FILE",
    "audit_log": "$AUDIT_LOG"
  }
}
EOF

  cat "$REPORT_FILE"
  audit_log "SESSION_COMPLETE | status=$status | duration=${duration}s | passed=$BUILDS_PASSED | failed=$BUILDS_FAILED"
}

phase_cleanup_and_report() {
  log_phase "Cleanup & Reporting"

  cleanup_dangling
  generate_report

  if [[ $BUILDS_FAILED -gt 0 ]]; then
    log_fail "BUILDS FAILED"
    return 1
  fi

  log_pass "All builds passed"
  return 0
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  echo "Image Builder Orchestrator v1.0.0"
  echo "Environment: $ENV | Parallel: $PARALLEL_JOBS | Force Rebuild: $FORCE_REBUILD | Skip Drift: $SKIP_DRIFT"
  echo ""

  # Initialize logs
  : > "$AUDIT_LOG"
  : > "$METRICS_FILE"

  # Run phases
  if ! phase_preflight; then exit 1; fi
  if ! phase_drift_detection && [[ $SKIP_DRIFT -eq 0 ]]; then
    log_warn "Drift detected; rebuilding affected services"
  fi
  if ! phase_parallel_builds; then
    log_warn "Some builds failed (see $BUILD_DIR for logs)"
  fi
  if ! phase_cleanup_and_report; then exit 1; fi

  echo ""
  log_pass "Image builder completed successfully"
  audit_log "SESSION_SUCCESS"
}

main "$@"
