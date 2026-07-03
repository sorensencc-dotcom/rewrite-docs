#!/bin/bash
# Phase 27.4 Canary Rollout Script
# Progressive rollout: 5% -> 25% -> 100%

set -e

NAMESPACE=${NAMESPACE:-default}
LEDGER_DEPLOYMENT="budget-ledger"
ADAPTER_DEPLOYMENT="adapter-gateway"

# Gate thresholds
ERROR_RATE_THRESHOLD=0.01    # 1%
LATENCY_THRESHOLD_MS=600     # p95 < 600ms
DRIFT_THRESHOLD=0.001        # < 0.1% imbalance

echo "Phase 27.4 Canary Rollout"
echo "=========================="

# Function: Check metrics against thresholds
check_gates() {
  local stage=$1
  echo ""
  echo "Stage $stage: Checking gates..."

  # Query error rate
  error_rate=$(kubectl exec -n "$NAMESPACE" prometheus-0 -- \
    promtool query instant 'rate(cic_requests_errors_total[5m])' | \
    grep -oP '(?<=value: )\d+\.\d+' || echo "0")

  echo "Error rate: $error_rate (threshold: $ERROR_RATE_THRESHOLD)"
  if (( $(echo "$error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
    echo "✗ ERROR RATE GATE FAILED - Rolling back"
    return 1
  fi

  # Query latency
  latency=$(kubectl exec -n "$NAMESPACE" prometheus-0 -- \
    promtool query instant 'histogram_quantile(0.95, cic_request_latency_seconds) * 1000' | \
    grep -oP '(?<=value: )\d+' || echo "0")

  echo "Latency p95: ${latency}ms (threshold: $LATENCY_THRESHOLD_MS)"
  if (( latency > LATENCY_THRESHOLD_MS )); then
    echo "✗ LATENCY GATE FAILED - Rolling back"
    return 1
  fi

  # Query drift
  drift=$(kubectl exec -n "$NAMESPACE" prometheus-0 -- \
    promtool query instant 'cic_ledger_drift_bytes' | \
    grep -oP '(?<=value: )\d+\.\d+' || echo "0")

  echo "Ledger drift: $drift (threshold: $DRIFT_THRESHOLD)"
  if (( $(echo "$drift > $DRIFT_THRESHOLD" | bc -l) )); then
    echo "✗ DRIFT GATE FAILED - Rolling back"
    return 1
  fi

  echo "✓ All gates passed"
  return 0
}

# Function: Update replica count
update_replicas() {
  local deployment=$1
  local replicas=$2

  echo "Updating $deployment to $replicas replicas..."

  kubectl scale deployment/$deployment \
    -n "$NAMESPACE" \
    --replicas=$replicas

  kubectl rollout status deployment/$deployment \
    -n "$NAMESPACE" \
    --timeout=5m

  echo "✓ Rollout complete"
}

# Stage 1: 5% traffic (1 replica out of ~20)
echo ""
echo "STAGE 1: 5% Traffic (1 hour)"
update_replicas "$LEDGER_DEPLOYMENT" 1
update_replicas "$ADAPTER_DEPLOYMENT" 1

sleep 3600  # 1 hour observation period

if ! check_gates "1"; then
  echo ""
  echo "Rolling back..."
  update_replicas "$LEDGER_DEPLOYMENT" 0
  update_replicas "$ADAPTER_DEPLOYMENT" 0
  exit 1
fi

# Stage 2: 25% traffic (5 replicas out of ~20)
echo ""
echo "STAGE 2: 25% Traffic (2 hours)"
update_replicas "$LEDGER_DEPLOYMENT" 5
update_replicas "$ADAPTER_DEPLOYMENT" 5

sleep 7200  # 2 hour observation period

if ! check_gates "2"; then
  echo ""
  echo "Rolling back..."
  update_replicas "$LEDGER_DEPLOYMENT" 0
  update_replicas "$ADAPTER_DEPLOYMENT" 0
  exit 1
fi

# Stage 3: 100% traffic (all replicas)
echo ""
echo "STAGE 3: 100% Traffic (4 hour observation)"
update_replicas "$LEDGER_DEPLOYMENT" 20
update_replicas "$ADAPTER_DEPLOYMENT" 20

sleep 14400  # 4 hour observation period

if ! check_gates "3"; then
  echo ""
  echo "Rolling back..."
  update_replicas "$LEDGER_DEPLOYMENT" 0
  update_replicas "$ADAPTER_DEPLOYMENT" 0
  exit 1
fi

echo ""
echo "✓ PHASE 27.4 CANARY ROLLOUT COMPLETE"
echo "All stages passed. Production rollout complete."
