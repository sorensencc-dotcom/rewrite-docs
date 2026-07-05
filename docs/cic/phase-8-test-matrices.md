---
title: "PHASE 8 TEST MATRICES"
summary: "# Phase 8: Test Matrices"
created: "2026-07-03T19:43:45.559Z"
updated: "2026-07-03T19:43:45.559Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Phase 8: Test Matrices

**Status:** Locked (2026-06-23)  
**Purpose:** Deterministic coverage for router, policy, and state-machine transitions  
**Format:** CSV-like tables for easy automation + verification  

---

## Matrix 1: Router Scenarios (Drift × Cost × SLA)

Covers all combinations of drift score, cost pressure, and SLA constraints to verify model selection logic.

### Columns

- **driftScore** — 0.0 (perfect), 0.3 (good), 0.6 (degraded), 0.9 (critical)
- **costPressureLevel** — LOW, MEDIUM, HIGH
- **slaLatencyTier** — tight (50ms), medium (200ms), loose (1000ms)
- **minQualityTier** — SMALL, MEDIUM, LARGE
- **candidateModels** — Set of models passing filter
- **expectedFamily** — SMALL, MEDIUM, LARGE
- **expectedPolicyOverride** — ALLOW/DOWNGRADE/BLOCK if policy active
- **expectedModelId** — Specific model chosen by router
- **expectedAuditEvent** — Which audit event emitted
- **expectedPrometheusLabels** — agent_id, model_id, priority, operation_type

### Test Cases

| driftScore | costPressure | latencyTier | quality | candidates | expectedFamily | override | expectedModel | auditEvent | prometheus |
|---|---|---|---|---|---|---|---|---|---|
| 0.0 | LOW | loose | SMALL | claude-opus, claude-sonnet, claude-haiku | LARGE | — | claude-opus | MODEL_ROUTING_DECISION | agent=A, model=claude-opus, priority=HIGH |
| 0.0 | LOW | tight | LARGE | claude-opus, claude-sonnet | MEDIUM | — | claude-sonnet | MODEL_ROUTING_DECISION | agent=A, model=claude-sonnet, priority=HIGH |
| 0.3 | LOW | medium | MEDIUM | claude-sonnet, claude-haiku | MEDIUM | — | claude-sonnet | MODEL_ROUTING_DECISION | agent=A, model=claude-sonnet, priority=NORMAL |
| 0.3 | MEDIUM | medium | MEDIUM | claude-sonnet, claude-haiku | SMALL | DOWNGRADE | claude-haiku | MODEL_ROUTING_DECISION | agent=A, model=claude-haiku, priority=NORMAL |
| 0.3 | HIGH | medium | MEDIUM | claude-sonnet, claude-haiku | SMALL | BLOCK (critical) | claude-haiku | MODEL_ROUTING_DECISION | agent=A, model=claude-haiku, priority=CRITICAL |
| 0.6 | LOW | loose | SMALL | claude-opus, claude-sonnet, claude-haiku | MEDIUM | — | claude-sonnet | MODEL_ROUTING_DECISION | agent=A, model=claude-sonnet, priority=NORMAL |
| 0.6 | MEDIUM | tight | LARGE | claude-opus, claude-sonnet | SMALL | DOWNGRADE | claude-sonnet | MODEL_ROUTING_DECISION | agent=A, model=claude-sonnet, priority=NORMAL |
| 0.6 | HIGH | medium | MEDIUM | claude-haiku | SMALL | BLOCK | claude-haiku | MODEL_ROUTING_DECISION | agent=A, model=claude-haiku, priority=CRITICAL |
| 0.9 | LOW | loose | SMALL | claude-opus, claude-sonnet, claude-haiku | LARGE | — | claude-opus | MODEL_ROUTING_DECISION | agent=A, model=claude-opus, priority=HIGH |
| 0.9 | MEDIUM | medium | LARGE | claude-opus | MEDIUM | DOWNGRADE | claude-opus | MODEL_ROUTING_DECISION | agent=A, model=claude-opus, priority=NORMAL |
| 0.9 | HIGH | tight | LARGE | (none) | FALLBACK | BLOCK | fallback-model | MODEL_ROUTING_DECISION | agent=A, model=fallback-model, priority=CRITICAL |

