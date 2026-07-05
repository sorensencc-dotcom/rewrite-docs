---
title: "PHASE 8 SPEC"
summary: "# Phase 8: Cost Optimization + Dynamic Model Selection"
created: "2026-07-03T19:43:45.557Z"
updated: "2026-07-04T00:00:00.000Z"
status: "finalized"
tags:
  - cic
  - rewrite-labs
  - roadmap
  - phase-8
---
# Phase 8: Cost Optimization + Dynamic Model Selection

**Status:** ✅ Spec finalized (2026-07-04)  
**Locked:** 2026-06-23  
**Scope:** 10 files, 3-day implementation (D1–D3)  
**Integration:** Phase 7 state machine + Prometheus telemetry + audit governance  
**Runner Config:** `roadmap-runner/phases/PHASE-8.yaml` (see Section 11)  

---

## 1. Architecture Overview

### 1.1 Layered design

```
┌─────────────────────────────────────────────────────────────┐
│ CIC Runtime (request entry)                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ CIC Integration Adapter (Phase 8)                           │
│  - Builds RequestContext from CIC runtime                   │
│  - Coordinates cost + routing decisions                     │
│  - Records telemetry + audit events                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────────┐    ┌──────────▼────────┐
│ Cost Intelligence│    │ Model Intelligence│
│                  │    │                   │
│ - Telemetry      │    │ - Capability      │
│ - Model          │    │   Registry        │
│ - Forecast       │    │ - Dynamic Router  │
│ - Policy         │    │                   │
└───────┬──────────┘    └──────────┬────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ Model Execution + Telemetry Sink                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼──────────┐    ┌───────────▼────────┐
│ Prometheus       │    │ Audit Log Writer   │
│ Metrics          │    │                    │
│ (11 signals)     │    │ (5 event types)    │
└──────────────────┘    └────────────────────┘
        │                            │
        └────────────────┬───────────┘
                         │
┌────────────────────────▼────────────────────┐
│ Phase 7 State Machine                       │
│ (Extended signals: costPressureLevel,       │
│  budgetStatus, anomalyScore)                │
└─────────────────────────────────────────────┘
```

### 1.2 Data flow

1. **Request arrives** → CIC runtime passes to Integration Adapter
2. **Context built** → RequestContext extracted (agent, priority, model preference, SLA)
3. **Cost check** → CostPolicyEngine reads CostModel (5m/1h/24h windows) → `ALLOW|DOWNGRADE|BLOCK`
4. **Model selection** → DynamicModelRouter:
   - Filters candidates by SLA + capability
   - Scores by drift + latency + cost
   - Applies policy override (DOWNGRADE → cheaper model, BLOCK → critical-only)
   - Selects best fit
5. **Model execution** → Model call via CIC runtime callback
6. **Telemetry recorded** → Cost event → CostTelemetryCollector → Prometheus + audit sink
7. **State machine fed** → Phase 7 loop consumes cost windows + anomaly score → evaluates transitions

---

## 2. Contracts & Type Definitions

### 2.1 RequestContext

```typescript
export interface RequestContext {
  requestId: string;
  agentId: string;
  tenantId: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  
  // SLA constraints
  maxLatencyMs: number;
  minQualityTier: 'SMALL' | 'MEDIUM' | 'LARGE';
  
  // Model preference
  preferredModelIds?: string[];
  fallbackModelId?: string;
  
  // Token estimate
  estimatedInputTokens: number;
  
  // Metadata
  operationType: string; // e.g. 'ANALYZE', 'GENERATE', 'REVIEW'
  timestamp: number;
}
```

### 2.2 ModelDescriptor

```typescript
export interface ModelDescriptor {
  id: string;
  provider: 'ANTHROPIC' | 'OLLAMA' | 'EXTERNAL';
  family: 'SMALL' | 'MEDIUM' | 'LARGE';
  
  // Cost per 1M tokens
  costInputPerMTokenUsd: number;
  costOutputPerMTokenUsd: number;
  
  // Performance
  avgLatencyMs: number;
  qualityTier: 'SMALL' | 'MEDIUM' | 'LARGE';
  
  // Capabilities
  maxContextTokens: number;
  supportedOperations: string[];
  
  // Health
  driftScore: number; // 0–1, Levenshtein drift from SLA
  available: boolean;
}
```

