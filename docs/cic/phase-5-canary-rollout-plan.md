---
title: Phase 5 Canary Rollout Plan
date: 2026-07-02
version: 1.0.0
status: Production-Ready
summary: ""
created: "2026-07-03T19:44:37.771Z"
updated: "2026-07-03T19:44:37.771Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Phase 5: TorqueQuery v2 Canary Rollout & Monitoring

## Executive Summary

Phase 5 optimization delivers 3 layers: console caching (Phase 1), JSONL segmentation (Phase 2), governance cache (Phase 3), TorqueQuery fast-path (Phase 4), warm pool reuse (Phase 5). Canary rollout gates on harness validation (drift < 0.15, latency improvement >10%), then proceeds A (10%) → B (50%) → C (100%) with automatic rollback if drift > 0.20.

---

## Pre-Canary Validation Gate

**Run Phase 5 harness orchestrator**:

```bash
cd c:\dev\cic-ingestion
npm run test:phase-5-harnesses
# Output: phase-5-harness-report.json
```

**Passing criteria** (all required):

| Criterion | Threshold | Success |
|-----------|-----------|---------|
| MAAL routing drift | < 0.15 avg | Top result match ≥ 4/5 |
| CIC ingestion match | ≥ 80% | Top doc match, latency < baseline |
| Drift scoring PASS | ≥ 4/5 | Fail count = 0 |
| TorqueQuery /health | 200 OK | < 100ms response |

If **any criterion fails** → investigate, fix, re-run harnesses before proceeding.

---

## Canary Deployment Architecture

```
Production Load
      ↓
   Router
   ├─→ Canary Pool (% traffic)
   │   ├─ TorqueQuery v2 (fast-path enabled)
   │   ├─ Cloud gateway (Grok MCP + Routing)
   │   ├─ Metrics collection (fast-path adoption, latency, drift)
   │   └─ Rollback monitor (drift > 0.20 trigger)
   │
   └─→ Stable Pool (% traffic)
       └─ Current slow-path (baseline, no changes)

Telemetry → Prometheus → Grafana Dashboard → Alert rules
```

---

## Canary Phase A: 10% Traffic (1 hour)

**Deploy**:
- Single canary shard with Phase 5 enabled
- TorqueQuery v2 on separate instance (port 8001, load-balanced)
- Cloud gateway operational (Grok MCP + Routing rules live)
- Metrics forwarded to staging Prometheus

**Monitoring gates** (check every 5 min):

| Metric | Pass Threshold | Warn | Fail (Rollback) |
|--------|---|---|---|
| Fast-path adoption | ≥ 40% | 20-40% | < 20% (no uptake) |
| Latency P99 | ≤ 150ms (vs 250ms baseline) | ≤ 200ms | > 250ms (slower) |
| Drift score | < 0.10 | 0.10-0.15 | ≥ 0.20 (auto-rollback) |
| Error rate | ≤ 0.2% | 0.2-0.5% | > 0.5% |
| Container reuse | ≥ 30% | 15-30% | < 15% (pool ineffective) |

**Rollback trigger**: Drift ≥ 0.20 or error rate > 1% for >2 consecutive checks.

**Exit criteria** (after 1 hour):
- ✅ All pass thresholds met
- ✅ No customer-facing errors
- ✅ Fast-path adoption ≥ 40%

**Next**: Proceed to Canary B (50%).

---

## Canary Phase B: 50% Traffic (2 hours)

**Deploy**:
- 2-3 canary shards, staggered rollout
- Auto-scale warm pool based on container reuse (<30% → scale up)
- Enable advanced monitoring (per-collection drift, per-route latency)
- Alert on drift drift > 0.15 (warning level)

**Monitoring gates** (check every 10 min):

| Metric | Pass Threshold | Warn | Fail (Rollback) |
|--------|---|---|---|
| Fast-path adoption | ≥ 55% | 40-55% | < 40% |
| Latency P50/P95/P99 | Baseline -10% / -15% / -20% | Baseline -5% | Baseline (no improvement) |
| Drift score | < 0.12 | 0.12-0.18 | ≥ 0.20 |
| Cache hit rate | ≥ 85% | 75-85% | < 75% |
| Error rate | ≤ 0.3% | 0.3-0.7% | > 1.0% |

**Health checks**:
- Canary vs stable query latency ratio: must be < 1.1x
- Top-k result matching: must be ≥ 90%
- Memory usage in warm pool: no unbounded growth (check per 30min)

**Exit criteria** (after 2 hours):
- ✅ All pass thresholds sustained
- ✅ Fast-path adoption ≥ 55%
- ✅ Latency P99 improved >15%
- ✅ No cumulative errors

