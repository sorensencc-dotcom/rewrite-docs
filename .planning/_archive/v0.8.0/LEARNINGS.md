# v0.8.0 Learnings

**Milestone:** v0.8.0 — Deploy → Heal → Optimize  
**Date:** 2026-06-21 to 2026-06-23  
**Retrospective:** 2026-06-23  

---

## Key Decisions & Rationale

### 1. Phase 7 + Phase 8 Integration via Extended State Machine

**Decision:** Extend Phase 7's RuntimeSignals with Phase 8 cost fields (costPressureLevel, budgetStatus, anomalyScore) rather than create separate cost-only state machine.

**Why:** Monolithic signal sink keeps operator model unified. Cost is *not* separate from SLA — they trade off. A system can be SLA-healthy but cost-broken, or SLA-broken but cost-healthy. Single state machine forces intentional priority decisions.

**Outcome:** Cleaner transitions (ONLINE → DEGRADED_COST vs ONLINE → DEGRADED_SLA) with phase-specific audit events. No branching logic needed in router.

**For Phase 9:** This pattern scales. Add memory reuse signals (cache_hit, reuse_quality) to same RuntimeSignals sink.

---

### 2. Spec-First + Test Matrices Before Implementation

**Decision:** Lock full PHASE_8_SPEC.md + PHASE_8_TEST_MATRICES.md before writing a single implementation file.

**Why:** Phase 8 is the first cross-layer phase (cost telemetry feeds policy engine feeds router). Ambiguity upstream cascades. Deterministic test matrices expose design flaws before code.

**Outcome:** 45+ test cases mapped to expected model selections, policy decisions, and state transitions. Builder agents dispatch with zero ambiguity. No rework cycles.

**For Phase 9:** Replicate this approach. Write PHASE_9_SPEC.md + matrices first, then scaffolds.

---

### 3. Policy Decoupling (CostPolicyEngine is Separate from DynamicModelRouter)

**Decision:** CostPolicyEngine (budget check) emits ALLOW/DOWNGRADE/BLOCK policy independent of router. Router *applies* that policy.

**Why:** Separation of concerns. Policy is tenant/org-level (hard ceiling, soft ceiling). Router is request-level (which model fits *this request under this policy*). Decoupling lets you swap policy without rewriting router.

**Outcome:** Router can test in isolation (given a policy decision, what model?). Policy can test in isolation (given spend + forecast, what decision?).

**For Phase 9:** Memory reuse decisions follow same pattern. ReusePolicyEngine (when is it safe to reuse?) separate from CacheKeyGenerator + RetrievalRouter.

---

### 4. Cost Windows (5m, 1h, 24h) as Phase 7 Loop Input

**Decision:** CostModel maintains rolling windows. Phase 7 10s loop queries them → feeds state machine evaluation.

**Why:** Decouples cost collection (async, event-driven) from state evaluation (synchronous, 10s loop). Cost telemetry never blocks state transitions.

**Outcome:** State machine stays deterministic. Cost signals are stale-but-safe (max 10s lag). Loop remains predictable for testing.

**For Phase 9:** Cache stats (hit_rate, avg_reuse_quality) follow same async-collection, sync-evaluation pattern.

---

### 5. Audit Events as First-Class Artifact (Not Logging Strings)

**Decision:** Define 5 structured AuditEvent types (COST_POLICY_DECISION, MODEL_ROUTING_DECISION, etc.) with strict schema.

**Why:** Audit events are consumed downstream (governance tools, cost dashboards, compliance audits). Strings are fragile. Structured events are queryable.

**Outcome:** Compliance teams can grep for COST_HARD_CEILING_ENFORCED across 6-month archive. Cost dashboard can reconstruct cost allocation by agent + model via MODEL_ROUTING_DECISION events.

**For Phase 9:** Cache hit/miss/invalidation events follow same structured pattern.

---

## Surprises & Adaptations

### 1. Anomaly Score Influenced Policy Escalation

**Surprise:** Initially, policy was budget-only (hardCeiling check). But anomaly spikes (forecast indicates cost blowup) should escalate decision even if current spend is OK.

**Adaptation:** Added anomaly score threshold (> 0.7) → escalate policy (ALLOW → DOWNGRADE, DOWNGRADE → BLOCK).

**Impact:** Proactive cost control. System can degrade before hard ceiling hits.

**For Phase 9:** Apply same pattern to memory. If reuse_quality is low (anomaly high), don't use cache.

---

### 2. State Machine Transitions are Not Just One-Way