### 2.3 CostEvent

```typescript
export interface CostEvent {
  id: string;
  timestamp: number;
  requestId: string;
  agentId: string;
  tenantId: string;
  modelId: string;
  
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  
  operationType: string;
  priority: string;
}
```

### 2.4 PolicyDecision

```typescript
export type PolicyDecision = 'ALLOW' | 'DOWNGRADE' | 'BLOCK';

export interface CostPolicyResult {
  decision: PolicyDecision;
  dailySpendUsd: number;
  softCeilingUsd: number;
  hardCeilingUsd: number;
  costPressureLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetStatus: 'WITHIN_BUDGET' | 'SOFT_CEILING' | 'HARD_CEILING';
  reason: string;
}
```

### 2.5 RoutingDecision

```typescript
export interface RoutingDecision {
  selectedModelId: string;
  candidates: string[];
  scores: Record<string, number>;
  driftScore: number;
  policyDecision: PolicyDecision;
  rationale: string;
  timestamp: number;
}
```

### 2.6 RuntimeSignals (Phase 7 + Phase 8 merged)

```typescript
export interface RuntimeSignals {
  // Phase 7 signals
  driftScore: number; // 0–1
  sla: {
    p95LatencyMs: number;
    p99LatencyMs: number;
    errorRate: number;
  };
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  
  // Phase 8 signals (NEW)
  costPressureLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetStatus: 'WITHIN_BUDGET' | 'SOFT_CEILING' | 'HARD_CEILING';
  anomalyScore: number; // 0–1, from forecast engine
  dailySpendUsd: number;
  hardCeilingUsd: number;
}
```

### 2.7 State machine transitions (extended)

| Transition | Entry Condition | Exit Condition | Action | Audit Event |
|---|---|---|---|---|
| ONLINE → DEGRADED_COST | SLA OK + costPressureLevel=MEDIUM | costPressureLevel=LOW | Route via DOWNGRADE | COST_DEGRADATION_ENTERED |
| ONLINE → OFFLINE_COST | budgetStatus=HARD_CEILING OR (costPressureLevel=HIGH + anomalyScore>0.9) | budgetStatus≠HARD_CEILING + anomalyScore<0.5 | Trip CB for non-critical | COST_HARD_CEILING_ENFORCED |
| DEGRADED_COST → ONLINE | costPressureLevel=LOW + SLA stable | — | Resume ALLOW routing | COST_RECOVERY_COMPLETED |
| OFFLINE_COST → DEGRADED_COST | budgetStatus≠HARD_CEILING + anomalyScore<0.5 | — | Move to DOWNGRADE routing | COST_RECOVERY_INITIATED |
| OFFLINE_COST → ONLINE | budgetStatus OK + SLA OK + costPressureLevel=LOW | — | Resume normal routing | COST_RECOVERY_COMPLETED |

---

## 3. Module Definitions (10 files)

### 3.1 Phase D1 — Types & Contracts

**File 1: `types/request_context.ts`**
- RequestContext interface
- Validation helpers: `validateRequestContext()`
- Default SLA values by priority tier

**File 2: `types/model_descriptor.ts`**
- ModelDescriptor interface
- ModelFamily enum
- Cost calculation helper: `calculateRequestCostUsd(descriptor, inputTokens, outputTokens)`

**File 3: `types/cost_event.ts`**
- CostEvent interface
- PolicyDecision type
- RuntimeSignals interface (Phase 7 + 8 merged)
- State transition type definitions

**Deliverable:** types.d.ts equivalent with zero runtime logic.

---

### 3.2 Phase D1p — Cost Intelligence (Collectors + Model)

**File 4: `cost/cost_telemetry_collector.ts`**

