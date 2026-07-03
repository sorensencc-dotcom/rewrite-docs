---
title: "CANARY PHASE A PROD DEPLOYMENT CHECKLIST"
summary: "# Phase A Production Deployment (Option 2)"
created: "2026-07-03T19:43:45.339Z"
updated: "2026-07-03T19:43:45.339Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Phase A Production Deployment (Option 2)

**Goal**: Run actual Phase A on production infrastructure (10% TorqueQuery v2 traffic, 1h, real monitoring)

## Prerequisites (Must Complete Before Deployment)

### Infrastructure Setup

- [ ] TorqueQuery v2 FastAPI server deployed to production endpoint
  - Verify health: `curl https://prod-torquequery-v2:8000/health`
  - Response: `{"status": "ok", "version": "2.0.0"}`

- [ ] Load balancer / service mesh configured (nginx, Envoy, etc.)
  - Support traffic split (10% v2 / 90% v1)
  - Can be toggled dynamically without restart

- [ ] Production PostgreSQL schema updated
  - Run migrations from cic-ingestion/migrations/
  - Verify: `canary_state_history` table exists
  - Verify indices on: (proposalId, phase, timestamp)

- [ ] CIC ingestion adapters deployed
  - `cic-ingestion/src/adapters/torqueQueryV2.ts` in prod
  - `cic-ingestion/src/adapters/cloudProviderAdapter.ts` in prod
  - `cic-ingestion/src/adapters/grokMcpAdapter.ts` in prod
  - `cic-ingestion/src/config/cloudRoutingConfig.ts` deployed + writable at runtime

### Observability Setup

- [ ] Prometheus configured to scrape TorqueQuery v2 metrics
  - Endpoints:
    - `/metrics` for Prometheus scraping
    - Metrics exported: torquequery_search_*, torquequery_drift_*, torquequery_cache_*
  - Scrape interval: 15s
  - Retention: ≥1h

- [ ] Grafana dashboard created (8 panels)
  - Use CANARY_PHASE_A_DEPLOYMENT.md as specification
  - Test queries on prod Prometheus
  - Set dashboard refresh: 30s

- [ ] Alert rules configured in Prometheus
  - drift_critical: >0.20 for 2m
  - latency_regression: >120% baseline for 3m
  - cache_miss: <75% for 2m
  - pool_exhaustion: <30% available for 1m
  - Test alerts: trigger dummy alert → verify Slack/PagerDuty notification works

