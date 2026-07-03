---
title: "CANARY PHASE A DEPLOYMENT"
summary: "# Canary Phase A Deployment (10% Traffic, 1h Duration)"
created: "2026-07-03T19:43:45.333Z"
updated: "2026-07-03T19:43:45.333Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Canary Phase A Deployment (10% Traffic, 1h Duration)

**Start**: 2026-07-02 ~17:30 UTC  
**Duration**: 60 minutes  
**Target**: TorqueQuery v2 FastAPI (localhost:8000 → production endpoint)  
**Rollback Trigger**: Drift >0.20 OR error rate >0.5% OR latency P99 >200ms

## Pre-Flight Checklist

- [ ] TorqueQuery v2 /health returns {"status": "ok", "version": "2.0.0"}
- [ ] Production database verified (schema + indices)
- [ ] Grafana dashboard created with 8 monitoring panels
- [ ] Alert rules configured (drift_critical, latency_regression, cache_miss, pool_exhaustion)
- [ ] CloudRoutingConfig.ts deployed with explicit routing rules
- [ ] CIC ingestion adapters (torqueQueryV2.ts, cloudProviderAdapter.ts, grokMcpAdapter.ts) in prod
- [ ] Harness validation report (phase-5-harness-report.json) archived
- [ ] Operator on-call notified + runbook accessible
- [ ] Rollback procedure tested (safe state revert confirmed)

## Traffic Routing Configuration

**Load Balancer / nginx / Envoy config**:

```
# 10% to TorqueQuery v2 (fast-path enabled)
# 90% to TorqueQuery v1 (slow-path baseline)

upstream torquequery_v2 {
  server production-torquequery-v2:8000;
}

upstream torquequery_v1 {
  server production-torquequery-v1:8000;
}

# Canary routing (10/90 split)
split_clients "${request_id}" $torque_backend {
  10% torquequery_v2;
  ~* torquequery_v1;
}

server {
  location /search {
    proxy_pass http://$torque_backend;
    proxy_set_header X-Torque-Version $torque_backend;
    add_response_header X-Canary-Phase "A";
  }
}
```

## Monitoring Gates (Per-Minute Checks, 60 cycles)

### Gate 1: Fast-Path Adoption

```promql
# Percentage of requests using fast-path
(
  rate(torquequery_search_fast_path_total[1m]) /
  rate(torquequery_search_total[1m])
) * 100

# Target: ≥40%
# Failure threshold: <30% (indicates slow adoption or misconfiguration)
```

### Gate 2: Latency P99

```promql
# P99 latency
histogram_quantile(0.99, rate(torquequery_search_latency_ms_bucket[1m]))

# Target: ≤150ms
# Failure threshold: >200ms (regression detected)
```

### Gate 3: Drift Score

```promql
# Average drift between v1 baseline and v2 fast-path
rate(torquequery_drift_score_sum[1m]) / rate(torquequery_drift_score_count[1m])

# Target: <0.10
# Critical threshold: >0.20 (auto-rollback trigger)
```

### Gate 4: Error Rate

```promql
# Percentage of failed requests
(
  rate(torquequery_search_errors_total[1m]) /
  rate(torquequery_search_total[1m])
) * 100

# Target: ≤0.2%
# Failure threshold: >0.5%
```

## Monitoring Dashboard (8 Panels)

### Panel 1: Fast-Path Adoption Over Time
- X: Time (minute 0–60)
- Y: Adoption % (0–100)
- Target band: ≥40% (green zone)
- Alert: Drops below 30%

### Panel 2: Latency P50 / P95 / P99 Timeline
- X: Time (minute 0–60)
- Y: Latency (ms)
- Lines: P50 (green), P95 (yellow), P99 (red)
- Target: P99 ≤150ms

### Panel 3: Drift Heatmap (per-bucket)
- X: Query bucket (100 buckets)
- Y: Drift score (0–1.0)
- Color: Blue (low) → Red (high)
- Critical zone: >0.20 (triggers auto-rollback)

### Panel 4: Request Volume
- X: Time (minute 0–60)
- Y: Requests/min (0–5000)
- Stacked: v2 (blue), v1 (gray)
- Expected: ~10% v2 traffic

### Panel 5: Cache Hit Rate
- X: Time (minute 0–60)
- Y: Hit % (0–100)
- Target: ≥85%

### Panel 6: Error Rate Over Time
- X: Time (minute 0–60)
- Y: Error % (0–1.0)
- Target: ≤0.2%
- Alert: >0.5%

### Panel 7: Latency by Percentile (Box Plot)
- X: v1 baseline (gray), v2 fast-path (blue)
- Y: Latency (ms)
- Shows: P25, P50, P75, P95, P99
- Success metric: v2 whiskers shorter than v1

### Panel 8: Top-Match Correctness
- X: Time (minute 0–60)
- Y: % exact match with v1 baseline
- Target: ≥95% (5% is acceptable variance for fast-path approximation)