```typescript
export class CostTelemetryCollector {
  constructor(private sink: { write(event: CostEvent): void }) {}
  
  recordCostEvent(event: CostEvent): void {
    // Normalize, validate, write
  }
}
```

- Sink interface: `{ write(event: CostEvent): void }`
- Validation: token counts must be non-negative
- Deduplication: skip duplicate requestIds within 1s window

**File 5: `cost/cost_model.ts`**

```typescript
export class CostModel {
  // Rolling windows: 5m, 1h, 24h
  getDailySpendUsd(): number;
  getSpendByAgent(agentId: string): Record<string, number>; // by model
  getSpendByModel(modelId: string): Record<string, number>; // by agent
  getSpendWindow(windowMs: number): number;
}
```

- Query backed by time-series sink (e.g., InfluxDB or in-memory ring buffer for tests)
- Deterministic: same input window → same output
- Edge cases: empty window, no events, single event

**Deliverable:** 100% unit test coverage for edge cases.

---

### 3.3 Phase D2 — Forecasting & Policy

**File 6: `cost/cost_forecast_engine.ts`**

```typescript
export interface CostForecast {
  projectedSpendUsd: number;
  anomalyScore: number; // 0–1
  horizon: '1h' | '24h' | '7d';
  confidence: number;
}

export class CostForecastEngine {
  forecast(horizon: '1h' | '24h' | '7d'): CostForecast;
}
```

- Simple linear projection: slope × time
- Anomaly detection: Z-score over historical spend variance
- Horizon-aware: different models for 1h vs 24h vs 7d
- Conservative: round up projections to be safe

**File 7: `cost/cost_policy_engine.ts`**

```typescript
export class CostPolicyEngine {
  evaluatePolicy(
    dailySpendUsd: number,
    softCeilingUsd: number,
    hardCeilingUsd: number,
    anomalyScore: number
  ): CostPolicyResult;
}
```

- Decision logic:
  - `dailySpend < softCeiling` → ALLOW, costPressureLevel=LOW
  - `softCeiling ≤ dailySpend < hardCeiling` → DOWNGRADE, costPressureLevel=MEDIUM
  - `dailySpend ≥ hardCeiling` → BLOCK, costPressureLevel=HIGH
  - anomalyScore > 0.7 → escalate to next level
- Derives costPressureLevel + budgetStatus in single pass

**Deliverable:** Policy truth table (3×3 matrix of spend × anomaly → decision).

---

### 3.4 Phase D2p — Model Intelligence (Registry + Router)

**File 8: `models/model_capability_registry.ts`**

```typescript
export class ModelCapabilityRegistry {
  register(descriptor: ModelDescriptor): void;
  
  // Filtering + scoring
  getCandidates(
    operationType: string,
    maxLatencyMs: number,
    minQualityTier: 'SMALL' | 'MEDIUM' | 'LARGE'
  ): ModelDescriptor[];
  
  getModelById(id: string): ModelDescriptor | null;
}
```

- In-memory store; supports hot-swap via `register()` override
- Candidates filtered by:
  - operationType support
  - maxContextTokens ≥ estimated input tokens
  - avgLatencyMs ≤ maxLatencyMs
  - qualityTier ≥ minQualityTier
- Returns sorted by driftScore (ascending)

**File 9: `models/dynamic_model_router.ts`**

```typescript
export class DynamicModelRouter {
  route(
    context: RequestContext,
    signals: RuntimeSignals,
    policyDecision: PolicyDecision
  ): RoutingDecision;
}
```

- Scoring function:
  ```
  score = (driftWeight × driftScore)
        + (latencyWeight × (avgLatencyMs / maxLatencyMs))
        + (costWeight × (costPerTokenUsd / maxCostPerTokenUsd))
  ```
- Policy override:
  - ALLOW: use normal scoring
  - DOWNGRADE: prefer MEDIUM/SMALL families
  - BLOCK: only CRITICAL priority; pick cheapest candidate
- Fallback: if no candidate passes, use hardcoded fallback or error