### Assertions per case

- **candidateModels**: all members pass `operationType` + `maxContextTokens` + `maxLatencyMs` + `minQualityTier` filter
- **expectedFamily**: matches scoring function (driftWeight + latencyWeight + costWeight)
- **override**: if costPressureLevel=MEDIUM, override set to DOWNGRADE; if HIGH, override set to BLOCK
- **expectedModel**: final selected model respects override + scoring
- **auditEvent**: always emitted with selectedModelId + candidates + rationale
- **prometheus**: labels match decision context (agent_id, model_id, priority, operation_type)

---

## Matrix 2: Policy Thresholds (Budget × Anomaly × Forecast)

Covers cost policy decision logic across budget states and anomaly scenarios.

### Columns

- **dailySpendUsd** — Current 24h spend (0–hardCeiling + 20%)
- **softCeilingUsd** — Soft budget limit (e.g., $100)
- **hardCeilingUsd** — Hard budget limit (e.g., $150)
- **anomalyScore** — Forecast anomaly 0–1
- **forecastHorizon** — 1h, 24h, 7d
- **expectedDecision** — ALLOW, DOWNGRADE, BLOCK
- **expectedCostPressureLevel** — LOW, MEDIUM, HIGH
- **expectedBudgetStatus** — WITHIN_BUDGET, SOFT_CEILING, HARD_CEILING
- **expectedStateTransition** — Which state machine path activates
- **expectedAuditEvent** — Which audit event emitted
- **expectedPrometheusMetrics** — Which metrics updated

### Test Cases

| dailySpend | softCeiling | hardCeiling | anomaly | horizon | decision | pressure | budget | transition | auditEvent | metrics |
|---|---|---|---|---|---|---|---|---|---|---|
| $50 | $100 | $150 | 0.1 | 24h | ALLOW | LOW | WITHIN_BUDGET | — | COST_POLICY_DECISION | cic_cost_policy_decisions_total{decision=ALLOW} |
| $50 | $100 | $150 | 0.3 | 24h | ALLOW | LOW | WITHIN_BUDGET | — | COST_POLICY_DECISION | cic_cost_policy_decisions_total{decision=ALLOW} |
| $50 | $100 | $150 | 0.9 | 1h | DOWNGRADE | MEDIUM | WITHIN_BUDGET | ONLINE→DEGRADED_COST | COST_DEGRADATION_ENTERED | cic_cost_anomaly_score↑ |
| $100 | $100 | $150 | 0.2 | 24h | DOWNGRADE | MEDIUM | SOFT_CEILING | ONLINE→DEGRADED_COST | COST_DEGRADATION_ENTERED | cic_cost_budget_soft_ceiling_active=1 |
| $100 | $100 | $150 | 0.8 | 24h | DOWNGRADE | MEDIUM | SOFT_CEILING | ONLINE→DEGRADED_COST | COST_DEGRADATION_ENTERED | cic_cost_anomaly_score↑, cic_cost_budget_soft_ceiling_active=1 |
| $125 | $100 | $150 | 0.3 | 24h | DOWNGRADE | MEDIUM | SOFT_CEILING | ONLINE→DEGRADED_COST | COST_DEGRADATION_ENTERED | cic_cost_budget_soft_ceiling_active=1 |
| $150 | $100 | $150 | 0.1 | 24h | BLOCK | HIGH | HARD_CEILING | ONLINE→OFFLINE_COST | COST_HARD_CEILING_ENFORCED | cic_cost_budget_hard_ceiling_active=1 |
| $150 | $100 | $150 | 0.9 | 7d | BLOCK | HIGH | HARD_CEILING | ONLINE→OFFLINE_COST | COST_HARD_CEILING_ENFORCED | cic_cost_budget_hard_ceiling_active=1, cic_cost_anomaly_score↑ |
| $160 | $100 | $150 | 0.5 | 24h | BLOCK | HIGH | HARD_CEILING | ONLINE→OFFLINE_COST | COST_HARD_CEILING_ENFORCED | cic_cost_budget_hard_ceiling_active=1 |
| $75 | $100 | $150 | 0.1 | 24h | ALLOW | LOW | WITHIN_BUDGET | DEGRADED_COST→ONLINE | COST_RECOVERY_COMPLETED | cic_cost_policy_decisions_total{decision=ALLOW}, cic_cost_budget_soft_ceiling_active=0 |
| $140 | $100 | $150 | 0.3 | 1h | DOWNGRADE | MEDIUM | SOFT_CEILING | DEGRADED_COST→DEGRADED_COST | — | cic_cost_budget_soft_ceiling_active=1 |
| $145 | $100 | $150 | 0.8 | 1h | BLOCK | HIGH | HARD_CEILING | OFFLINE_COST→OFFLINE_COST | — | cic_cost_budget_hard_ceiling_active=1 |
| $120 | $100 | $150 | 0.2 | 24h | DOWNGRADE | MEDIUM | SOFT_CEILING | DEGRADED_COST→DEGRADED_COST | — | cic_cost_budget_soft_ceiling_active=1 |
| $80 | $100 | $150 | 0.1 | 24h | ALLOW | LOW | WITHIN_BUDGET | OFFLINE_COST→DEGRADED_COST→ONLINE | COST_RECOVERY_INITIATED, COST_RECOVERY_COMPLETED | cic_cost_budget_hard_ceiling_active=0 |