**Next**: Proceed to Canary C (100%) or hold B if warnings present.

---

## Canary Phase C: 100% Traffic (30 min bake-in)

**Deploy**:
- Full rollout to all shards
- Disable fallback to slow-path (commit to fast-path)
- Monitor for 30 min for stable state

**Final validation**:

| Metric | Target |
|--------|--------|
| Fast-path adoption | ≥ 60% (per deployment guide target) |
| Latency P99 | ≤ 180ms (20%+ improvement vs baseline 250ms) |
| Drift score | < 0.15 (acceptance threshold) |
| Governance cache hit | > 90% |
| Container reuse | > 50% |
| Error rate | ≤ 0.2% |

**Post-deployment**:
- Lock Phase 5 configuration
- Archive harness reports in audit log
- Generate token ROI analysis (baseline vs optimized tokens, 5-phase impact)

---

## Automatic Rollback Plan

**Trigger condition**: Drift score > 0.20 for > 2 consecutive monitoring checks.

**Rollback steps**:
1. Stop canary ingestion (disable fast-path flag in all requests)
2. Re-route traffic to stable pool (slow-path, full MMR/RRF)
3. Trigger alert: "Phase 5 rollback due to drift > 0.20"
4. Post-incident: Analyze root cause (candidate pool reduction, embedding normalization, schema drift)

**Partial rollback** (if only 1-2 shards fail):
- Isolate failing shard
- Revert TorqueQuery config on that shard only
- Keep canary on healthy shards
- Investigate shard-specific issue

---

## Monitoring Dashboard (Grafana)

**Phase 5 Canary Board** (create in Prometheus):

Panels:

1. **Fast-path Adoption %** (stacked: fast=true vs fast=false)
2. **Latency Distribution** (P50/P95/P99 overlaid: canary vs stable)
3. **Drift Score Heatmap** (per collection, real-time < 0.20 threshold line)
4. **Query Volume by Route** (architecture/search/routing/governance/execution)
5. **Container Reuse Rate %** (warm pool efficiency)
6. **Cache Hit Rates** (query cache, governance cache)
7. **Error Rate %** (5xx, timeout, schema validation)
8. **Top Query Latencies** (slowest 5 queries, time series)

**Alerts**:

```yaml
alerts:
  - name: phase5_drift_critical
    condition: drift_score > 0.20 for 2m
    action: trigger_rollback()
  
  - name: phase5_latency_regression
    condition: latency_p99 > baseline_p99 * 1.2 for 5m
    action: page_oncall()
  
  - name: phase5_cache_miss
    condition: cache_hit_rate < 0.75 for 10m
    action: scale_up_cache()
  
  - name: phase5_pool_exhaustion
    condition: container_reuse < 0.30 for 10m
    action: scale_up_pool()
```

---

## Token ROI Analysis (Post-Deployment)

After Phase C stabilizes, compute savings:

**Baseline** (slow-path only, before Phase 5):
- Query cost per search: full MMR (N embeddings) + RRF ranking
- Example: 100 API calls/hour × 50 docs × 100 embeddings = 500K tokens/hour

**Optimized** (all 5 phases):

| Phase | Optimization | Token Reduction |
|-------|---|---|
| 1 (Console metrics) | 10ms TTL cache | 5% (reuse within cache window) |
| 2 (JSONL segmentation) | Index-based filtering | 10% (skip redundant segments) |
| 3 (Governance cache) | 500ms context cache | 8% (reuse caps/thresholds) |
| 4 (TorqueQuery fast) | Skip MMR/RRF on 60% queries | 25% (no diversity scoring) |
| 5 (Warm pool) | Container reuse (200ms vs 1500ms) | 3% (faster startup = less retry) |

**Combined savings**:
- Baseline: 500K tokens/hour
- Phase 1: 500K × 0.95 = 475K
- Phase 2: 475K × 0.90 = 427.5K
- Phase 3: 427.5K × 0.92 = 393.3K
- Phase 4: 393.3K × 0.75 = 294.975K
- Phase 5: 294.975K × 0.97 = 286.326K

**Result**: 286K tokens/hour (43% reduction from 500K baseline).

**Monthly ROI** (assume 24h × 30d at avg rate):
- Baseline cost: 500K × 720h = 360M tokens/month
- Optimized cost: 286K × 720h = 206M tokens/month
- **Savings: 154M tokens/month (~$77/month at $0.0005/1K tokens)**

---

## Rollback Procedure (Manual)