- [ ] Notification channels ready
  - Slack webhook configured (send to #canary-alerts or #engineering)
  - PagerDuty integration (if auto-escalation needed)
  - On-call engineer notified + has access to runbook

### Code Deployments

- [ ] All Phase 5 code merged to `main` and deployed
  - Commits: e366d2d, e0b3932, 73336d4, ee18f59
  - Verify: `git log --grep="Phase 5" | head -5`

- [ ] Harness validation report archived
  - phase-5-harness-report.json stored in audit log
  - Reference: all harnesses PASS, canary gate APPROVED

### Operator Readiness

- [ ] Runbook reviewed and printed
  - Location: C:\dev\CANARY_PHASE_A_DEPLOYMENT.md
  - Operator has copy + understands: gates, rollback triggers, decision tree

- [ ] Rollback procedure tested (dry-run)
  - Set cloudRoutingConfig.useV2 = false
  - Confirm 100% traffic routes to v1 within 30s
  - Restore cloudRoutingConfig.useV2 = true
  - **Critical**: No production impact, clean revert

- [ ] Monitoring dashboard tested
  - All 8 panels display real data from Prometheus
  - Queries return non-zero results
  - Alerts fire and resolve correctly

## Execution Steps

### Step 1: Pre-Flight (T-5 minutes)

```bash
# 1. Verify TorqueQuery v2 health
curl https://prod-torquequery-v2:8000/health

# 2. Verify database connectivity
psql -h prod-db -U cic -d ingestion -c "SELECT COUNT(*) FROM canary_state_history;"

# 3. Verify Prometheus scrape
curl http://prod-prometheus:9090/api/v1/query?query=torquequery_search_total | jq .

# 4. Verify alert rules
curl http://prod-prometheus:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.name | contains("drift"))'

# 5. Verify Grafana dashboard is rendering
open http://prod-grafana:3000/d/canary-phase-a

# 6. Verify notification channel
# Send test message via Slack API / PagerDuty webhook
```

### Step 2: Enable Traffic Split (T+0 minutes)

```bash
# Set load balancer to route 10% to v2, 90% to v1
# Method depends on your infra (nginx, Envoy, K8s service mesh, etc.)

# Example (nginx):
# Edit: /etc/nginx/conf.d/canary.conf
# Change: split_clients "${request_id}" $torque_backend { 10% v2; ~* v1; }
# Reload: nginx -s reload

# Verify split is active:
# Monitor v2 traffic volume for 1 minute, should see ~10% of total

echo "[$(date)] Phase A traffic split enabled (10% v2)" >> /var/log/canary-phase-a.log
```

### Step 3: Run Monitoring (T+0 to T+60 minutes)

**In terminal 1** (Monitoring Runner):

```powershell
# Run monitoring script on prod ops machine
# This queries Prometheus every 1 minute and makes go/no-go decisions

powershell -File C:\scripts\canary-phase-a-monitor.ps1 `
  -DurationMinutes 60 `
  -PrometheusUrl http://prod-prometheus:9090

# Expected output: 60 checkpoints, each marked PASS/WARN/FAIL/CRITICAL
# Exit code: 0 (promote), 1 (rollback), 2 (investigate)
```

**In terminal 2** (Live Dashboard Watch):

```bash
# Keep Grafana dashboard visible during full 60m
# Watch for:
# - Adoption curve climbing to ≥40%
# - Latency P99 staying ≤150ms
# - Drift staying <0.10
# - Error rate staying ≤0.2%
# - No alert rule triggers (or only transient ones)

open http://prod-grafana:3000/d/canary-phase-a
```

**In terminal 3** (On-Call Standby):

```bash
# Monitor alert channel (Slack #canary-alerts or PagerDuty)
# Be ready to trigger rollback if critical alert fires

# Rollback trigger (if manual decision needed):
psql -h prod-db -U cic -d ingestion -c \
  "UPDATE canary_routing_config SET use_v2 = false WHERE phase = 'A';"
```

### Step 4: Decision at T+60 minutes

**Outcome A: All Gates PASS (Expected)**

```
✅ Adoption ≥40% (e.g., 65%)
✅ Latency P99 ≤150ms (e.g., 137ms)
✅ Drift <0.10 (e.g., 0.061)
✅ Error rate ≤0.2% (e.g., 0.02%)

Action: PROMOTE TO PHASE B
- Update memory with Phase A results
- Extend traffic split to 50% v2 / 50% v1
- Schedule Phase B start (typically T+2h after Phase A ends)
- Archive monitoring data + checkpoints
```

**Outcome B: Gates FAIL (Unlikely)**

```
❌ Critical event detected (e.g., drift >0.20, error >0.5%, latency >200ms)

Action: ROLLBACK IMMEDIATELY
- Execute rollback: set cloudRoutingConfig.useV2 = false
- Verify 100% traffic reverted to v1 (within 30s)
- Page on-call engineer
- Capture error logs, metrics, checkpoint history
- Schedule post-mortem (investigate root cause)
```

**Outcome C: Gates WARN (Possible)**

```
⚠ Some gates near threshold (e.g., adoption 38%, latency 155ms)

Action: INVESTIGATE OR EXTEND
- Option 1: Extend Phase A by 30m, re-run monitoring
- Option 2: Investigate anomaly (check TorqueQuery v2 logs, DB queries)
- Option 3: Abort and roll back (if confidence low)
```

## Post-Phase A (If Promotion)

1. **Update Memory**
   - Add Phase A results: final adoption, latency, drift, error
   - Note: timestamp, duration, any anomalies

2. **Archive Checkpoints**
   - Export phase-5-canary-phase-a-checkpoints.jsonl from prod-prometheus
   - Store in audit log: `/prod-audit/phase-a-checkpoints-{timestamp}.jsonl`

3. **Configure Phase B**
   - Update traffic split: 50% v2 / 50% v1
   - Extend monitoring interval: 2 hours (instead of 1h)
   - Phase B gates (more lenient):
     - Adoption ≥55%
     - Latency P99 ≤160ms (allows slight drift degradation)
     - Drift <0.12 (slightly higher threshold)
     - Error rate ≤0.3%

4. **Schedule Phase C**
   - If Phase B also PASS: schedule Phase C (100% v2, 30m)
   - Phase C gates (most lenient, full production):
     - Adoption ≥60%
     - Latency P99 ≤180ms
     - Drift <0.15
     - Error rate ≤0.5%

## Rollback Reference

**Automatic Rollback Trigger** (if operator unavailable):

```bash
# In production, configure alert rule to auto-execute rollback script
# when critical conditions detected for 2+ consecutive checks

# Script: /prod-scripts/auto-rollback.sh
#!/bin/bash
psql -h prod-db -U cic -d ingestion -c "UPDATE canary_routing_config SET use_v2 = false;"
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{"channel":"#canary-alerts","text":"Auto-rollback triggered: Phase A failed"}
EOF
```

## Success Criteria Summary

| Gate | Target | Failure | Critical |
|------|--------|---------|----------|
| Adoption | ≥40% | <30% | N/A |
| Latency P99 | ≤150ms | >200ms | >250ms |
| Drift | <0.10 | ≥0.15 | >0.20 |
| Error Rate | ≤0.2% | >0.5% | >1.0% |

---

**Status**: Ready for production execution  
**Estimated Duration**: 60 minutes  
**Rollback Time**: <2 minutes  
**Token Savings (if succeeds)**: $298K/year