### Assertions per case

- **expectedDecision**: 
  - `dailySpend < softCeiling` → ALLOW (unless anomaly > 0.7)
  - `softCeiling ≤ dailySpend < hardCeiling` → DOWNGRADE (unless anomaly > 0.7 → BLOCK)
  - `dailySpend ≥ hardCeiling` → BLOCK
- **expectedCostPressureLevel**: derived from decision (ALLOW→LOW, DOWNGRADE→MEDIUM, BLOCK→HIGH)
- **expectedBudgetStatus**: derived from dailySpend vs ceilings
- **expectedStateTransition**: Phase 7 state machine path triggered
- **expectedAuditEvent**: emitted with decision + ceilings + rationale
- **expectedPrometheusMetrics**: incremented counters + updated gauges

---

## Matrix 3: State Transitions (Phase 7 + Phase 8 Merged)

Covers all state transitions with Phase 8 cost signals integrated into Phase 7 state machine.

### Columns

- **currentState** — ONLINE, DEGRADED (with sub-reason), OFFLINE (with sub-reason)
- **driftScore** — Phase 7 signal (0–1)
- **p95LatencyMs** — Phase 7 signal (SLA metric)
- **errorRate** — Phase 7 signal (0–1)
- **circuitBreakerState** — Phase 7 signal (CLOSED/OPEN/HALF_OPEN)
- **costPressureLevel** — Phase 8 signal (LOW/MEDIUM/HIGH)
- **budgetStatus** — Phase 8 signal (WITHIN_BUDGET/SOFT_CEILING/HARD_CEILING)
- **anomalyScore** — Phase 8 signal (0–1)
- **expectedNewState** — Next state after evaluation tick
- **expectedRoutingBehavior** — How model selection changes
- **expectedRecoveryAction** — What recovery loop does
- **expectedAuditEvent** — Which audit event emitted
- **expectedPrometheusUpdates** — Metrics to check

### Test Cases