## Alert Rules

### Alert: drift_critical

```yaml
alert: drift_critical
expr: |
  (rate(torquequery_drift_score_sum[1m]) / rate(torquequery_drift_score_count[1m])) > 0.20
for: 2m
annotations:
  summary: "Canary Phase A drift >0.20 for 2+ min. Consider rollback."
  action: "trigger_auto_rollback() if persistent"
```

### Alert: latency_regression

```yaml
alert: latency_regression
expr: |
  (histogram_quantile(0.99, rate(torquequery_search_latency_ms_bucket[1m])) /
   histogram_quantile(0.99, rate(torquequery_search_latency_ms_bucket[5m] offset 30m))) > 1.20
for: 3m
annotations:
  summary: "P99 latency increased >20% vs baseline."
  action: "investigate; may indicate pool exhaustion"
```

### Alert: cache_miss

```yaml
alert: cache_miss
expr: |
  (rate(torquequery_cache_hits[1m]) /
   (rate(torquequery_cache_hits[1m]) + rate(torquequery_cache_misses[1m]))) < 0.75
for: 2m
annotations:
  summary: "Cache hit rate <75%. Pool size may be insufficient."
```

### Alert: pool_exhaustion

```yaml
alert: pool_exhaustion
expr: |
  (sum(torquequery_pool_available) / sum(torquequery_pool_total)) < 0.30
for: 1m
annotations:
  summary: "Warm pool availability <30%. Risk of fallback to cold search."
```

## Per-Minute Checkpoint Template

Create Prometheus rules to log checkpoint every 60 seconds:

```json
{
  "timestamp": "2026-07-02T17:30:00Z",
  "minute": 0,
  "adoption_pct": 0.0,
  "latency_p99_ms": 0.0,
  "drift_score": 0.0,
  "error_rate_pct": 0.0,
  "volume_total": 0,
  "volume_v2": 0,
  "cache_hit_pct": 0.0,
  "gate_status": "NOT_STARTED",
  "notes": ""
}
```

## Rollback Decision Logic

Run decision tree every minute:

```
if (drift > 0.20 for 2+ consecutive checks):
  → trigger immediate rollback
  → reason: "Drift critical"
  → action: set cloudRoutingConfig.useV2 = false

else if (error_rate > 0.5% for 2+ consecutive checks):
  → trigger immediate rollback
  → reason: "Error rate spike"
  → action: set cloudRoutingConfig.useV2 = false

else if (latency_p99 > 200ms for 3+ consecutive checks):
  → trigger immediate rollback
  → reason: "Latency regression"
  → action: set cloudRoutingConfig.useV2 = false

else if (adoption < 30% after 5m):
  → investigate routing config
  → possible causes: traffic split misconfigured, v2 server unavailable
  → action: verify TorqueQuery v2 /health endpoint

else if (all gates PASS at 60m mark):
  → decision: PROCEED TO PHASE B (50% traffic, 2h)
  → timestamp canary A completion
  → archive checkpoints + monitoring dashboard
```

## Rollback Execution (If Triggered)

1. **Immediate**: Set `cloudRoutingConfig.useV2 = false`
2. **Verify**: Confirm 100% traffic routed to v1 within 30s
3. **Notify**: Slack alert + on-call engineer page
4. **Analyze**: Export minute-level checkpoint data + error logs
5. **Decision**: Post-mortem if rollback, or re-attempt Phase A if transient issue

## Success Criteria (Phase A → Phase B Promotion)

✅ **All gates PASS**:
- Adoption: final ≥40%
- Latency P99: final ≤150ms
- Drift: final <0.10 (no critical events)
- Error rate: final ≤0.2% (no spikes >0.5%)

✅ **Post-gate checks**:
- Top-match correctness ≥95%
- Cache hit rate ≥85%
- No alert triggers >1 consecutive check
- Operator sign-off

✅ **Promotion action**:
- Update memory with Phase A results
- Archive phase-5-checkpoints.jsonl
- Configure Phase B traffic split (50%)
- Schedule Phase B start (2h duration)

## Operator Runbook

**During Phase A**:
1. Monitor Grafana dashboard every 5 minutes
2. Acknowledge any alerts (confirm manual review)
3. Log notes in checkpoint JSON (anomalies, observations)
4. If rollback triggered: execute rollback + notify team

**At 60m mark**:
1. Freeze traffic routing (hold 10/90 split)
2. Aggregate 60 checkpoint records
3. Calculate final drift / adoption / latency / error
4. Apply decision logic (promote vs. re-test vs. abort)
5. Document verdict + next phase action

---

**Deployment Status**: Ready for operator execution  
**Harness Validation**: ✅ APPROVED (phase-5-harness-report.json)  
**Token ROI**: $298K/year savings (once fully deployed)