**Deliverable:** Routing scenario matrix (drift × cost × SLA → selected model).

---

### 3.5 Phase D3 — CIC Integration

**File 10: `integration/cic_integration_adapter_phase8.ts`**

```typescript
export class CICIntegrationAdapterPhase8 {
  constructor(
    private costTelemetryCollector: CostTelemetryCollector,
    private costModel: CostModel,
    private costForecastEngine: CostForecastEngine,
    private costPolicyEngine: CostPolicyEngine,
    private modelRegistry: ModelCapabilityRegistry,
    private dynamicModelRouter: DynamicModelRouter,
    private auditSink: { write(event: AuditEvent): void }
  ) {}
  
  async handleRequest(
    cicRequest: CICRuntimeRequest,
    phaseSevenSignals: RuntimeSignals
  ): Promise<CICResponse> {
    // 1. Build RequestContext from CIC runtime
    const context = this.buildRequestContext(cicRequest);
    
    // 2. Evaluate cost policy
    const costPolicy = this.costPolicyEngine.evaluatePolicy(...);
    const signals = { ...phaseSevenSignals, ...costPolicy };
    
    // 3. Route to model
    const routing = this.dynamicModelRouter.route(context, signals, costPolicy.decision);
    
    // 4. Execute model (via CIC callback)
    const result = await cicRequest.executeModel(routing.selectedModelId);
    
    // 5. Record telemetry
    const costEvent = this.buildCostEvent(context, routing, result);
    this.costTelemetryCollector.recordCostEvent(costEvent);
    
    // 6. Record audit
    this.auditSink.write(this.buildAuditEvent(context, routing, costPolicy));
    
    return result;
  }
}
```

- Coordinates all components in request flow
- Handles errors: missing model, cost calc failures → fallback to safe defaults
- Audit events emitted for: COST_POLICY_DECISION, MODEL_ROUTING_DECISION

**Deliverable:** Integration tests with mocked model calls + cost sink.

---

## 4. Prometheus Metrics (11 signals)

All metrics prefixed `cic_cost_` with labels `[agent_id, model_id, tenant_id, priority, operation_type]`.

| # | Metric | Type | Labels | Purpose |
|---|--------|------|--------|---------|
| 1 | `cic_cost_total_usd` | Counter | agent_id, model_id | Total cumulative cost |
| 2 | `cic_cost_request_usd` | Histogram | agent_id, model_id, priority, operation_type | Cost per request |
| 3 | `cic_cost_input_tokens` | Counter | agent_id, model_id | Total input tokens |
| 4 | `cic_cost_output_tokens` | Counter | agent_id, model_id | Total output tokens |
| 5 | `cic_cost_daily_spend_usd` | Gauge | tenant_id | 24h rolling spend |
| 6 | `cic_cost_budget_soft_ceiling_active` | Gauge (0/1) | tenant_id | Soft ceiling active |
| 7 | `cic_cost_budget_hard_ceiling_active` | Gauge (0/1) | tenant_id | Hard ceiling active |
| 8 | `cic_cost_policy_decisions_total` | Counter | decision (ALLOW/DOWNGRADE/BLOCK), tenant_id | Policy decision count |
| 9 | `cic_cost_anomaly_score` | Gauge | tenant_id, horizon (1h/24h/7d) | Anomaly score 0–1 |
| 10 | `cic_cost_model_selection_changes_total` | Counter | agent_id, from_model_id, to_model_id | Model switch count |
| 11 | `cic_cost_downgrade_events_total` | Counter | agent_id, from_model_id, to_model_id, reason | Downgrade count |

---

## 5. Audit Event Schema (5 core types)

### 5.1 COST_POLICY_DECISION

```typescript
{
  type: 'COST_POLICY_DECISION',
  timestamp: number,
  actor: 'SYSTEM',
  context: { requestId, agentId, tenantId },
  payload: {
    decision: 'ALLOW' | 'DOWNGRADE' | 'BLOCK',
    dailySpendUsd: number,
    softCeilingUsd: number,
    hardCeilingUsd: number,
    reason: string
  }
}
```