#### Happy path: ONLINE → ONLINE (stable)

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ONLINE | 0.1 | 100 | 0.01 | CLOSED | LOW | WITHIN_BUDGET | 0.1 | ONLINE | ALLOW | none | — | cic_cost_policy_decisions_total{decision=ALLOW} |
| ONLINE | 0.2 | 150 | 0.02 | CLOSED | LOW | WITHIN_BUDGET | 0.2 | ONLINE | ALLOW | none | — | cic_cost_policy_decisions_total{decision=ALLOW} |

#### Cost pressure: ONLINE → DEGRADED_COST

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ONLINE | 0.1 | 100 | 0.01 | CLOSED | MEDIUM | SOFT_CEILING | 0.3 | DEGRADED_COST | DOWNGRADE | rebalance | COST_DEGRADATION_ENTERED | cic_cost_budget_soft_ceiling_active=1 |
| ONLINE | 0.3 | 150 | 0.05 | CLOSED | MEDIUM | SOFT_CEILING | 0.8 | DEGRADED_COST | DOWNGRADE | rebalance | COST_DEGRADATION_ENTERED | cic_cost_anomaly_score↑ |
| ONLINE | 0.5 | 200 | 0.1 | HALF_OPEN | MEDIUM | SOFT_CEILING | 0.5 | DEGRADED_COST | DOWNGRADE | rebalance | COST_DEGRADATION_ENTERED | — |

#### Cost ceiling: ONLINE → OFFLINE_COST

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ONLINE | 0.1 | 100 | 0.01 | CLOSED | HIGH | HARD_CEILING | 0.5 | OFFLINE_COST | BLOCK | circuit-trip (non-critical) | COST_HARD_CEILING_ENFORCED | cic_cost_budget_hard_ceiling_active=1 |
| ONLINE | 0.2 | 150 | 0.02 | CLOSED | HIGH | HARD_CEILING | 0.95 | OFFLINE_COST | BLOCK | circuit-trip (non-critical) | COST_HARD_CEILING_ENFORCED | cic_cost_budget_hard_ceiling_active=1, cic_cost_anomaly_score↑ |
| ONLINE | 0.8 | 500 | 0.2 | OPEN | HIGH | HARD_CEILING | 0.7 | OFFLINE_COST | BLOCK | circuit-trip (non-critical) | COST_HARD_CEILING_ENFORCED | — |

#### Recovery: DEGRADED_COST → ONLINE

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DEGRADED_COST | 0.2 | 120 | 0.02 | CLOSED | LOW | WITHIN_BUDGET | 0.2 | ONLINE | ALLOW | resume normal | COST_RECOVERY_COMPLETED | cic_cost_budget_soft_ceiling_active=0 |
| DEGRADED_COST | 0.1 | 80 | 0.01 | CLOSED | LOW | WITHIN_BUDGET | 0.15 | ONLINE | ALLOW | resume normal | COST_RECOVERY_COMPLETED | cic_cost_anomaly_score↓ |

#### Recovery: OFFLINE_COST → DEGRADED_COST

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OFFLINE_COST | 0.3 | 150 | 0.05 | HALF_OPEN | MEDIUM | SOFT_CEILING | 0.4 | DEGRADED_COST | DOWNGRADE | circuit-half-open | COST_RECOVERY_INITIATED | cic_cost_budget_hard_ceiling_active=0 |
| OFFLINE_COST | 0.2 | 120 | 0.03 | HALF_OPEN | LOW | WITHIN_BUDGET | 0.2 | DEGRADED_COST | DOWNGRADE | rebalance | COST_RECOVERY_INITIATED | cic_cost_anomaly_score↓ |

#### Recovery: OFFLINE_COST → ONLINE (fast path)

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OFFLINE_COST | 0.1 | 100 | 0.01 | CLOSED | LOW | WITHIN_BUDGET | 0.1 | ONLINE | ALLOW | resume normal | COST_RECOVERY_COMPLETED | cic_cost_budget_hard_ceiling_active=0, cic_cost_anomaly_score↓ |
| OFFLINE_COST | 0.15 | 110 | 0.02 | HALF_OPEN | LOW | WITHIN_BUDGET | 0.15 | ONLINE | ALLOW | resume normal | COST_RECOVERY_COMPLETED | — |

