---
title: "PLAN"
summary: "# PHASE 8 — COST OPTIMIZATION + DYNAMIC MODEL SELECTION"
created: "2026-07-03T19:43:45.881Z"
updated: "2026-07-03T19:43:45.881Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# PHASE 8 — COST OPTIMIZATION + DYNAMIC MODEL SELECTION

**Status:** ✓ COMPLETE  
**Date:** 2026-06-23  
**Commits:** 71f7b5c, 832e36c, 081b20d, 89bbfda, b373620  
**LOC:** 860 lines (types + cost + models + integration)

## Architecture (A–D Implemented)

### A. Phase 8 ↔ Phase 7 Integration
- State machine extended: `DEGRADED_COST`, `ONLINE_COST_OPTIMIZED`
- New signals: `costPressureLevel`, `budgetStatus`
- Policy decision feed: `CostPolicyEngine` → state transitions
- Cost windows: 5m, 1h, 24h windows fed to runtime every 10s loop

### B. Prometheus Metrics (11 core signals)
- `cic_cost_total_usd` (counter)
- `cic_cost_request_usd` (histogram)
- `cic_cost_input_tokens`, `cic_cost_output_tokens` (counters)
- `cic_cost_daily_spend_usd` (gauge)
- `cic_cost_budget_soft_ceiling_active`, `cic_cost_budget_hard_ceiling_active` (gauges)
- `cic_cost_policy_decisions_total` (counter)
- `cic_cost_anomaly_score` (gauge)
- `cic_cost_model_selection_changes_total` (counter)
- `cic_cost_downgrade_events_total` (counter)

### C. Audit Events (5 types)
- `COST_POLICY_DECISION`
- `MODEL_ROUTING_DECISION`
- `COST_DEGRADATION_ENTERED`
- `COST_HARD_CEILING_ENFORCED`
- `COST_RECOVERY_INITIATED` / `COST_RECOVERY_COMPLETED`

### D. Implementation Plan (10 files, 3 days)

---

## Files (Deterministic, Locked)

| # | File | Phase | Purpose |
|---|------|-------|---------|
| 1 | `types/request_context.ts` | 8.0 | Request context + SLA envelope |
| 2 | `types/model_descriptor.ts` | 8.0 | Model registry + capability descriptor |
| 3 | `types/cost_event.ts` | 8.0 | Cost telemetry event shape |
| 4 | `cost/cost_telemetry_collector.ts` | 8.1 | Raw cost → event sink |
| 5 | `cost/cost_model.ts` | 8.1 | Aggregation + rolling windows |
| 6 | `cost/cost_forecast_engine.ts` | 8.2 | Linear projection + anomaly |
| 7 | `cost/cost_policy_engine.ts` | 8.2 | Budget ceilings → ALLOW/DOWNGRADE/BLOCK |
| 8 | `models/model_capability_registry.ts` | 8.3 | Model registration + candidate filtering |
| 9 | `models/dynamic_model_router.ts` | 8.3 | SLA + drift + cost scoring + routing |
| 10 | `integration/cic_integration_adapter_phase8.ts` | 8.4 | CIC runtime wiring |

Directory: `cic/src/analyzers/image/v3/`

---

## Implementation Phases (3 days)

### Day 1 — Morning (Phase 8.0 — Types, 2–3h)
**Files:** 1–3
- Define contracts: `RequestContext`, `ModelDescriptor`, `CostEvent`
- Lock enums: `operationType`, `priority`, `qualityTier`, `policyDecision`, `provider`, `family`
- Add basic validators if edge cases warrant
- Tests: contract validation only
- **Gate:** All types compile, no runtime code

### Day 1 — Afternoon (Phase 8.1 — Telemetry + Model, 3–4h)
**Files:** 4–5
- `CostTelemetryCollector`: deterministic cost calc (input/output tokens × pricing)
- `CostModel`: rolling window aggregation (5m, 1h, 24h), `byAgent`, `byModel` views
- Tests: window boundary conditions, empty windows, large token counts
- **Gate:** 100% coverage on cost math (no rounding errors)

### Day 2 — Morning (Phase 8.2 — Forecast + Policy, 3–4h)
**Files:** 6–7
- `CostForecastEngine`: linear projection + anomaly score (0–1)
- `CostPolicyEngine`: daily spend vs soft/hard ceilings → `ALLOW/DOWNGRADE/BLOCK`
- Wire `CostModel` → both engines
- Tests: anomaly detection, threshold edge cases, policy transitions
- **Gate:** Forecast accuracy validated on synthetic data, policy logic deterministic

### Day 2 — Afternoon (Phase 8.3 — Router, 4–5h)
**Files:** 8–9
- `ModelCapabilityRegistry`: register, list, `findCandidates()`
- `DynamicModelRouter`: 
  - SLA + drift-aware scoring (quality vs cost tradeoff)
  - Downgrade logic (select cheaper under `DOWNGRADE` policy)
  - Fallback (cheapest under `BLOCK`)
- `SLAAndCostCoordinator`: final arbitration
- Tests: routing under LOW/MEDIUM/HIGH cost pressure, drift variation
- **Gate:** All routing paths covered, deterministic tie-breaking

### Day 3 (Phase 8.4 — CIC Integration, 3–4h)
**File:** 10
- `CICIntegrationAdapterPhase8.handleRequest()`:
  - Builds `RequestContext` from CIC runtime
  - Calls coordinator → router decision
  - Executes model call (mocked or real)
  - Records telemetry
- Add hooks for Phase 7 state machine:
  - Cost windows → state evaluator every loop
  - Policy decision → routing middleware
- Integration tests: E2E request → decision → telemetry
- **Gate:** Can execute sample request, telemetry recorded

---

## Success Criteria

- [ ] All 10 files implemented
- [ ] 150+ unit tests (phase 8.1–8.3)
- [ ] 20+ integration tests (phase 8.4)
- [ ] Phase 7 state machine extended + hooks in place
- [ ] Prometheus metrics exportable
- [ ] Audit events structured + loggable
- [ ] No unhandled cost calc edge cases

---

## Commit Strategy

- **Day 1 AM:** `feat: Phase 8.0 — cost types + contracts`
- **Day 1 PM:** `feat: Phase 8.1 — telemetry + cost model`
- **Day 2 AM:** `feat: Phase 8.2 — forecast + policy engine`
- **Day 2 PM:** `feat: Phase 8.3 — model router + coordinator`
- **Day 3:** `feat: Phase 8.4 — CIC integration + state machine hooks`

---

## Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Rounding errors in cost math | Deterministic unit tests, no floating-point ambiguity |
| Phase 7 state machine complexity | Extend existing, don't refactor; new states only |
| Model registry not exhaustive | Pre-populate with known models (Azure, OpenAI, local); tests with synthetic |
| Budget crossing at request boundary | Policy evaluated *before* execution; decision logged |

---

## Dispatch

Ready for Day 1 implementation. Start with types (files 1–3).