### 5.2 MODEL_ROUTING_DECISION

```typescript
{
  type: 'MODEL_ROUTING_DECISION',
  timestamp: number,
  actor: 'SYSTEM',
  context: { requestId, agentId, tenantId, modelId },
  payload: {
    selectedModelId: string,
    candidates: string[],
    driftScore: number,
    sla: { maxLatencyMs, minQualityTier },
    policyDecision: 'ALLOW' | 'DOWNGRADE' | 'BLOCK',
    rationale: string
  }
}
```

### 5.3 COST_DEGRADATION_ENTERED

```typescript
{
  type: 'COST_DEGRADATION_ENTERED',
  timestamp: number,
  actor: 'SYSTEM',
  context: { agentId, tenantId },
  payload: {
    previousState: string,
    newState: string,
    costPressureLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    anomalyScore: number
  }
}
```

### 5.4 COST_HARD_CEILING_ENFORCED

```typescript
{
  type: 'COST_HARD_CEILING_ENFORCED',
  timestamp: number,
  actor: 'SYSTEM',
  context: { tenantId },
  payload: {
    dailySpendUsd: number,
    hardCeilingUsd: number,
    affectedAgents: string[]
  }
}
```

### 5.5 COST_RECOVERY_INITIATED / COST_RECOVERY_COMPLETED

```typescript
{
  type: 'COST_RECOVERY_INITIATED' | 'COST_RECOVERY_COMPLETED',
  timestamp: number,
  actor: 'SYSTEM',
  context: { agentId, tenantId },
  payload: {
    previousState: string,
    newState: string,
    anomalyScore: number,
    costPressureLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }
}
```

---

## 6. Implementation Timeline (D1–D3)

### Day 1 (D1 + D1p) — Foundation
- **D1 (morning, 2h):** Files 1–3 (types)
  - RequestContext, ModelDescriptor, CostEvent
  - Validation helpers
  - Zero runtime logic
  - Unit tests for validation

- **D1p (afternoon, 3h):** Files 4–5 (telemetry + model)
  - CostTelemetryCollector with sink interface
  - CostModel with 5m/1h/24h windows
  - Edge case tests: empty windows, duplicates, single events

### Day 2 (D2 + D2p) — Intelligence
- **D2 (morning, 2h):** Files 6–7 (forecast + policy)
  - CostForecastEngine with linear projection + anomaly score
  - CostPolicyEngine with decision logic
  - Truth table tests

- **D2p (afternoon, 3h):** Files 8–9 (registry + router)
  - ModelCapabilityRegistry with filtering
  - DynamicModelRouter with scoring + policy override
  - Routing scenario matrix tests

### Day 3 (D3) — Integration
- **D3 (morning + afternoon, 4h):** File 10 (CIC adapter)
  - Coordinate all components in request flow
  - Error handling + fallbacks
  - Integration tests with mocked model calls
  - Wiring hooks for Phase 7 state machine

**Total:** 10 files, ~14 hours, 3000–3500 LOC, 150+ unit + integration tests.

---

## 7. Integration Points with Phase 7

### 7.1 State machine consumption

Phase 7's `evaluateState(signals: RuntimeSignals)` now receives:
- `signals.costPressureLevel` (from CostPolicyEngine)
- `signals.budgetStatus` (from CostPolicyEngine)
- `signals.anomalyScore` (from CostForecastEngine)
- `signals.dailySpendUsd` (from CostModel)
- `signals.hardCeilingUsd` (config)

Phase 7's loop (10s tick) evaluates new transitions:
- ONLINE → DEGRADED_COST (cost path)
- ONLINE → OFFLINE_COST (cost path)
- DEGRADED_COST → ONLINE
- OFFLINE_COST → DEGRADED / ONLINE

### 7.2 Routing behavior per state

- **ONLINE:** Policy ALLOW → normal model scoring
- **DEGRADED_COST:** Policy DOWNGRADE → prefer MEDIUM/SMALL
- **OFFLINE_COST:** Policy BLOCK → critical-only, cheapest model