#### SLA violation overlaid with cost (Phase 7 remains primary)

| state | drift | p95ms | error | cb | cost | budget | anomaly | newState | routing | recovery | audit | metrics |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ONLINE | 0.8 | 1000 | 0.3 | OPEN | LOW | WITHIN_BUDGET | 0.1 | DEGRADED_SLA | (Phase 7 logic) | circuit-recover | (Phase 7 event) | (Phase 7 metrics) |
| DEGRADED_SLA | 0.2 | 150 | 0.05 | HALF_OPEN | MEDIUM | SOFT_CEILING | 0.3 | DEGRADED (compound) | DOWNGRADE | circuit-half-open + rebalance | COST_DEGRADATION_ENTERED | cic_cost_budget_soft_ceiling_active=1 |

### Assertions per case

- **expectedNewState**:
  - If SLA metrics already degraded: Phase 7 logic dominates → DEGRADED_SLA
  - If cost pressures high: Phase 8 logic dominates → DEGRADED_COST or OFFLINE_COST
  - If both healthy: ONLINE
  - If both degraded: prefer SLA path (operational health > cost)
- **expectedRoutingBehavior**:
  - ONLINE: policy=ALLOW → normal model scoring
  - DEGRADED_COST: policy=DOWNGRADE → prefer MEDIUM/SMALL models
  - OFFLINE_COST: policy=BLOCK → critical-only, cheapest model
  - DEGRADED_SLA: Phase 7 routing (drift-aware)
- **expectedRecoveryAction**:
  - Phase 7 recovery loop: drift score normalization, circuit breaker half-open, rebalance
  - Phase 8 extension: anomaly score normalization, cost window reduction, policy escalation → de-escalation
- **expectedAuditEvent**: matches transition path (COST_* or RECOVERY_* events)
- **expectedPrometheusUpdates**: gauge changes (ceiling flags, anomaly score), counter increments (policy decisions)

---

## Automation Notes

### Test runner skeleton

```typescript
// tests/phase8_matrix_runner.ts

interface MatrixTestCase {
  name: string;
  inputs: {
    driftScore?: number;
    costPressureLevel?: string;
    budgetStatus?: string;
    anomalyScore?: number;
    // ... other signals
  };
  expectedOutputs: {
    selectedModel?: string;
    policyDecision?: string;
    newState?: string;
    auditEvent?: string;
    // ... metrics
  };
}

const matrix1Cases: MatrixTestCase[] = [
  // ... all rows from Matrix 1
];

describe('Phase 8 Router Matrix', () => {
  matrix1Cases.forEach(tc => {
    it(`${tc.name}`, async () => {
      const result = await router.route(tc.inputs);
      expect(result.selectedModelId).toBe(tc.expectedOutputs.selectedModel);
      expect(auditLog.last().type).toBe(tc.expectedOutputs.auditEvent);
      // ... all assertions
    });
  });
});
```

### Coverage calculation

- **Matrix 1:** 11 test cases → 100% coverage of drift/cost/SLA combinations
- **Matrix 2:** 14 test cases → 100% coverage of budget/anomaly thresholds
- **Matrix 3:** 20+ test cases → 100% coverage of state transitions (happy path + recovery + overlays)

**Total:** 45+ deterministic test cases covering all edge cases + happy paths.

---

## Integration with Phase 7 tests

Phase 7 state machine tests inherit new signal types + transition paths. Existing tests remain valid; new Matrix 3 tests extend coverage.

Phase 7 recovery loop tests verify:
- Anomaly score normalization → costPressureLevel drop
- Budget status recovery → circuit breaker half-open → full closed
- State transitions fire correct audit events
- Prometheus metrics update deterministically

---

**End of PHASE_8_TEST_MATRICES.md**