**Surprise:** Initial design had ONLINE → DEGRADED_COST → OFFLINE_COST as linear. But recovery can skip: OFFLINE_COST → ONLINE directly if both SLA and cost recover simultaneously.

**Adaptation:** Added fast-path transitions. State machine now allows OFFLINE_COST → ONLINE if signals support it.

**Impact:** Faster recovery under sudden cost reduction (e.g., workload shift to cheaper agent).

**For Phase 9:** Cache recovery should be similarly flexible (CACHE_POISONED → CACHE_COLD → CACHE_WARM).

---

### 3. Drift Score and Cost Pressure are Independent But Correlated

**Surprise:** Thought drift and cost would be tightly coupled (high drift → need expensive model → high cost). But they're independent: you can have low drift + high cost (expensive model for quality) or high drift + low cost (cheaping out and regretting it).

**Adaptation:** Router weighs them separately in scoring function. Policy and routing decisions can diverge (policy says BLOCK cost, routing says we need LARGE model for SLA).

**Decision Rule:** SLA wins. If SLA requires LARGE model but cost policy says BLOCK, system goes OFFLINE_COST and gates non-critical traffic. Operator must re-negotiate SLA or budget.

**For Phase 9:** Memory quality vs cost follows same pattern. If reuse saves money but degrades quality below SLA, skip reuse.

---

## Patterns to Repeat

### 1. Extended Signals vs. New State Machine

**Pattern:** When adding a new cross-layer concern (cost, memory, etc.), extend existing RuntimeSignals + state machine rather than building parallel machinery.

**Why:** Forces priority decisions. Prevents divergent operator models.

**Application:** Phase 9 (memory), Phase 10 (latency SLA renegotiation), future phases.

---

### 2. Deterministic Test Matrices

**Pattern:** For every policy engine or router, produce a matrix: inputs × expected outputs. Cover edge cases (threshold crossing, ties, missing data).

**Why:** Test readability. Compliance auditability. Regression safety.

**Effort:** ~1 hour per matrix (3 matrices for Phase 8).

**Application:** Every phase with decision logic.

---

### 3. Audit Events as Queryable Artifact

**Pattern:** Every state transition, policy decision, or resource allocation emits a structured audit event. Events are immutable, timestamp-ordered, queryable by (type, context, payload).

**Why:** Enables post-hoc analysis. Compliance + debugging.

**Infrastructure:** Append-only log (or events table in time-series DB).

**Application:** Every phase.

---

### 4. Spec-First Development

**Pattern:** Lock full contracts (types, interfaces, audit events, metrics) in markdown before touching code.

**Why:** Forces design rigor. Enables parallel builder dispatch. No "what do we mean by this?" discussions at day 3 standup.

**Effort:** ~1 hour per phase (writing spec). Saves ~2 days in rework.

**Application:** Every major phase.

---

## What Worked Well

1. **Three-phase slice (Deploy → Heal → Optimize)** — Natural progression. Each phase adds a dimension of awareness.
2. **Extended state machine vs. parallel systems** — Single operator model. Cleaner transitions.
3. **Deterministic test matrices** — Caught design ambiguities before code.
4. **Audit events as first-class artifact** — Compliance-ready, queryable.
5. **Decoupled policy + routing** — Reusable in Phase 9 (cache policy + retrieval router).

---

## What Could Be Better

1. **Test Coverage for Phase 7** — Module resolution blocked some tests. Future phases should ensure test env is clean.
2. **Memory indexing in `.ijfw/memory/`** — Scattered across multiple files. Consider centralized MANIFEST.md for cross-phase lookups.
3. **Prometheus metrics validation** — Spec defines 11 metrics; no automated check that implementation emits all. Add pre-flight validation to integration tests.

---

## Actionable Next Steps

1. **Phase 8 Implementation** — Use builder agents to implement 10 files via D1–D3 plan. Reuse spec + matrices as acceptance criteria.
2. **Phase 9 Planning** — Replicate spec-first approach. Write PHASE_9_SPEC.md + matrices before June 24 standup.
3. **Trial `.planning/ROADMAP.md` workflow** — v0.8.0 scaffolded with `/ijfw-complete-milestone`. Decide if this workflow replaces current tracking or complements it.
4. **Prometheus metrics CI check** — Add validation that all 11 cic_cost_* metrics are emitted during Phase 8 integration tests.

---

**Retrospective facilitation:** Claude Haiku 4.5 + IJFW system  
**Timestamp:** 2026-06-23T00:00Z
