---
title: "CANARY GATES"
summary: "# Canary Gates & Fire Drills — M2 Execution"
created: "2026-07-03T19:43:45.327Z"
updated: "2026-07-03T19:43:45.327Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Canary Gates & Fire Drills — M2 Execution

Complete validation framework for M2 workstreams (A, B, C) before promotion to production.

## Overview

**Canary Gates** validate workstream completion against M2 criteria.  
**Fire Drills** validate system resilience under failure conditions (executed after all gates pass).

---

## Canary Gates

Each workstream must pass its canary gate before proceeding to the next.

### Gate Criteria

#### Workstream A: Budget Ledger DB Wiring
```
✅ Test Pass Rate ≥ 98%
✅ Schema Validation (budget_ledger_v3 exists)
✅ Load Test P95 (Ledger) < 15ms
✅ Governance Hook Latency < 50ms
✅ Write Success Rate ≥ 99.5%
✅ No Open Blockers
```

#### Workstream B: SLO Controller + Prometheus
```
✅ Test Pass Rate ≥ 98%
✅ Prometheus Scrape Success 100%
✅ Burn-Rate Accuracy ±1%
✅ Canary Abort Latency < 200ms
✅ No Open Blockers
```

#### Workstream C: Adapter Gateway Caching
```
✅ Test Pass Rate ≥ 98%
✅ Cache Hit Rate ≥ 85%
✅ Load Test P95 (Cache) < 40ms
✅ Cache Stampede Prevention (no incidents)
✅ Stale Data Rate 0%
✅ No Open Blockers
```

---

## Running Canary Gates

### Individual Workstream Gate

```bash
# Validate Workstream A
npm run canary-gates:A

# Validate Workstream B
npm run canary-gates:B

# Validate Workstream C
npm run canary-gates:C
```

### All Gates (Diagnostic)

```bash
npm run canary-gates
```

### Example Output

```
🚀 Validating Canary Gates for Workstream: A
============================================================

✅ Test Pass Rate
   Value: 98.45 | Threshold: 98
   98.45% >= 98%

✅ Schema Validation
   Value: true | Threshold: true
   budget_ledger_v3 schema found

✅ Load Test P95 (Ledger)
   Value: 12ms | Threshold: 15ms
   12ms <= 15ms

✅ Governance Hook Latency
   Value: 38ms | Threshold: 50ms
   38ms p95 <= 50ms

✅ Open Blockers
   Value: 0 | Threshold: 0
   No blockers

============================================================
Decision: 🟢 GATE PASSES - Ready for promotion

Report saved to: canary-report-A-1782178940985289.json
```

---

## Fire Drills

Executed **after all canary gates (A, B, C) pass**.  
Validates system resilience under failure scenarios.

### Scenarios

#### 1. Budget Exhaustion Simulation
- Simulate budget ledger at 100% capacity
- Verify write rejection with proper error
- Confirm canary gate triggers abort
- Validate rollback within 300ms

#### 2. SLO Burn-Rate Spike Simulation
- Generate 5x load spike
- Verify burn-rate detection (< 5s)
- Confirm alert fired
- Validate canary gate evaluation

#### 3. Adapter Degradation Simulation
- Mock 50% adapter error rate
- Verify error detection
- Confirm caching fallback
- Validate service availability

#### 4. Canary Rollback Simulation
- Deploy new version
- Trigger canary abort
- Monitor rollback (< 300ms)
- Verify data integrity

---

## Running Fire Drills

```bash
# All fire drills (after A/B/C gates pass)
npm run fire-drills
```

### Example Output

```
======================================================================
🚀 M2 FIRE DRILL EXECUTION
======================================================================
Prerequisites: Workstreams A, B, C must pass canary gates

🔥 Running: Budget Exhaustion Simulation
   Simulate budget ledger reaching 100% utilization
   ✅ Validations (3/3):
   ✅ Write rejected with proper error message: Ledger write correctly rejected with 503 CAPACITY_EXCEEDED
   ✅ Canary gate triggers abort: Canary gate detected budget exhaustion
   ✅ Rollback succeeds within 300ms: Rollback completed in 187ms
   Duration: 2341ms

🔥 Running: SLO Burn-Rate Spike Simulation
   [...]

======================================================================
📊 FIRE DRILL REPORT
======================================================================
Summary: 4/4 drills passed

🟢 ALL DRILLS PASS — System resilience validated
======================================================================

Report saved to: fire-drill-report-1782178940985289.json
```

---

## M2 Gate Decision Matrix

### Pass Conditions
- ✅ Workstream A canary gate PASS
- ✅ Workstream B canary gate PASS
- ✅ Workstream C canary gate PASS
- ✅ All fire drills PASS
- ✅ No critical blockers open

### Fail Conditions
- ❌ Any canary gate FAIL
- ❌ Any fire drill FAIL
- ❌ Open blocker issues exist

---

## M2 Execution Timeline

```
Day 1 (Today)
├─ Workstream A Kickoff          ✅ DONE
├─ Workstream B/C Staging        Parallel prep
└─ Canary Gates Prep            ✅ DONE (this task)

Day 2-3
├─ Workstream A Development      In progress
├─ Workstream B Development      In parallel
├─ Workstream C Development      In parallel
└─ Daily Canary Gate Checks      On demand

When A/B/C Complete
├─ Final Canary Gate Validation  Required
├─ Fire Drill Execution          Sequential
└─ M2 Gate Decision              Pass/Fail determination

Target Gate: 2026-06-22 18:00 UTC
```

---

## Configuration

Edit `canary-gates-config.json` to:
- Adjust threshold values
- Add/remove validation criteria
- Customize fire-drill scenarios
- Update promotion criteria

---

## Troubleshooting

### Gate Fails on Test Pass Rate
```bash
npm test              # Run full test suite
npm test -- --watch  # Debug specific failures
```

### Schema Validation Fails
```bash
# Check schema file exists
ls -la db/schemas/budget_ledger_v3.sql

# Validate schema syntax
npm run build && npm test -- --testNamePattern=schema
```

### Load Test Results Missing
```bash
# Ensure load tests have run
npm run test:load

# Check results file
cat cic/load-tests/results.json
```

### Fire Drill Fails
```bash
# Review drill output
cat fire-drill-report-*.json | jq .

# Check individual scenario logs
grep "Budget Exhaustion" *.log
```

---

## Integration with CI/CD

Add to GitHub Actions workflow:

```yaml
# Before promotion to staging
- name: Canary Gates — Workstream A
  run: npm run canary-gates:A

- name: Canary Gates — Workstream B
  run: npm run canary-gates:B

- name: Canary Gates — Workstream C
  run: npm run canary-gates:C

# If all gates pass
- name: Fire Drills
  run: npm run fire-drills

# If fire drills pass, promote
- name: Promote to Staging
  run: ./scripts/promote-to-staging.sh
```

---

## References

- **M2 Build Plan:** See root README for full Workstream A/B/C specifications
- **GitHub Issue:** https://github.com/sorensencc-dotcom/cic-os/issues/2
- **Slack Channel:** #cic-dev
- **Gate Target:** 2026-06-22 18:00 UTC