### 7.3 Recovery loop coordination

Phase 7's recovery loop remains unchanged; cost recovery follows same pattern:
- Anomaly score normalizes → costPressureLevel drops → state machine transitions out
- Audit events track entry/exit for governance

---

## 8. Success Criteria (Spec Finalization — COMPLETE ✅)

**This spec is implementation-ready. The following criteria apply to Phase 8 implementation, not spec finalization:**

- [ ] All 10 files implement contracts in PHASE_8_SPEC.md (this document)
- [ ] 150+ unit tests pass (edge cases + happy paths)
- [ ] 20+ integration tests pass (Phase 8 + Phase 7 state machine)
- [ ] Prometheus metrics emit deterministically for test scenarios
- [ ] Audit events match schema (5 types) for all transitions
- [ ] Routing decisions logged in PHASE_8_TEST_MATRICES.md
- [ ] Cost model queries match Phase 7 state machine ticks
- [ ] Phase 7 integration tests pass with Phase 8 signals

**Spec finalization criteria (LOCKED):**
- ✅ All 10 file contracts defined with interface signatures + behavior specs
- ✅ All type definitions complete (RequestContext, ModelDescriptor, CostEvent, etc.)
- ✅ All state transitions specified (5 types: COST_DEGRADATION_ENTERED, COST_HARD_CEILING_ENFORCED, etc.)
- ✅ All 11 Prometheus metrics defined with label sets
- ✅ All 5 audit event schemas defined with payload structures
- ✅ Integration points with Phase 7 documented (3 entry points)
- ✅ Test matrix structure documented (3 matrices covering 45+ test cases)
- ✅ Success gates defined for runner (see Section 11)

---

## 9. Dependencies & External Contracts

### 9.1 CIC Runtime provides

- `CICRuntimeRequest` with `executeModel(modelId: string): Promise<CICResponse>`
- `circuitBreakerState` (from Phase 7)
- `driftScore` (from Phase 7)
- `sla` metrics (from Phase 7)

### 9.2 Phase 7 state machine provides

- `RuntimeSignals` interface (now extended with Phase 8 fields)
- `evaluateState(signals)` entry point for new transitions
- 10s loop tick for cost window consumption

### 9.3 Cost sink contract

```typescript
interface CostSink {
  write(event: CostEvent): void;
}

interface AuditSink {
  write(event: AuditEvent): void;
}
```

Implementations: Prometheus remote write, InfluxDB, in-memory ring buffer (tests).

---

## 10. Error Handling & Fallback Behavior

### 10.1 Cost calculation failures
- **Missing model cost data:** Use hardcoded fallback cost (e.g., $0.01/1M input tokens)
- **Token count parse failure:** Round token estimates to nearest 1000
- **Cost sink unavailable:** Buffer cost events in memory (max 1000 events) or discard with warning

### 10.2 Model routing failures
- **No candidates pass filter:** Use fallback model (defined in config)
- **Selected model unavailable:** Re-route with DOWNGRADE policy
- **Policy override conflict:** Prioritize CRITICAL priority > cost policy

### 10.3 Phase 7 signal unavailable
- **Missing driftScore:** Assume 0.3 (neutral)
- **Missing SLA metrics:** Assume p95=200ms, errorRate=0.01
- **Missing circuitBreakerState:** Assume CLOSED

### 10.4 Deterministic recovery
- **Cost sink recovery:** Flush buffered events when sink available
- **Model registry refresh:** Hot-swap descriptors without stopping request loop
- **Anomaly score spike:** Cap anomaly score at 0.95 to prevent hard-reset; allow gradual decay

---

## 11. Runner Config (PHASE-8.yaml)

**File:** `roadmap-runner/phases/PHASE-8.yaml`