If automatic rollback doesn't trigger but operators want to pause:

```bash
# 1. Disable fast-path in all running instances
curl -X POST http://localhost:3100/admin/phase-5-disable \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"fast_path": false, "reason": "manual_rollback"}'

# 2. Wait for in-flight requests to drain (30s)
sleep 30

# 3. Verify all requests now use slow-path
curl http://localhost:3100/metrics | grep fast_path_adoption
# Should show 0%

# 4. Monitor drift score for 5 min (should return to baseline ~0.05)
# Then restart canary with tuning if needed
```

---

## Configuration Files

**TorqueQuery v2 Config** (cic-ingestion/src/config/cloudRoutingConfig.ts):
```typescript
const rules = [
  {
    model: 'grok-mcp-ops',
    provider: 'grok-mcp',
    max_latency_ms: 800,
    max_tokens: 2048,
    priority: 10
  },
  {
    model: 'grok-rt-general',
    provider: 'grok-routing',
    max_latency_ms: 1500,
    max_tokens: 4096,
    priority: 5
  }
];
```

**Canary Feature Flag** (enable/disable fast-path per shard):
```json
{
  "phase5_enabled": true,
  "fast_path_skip_mmr": true,
  "candidate_pool_reduction": true,
  "warm_pool_enabled": true,
  "governance_cache_ttl_ms": 500,
  "query_cache_ttl_ms": 1000,
  "metrics_cache_ttl_ms": 10,
  "rollback_drift_threshold": 0.20
}
```

---

## Deployment Checklist

Pre-canary:
- [ ] Harness report: phase-5-harness-report.json (all PASS)
- [ ] TorqueQuery v2 server deployed on staging (port 8001)
- [ ] Cloud gateway endpoints tested (Grok MCP + Routing)
- [ ] Prometheus scrape config updated for canary metrics
- [ ] Grafana dashboard created (8 panels, 3 alerts)
- [ ] Rollback procedure documented + tested
- [ ] On-call notified of Phase 5 canary window

During canary:
- [ ] Monitor every 5 min (Phase A), 10 min (Phase B)
- [ ] Log all drift/latency/adoption metrics to audit trail
- [ ] Trigger rollback if drift > 0.20 for 2+ checks
- [ ] Document any warnings/anomalies in incident log

Post-canary:
- [ ] Stabilization soak (30 min Phase C at 100%)
- [ ] Compute token ROI analysis
- [ ] Lock Phase 5 configuration in git
- [ ] Archive harness reports + deployment logs
- [ ] Write post-mortem (if any rollbacks occurred)

---

## Support & Escalation

**Issue**: Fast-path adoption stuck < 40%
- **Cause**: Requests not sending `fast_path=true` flag
- **Fix**: Audit request construction in AutonomyAPIServer; verify flag propagation
- **Escalate**: Check torqueQueryV2.ts adapter for request schema mismatch

**Issue**: Drift score > 0.20
- **Cause**: Candidate pool reduction losing top results, or embedding normalization drift
- **Fix**: Increase candidate_pool_reduction from 50% back to 70%; verify Jaccard distance
- **Escalate**: Compare fast-path vs slow-path result schemas at field level

**Issue**: Latency P99 > baseline
- **Cause**: Warm pool not reusing containers, or cloud gateway routing latency
- **Fix**: Check container TTL (should be 10min); verify Grok MCP endpoint latency <800ms
- **Escalate**: Enable verbose logging in WarmPoolManager.ts to trace executor lifecycle

**Issue**: Governance cache hit rate < 75%
- **Cause**: Cache TTL too short (500ms) for request patterns
- **Fix**: Increase TTL to 1000ms; audit hitRates() endpoint for misses
- **Escalate**: Check if governance context is changing unexpectedly

---

## References

- Phase 5 Deployment Guide: `PHASE_5_TORQUEQUERY_V2_DEPLOYMENT_GUIDE.md`
- Determinism Audit: `determinism-validation-checklist.md`
- TorqueQuery v2 Schema: `PHASE_5_TORQUEQUERY_V2_DEPLOYMENT_GUIDE.md` § Critical Validation
- Cloud Gateway Config: `cic-ingestion/src/config/cloudRoutingConfig.ts`
- Harness Reports: `phase-5-harness-report.json` (generated post-run)

---

**Deployment Owner**: Operations  
**Approval Gate**: Harness PASS (all 3), Drift < 0.15  
**Confidence**: HIGH (determinism-audited, schema-validated, 3-phase harnesses)  
**Next Phase**: Post-canary token ROI report + Phase 6 cost optimization planning  