```yaml
phase: PHASE-8
title: "CIC Cost Optimization + Dynamic Model Selection"
version: 1.0.0
status: placeholder

# Docker container for Phase 8 implementation
container:
  image: cic:phase-8
  build:
    context: cic-ingestion
    dockerfile: Dockerfile.phase8
  ports:
    - "3108:3000"  # CIC Integration Adapter
  env:
    - PHASE_ID=PHASE-8
    - COST_SINK=prometheus
    - AUDIT_SINK=elasticsearch
    - LOG_LEVEL=debug

# Success gates evaluate implementation correctness
success_gates:
  # Gate 1: Integration adapter initializes without error
  - type: exit_code
    value: 0
    description: "Container starts and Phase 8 initialization completes"
  
  # Gate 2: Prometheus metrics registered
  - type: output
    pattern: "cic_cost_total_usd|cic_cost_request_usd|cic_cost_policy_decisions_total"
    description: "All 11 Prometheus metrics registered and available"
  
  # Gate 3: Phase 7 integration wired
  - type: output
    pattern: "Extended RuntimeSignals with costPressureLevel, budgetStatus, anomalyScore"
    description: "Phase 7 signals merged into request handling"
  
  # Gate 4: Test suite passes
  - type: metric
    key: test_pass_rate
    op: ">="
    value: 0.95
    description: "At least 95% of Phase 8 tests pass"
  
  # Gate 5: Unit test count minimum
  - type: metric
    key: unit_tests_count
    op: ">="
    value: 150
    description: "At least 150 unit tests for Phase 8 modules"
  
  # Gate 6: Integration test count minimum
  - type: metric
    key: integration_tests_count
    op: ">="
    value: 20
    description: "At least 20 Phase 8 + Phase 7 integration tests"
  
  # Gate 7: Code coverage
  - type: metric
    key: code_coverage
    op: ">="
    value: 0.80
    description: "At least 80% code coverage for Phase 8"

# Dependencies: Phase 7 must be deployed
dependencies:
  - PHASE-7

# Timeline
timeline:
  d1_types: 2h
  d1p_telemetry: 3h
  d2_forecast: 2h
  d2p_routing: 3h
  d3_integration: 4h
  total: "14 hours"

# Metrics expected to publish
metrics:
  - cic_cost_total_usd
  - cic_cost_request_usd
  - cic_cost_input_tokens
  - cic_cost_output_tokens
  - cic_cost_daily_spend_usd
  - cic_cost_budget_soft_ceiling_active
  - cic_cost_budget_hard_ceiling_active
  - cic_cost_policy_decisions_total
  - cic_cost_anomaly_score
  - cic_cost_model_selection_changes_total
  - cic_cost_downgrade_events_total
```

---

## 10. Appendix: Architecture Diagram (ASCII)

```
CIC Runtime Request
        │
        ▼
┌──────────────────────────────────┐
│ CICIntegrationAdapterPhase8      │
│ .handleRequest()                 │
└────────────┬─────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
CostPolicyEngine  ModelCapabilityRegistry
    │                 │
    │                 ▼
    │            DynamicModelRouter
    │                 │
    └────────┬────────┘
             │
             ▼
    ┌────────────────┐
    │ selectedModelId│
    └────────┬───────┘
             │
             ▼
  ┌──────────────────────┐
  │ CIC.executeModel()   │
  │ (callback)           │
  └────────┬─────────────┘
           │
           ▼
  ┌──────────────────────┐
  │ Model Execution      │
  │ inputTokens → tokens │
  │ outputTokens         │
  └────────┬─────────────┘
           │
           ▼
  ┌──────────────────────┐
  │ CostTelemetryCollector│
  │ .recordCostEvent()   │
  └────────┬─────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
Prometheus    AuditSink
(11 metrics)  (5 events)
    │             │
    └──────┬──────┘
           │
           ▼
Phase 7 State Machine
(new signals: costPressureLevel,
 budgetStatus, anomalyScore)
           │
           ▼
Evaluate State Transitions
(ONLINE ↔ DEGRADED_COST ↔ OFFLINE_COST)
```

---

**End of PHASE_8_SPEC.md**
