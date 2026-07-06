---
title: "PHASE 30 MVP SPEC REVIEW"
summary: "# Review: PHASE-30-MVP-SPEC.md"
created: "2026-07-03T19:43:45.438Z"
updated: "2026-07-03T19:43:45.438Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Review: PHASE-30-MVP-SPEC.md

Reviewed: 2026-06-15T00:00:00Z
Reviewer: ijfw-review
Domain: software

## Summary

Spec is ~90% build-ready but has 3 critical blockers preventing no-prompt execution: (1) Phase 2.5 config schema defined but not wired into CausalEngine — will hardcode all rules/params if 2.5 not ready; (2) GraphStore temporal methods (getNodesAsOf, getEdgesAsOf) assumed but not verified to exist in Phase 29 implementation; (3) Integration test mocks don't validate temporal constraints (valid_from/valid_to), tests will pass locally but may fail against real GraphStore. Additionally, 2 of 4 API endpoints (/graph, /interventions) lack integration tests. All source code compiles cleanly and follows TypeScript best practices.

## BLOCK findings (must-fix)

- **Section 5 (CausalEngine.ts)**: Config schema defined in 9.8 but not consumed here — rules hardcoded. Wire Phase 2.5 config or acknowledge will be post-Phase-2.5. 
- **Section 9.6 (GraphStore interface)**: getNodesAsOf/getEdgesAsOf assumed but Phase 29 implementation not verified. Add explicit check: `if (!graphStore.getNodesAsOf) throw new Error("GraphStore missing temporal API")`
- **Section 7 (routes.ts)**: POST /counterfactual route accepts intervention type without enum validation. Add: `if (!["remove", "add", "modify", "increase", "decrease"].includes(intervention.type))` guard.
- **Section 9.5 (integration test)**: Mock snapshot ignores valid_from/valid_to constraints. Real GraphStore will filter nodes/edges by temporal validity; tests don't validate this. Add temporal bounds to mockSnapshot.

## FLAG findings (should-discuss)

- **Section 4 (CausalRules.ts, applyRules function)**: Returns first matching rule, ignores confidence. If rule_memory_from_skill matches (high) and rule_action_from_memory_decision also matches (medium), will return memory_from_skill always. Should rank by confidence: `return results.sort((a,b) => confidence.indexOf(b.confidence) - confidence.indexOf(a.confidence))[0]`
- **Section 6 (Counterfactual.ts)**: removeIntervention only checks direct incoming edges, not transitive causality. Artifact will survive edge removal if there's a longer path. Document as "first-order approximation" or implement path-existence check.
- **Section 3 (CausalSnapshot.ts, snapshotAt)**: Config defines snapshotCacheTTL but snapshotAt rebuilds map every call. Will thrash if explainEvent called multiple times. Implement Map<number, KGSnapshot> cache with TTL or doc as "future optimization."
- **Section 7 (routes.ts, error handling)**: All error handlers return `{ error: err.message }`. Should log full stack trace to stderr for debugging: `console.error(err); res.status(500).json({...})`
- **Section 9.5 (integration tests)**: Only 2 of 4 endpoints tested (GET /why, POST /counterfactual). Missing: GET /graph, GET /interventions. Add 2 more test cases.
- **Section 10.6 (integration checklist)**: GraphStore.getEvent(id) contract undefined — what if event lacks timestamp? If timestamp is missing, snapshotAt will fail. Add guard: `if (!atom.t || atom.t <= 0) throw new Error("Event has invalid timestamp")`

## NIT findings (polish)

- **Section 9.7 (README.md) vs 11.5 (Integration README)**: Duplicates. Main README should reference 11.5 or consolidate.
- **Section 2 & 9.6**: CausalAtom interface vs GraphStoreEvent interface — two similar but slightly different event shapes. Clarify which is authoritative (should be CausalAtom after toAtom conversion).
- **Section 9.3 (CausalEngine tests)**: beforeEach creates mockGraphStore but doesn't spy on calls. Should verify getEvent was called with correct ID: `expect(graphStore.getEvent).toHaveBeenCalledWith("evt-1")`
- **Section 4**: Rule functions are private (no export). Makes them untestable in isolation. Export rule functions or add internal integration tests covering all 10 rules, not just 4.

## Recommendations for no-prompt build

1. **Before Phase 30 build starts:** Verify Phase 29 GraphStore exports getNodesAsOf(t) and getEdgesAsOf(t) as async methods. If missing, Phase 30 build will fail immediately.

2. **If Phase 2.5 config not ready:** Ship Phase 30 with hardcoded rule params (all "high" confidence, no minEvidenceCount filter). Wire config injection in Phase 30.1 after Phase 2.5 lands. Flag this in git commit message.

3. **Add 2 lines to causal.integration.test.ts before running npm test:**
   ```ts
   test("GET /causal/graph returns causes+event+effects", async () => {...})
   test("GET /causal/interventions suggests candidates", async () => {...})
   ```
   Otherwise "14 tests passing" claim is optimistic (really 12).

4. **Add error guard to CausalEngine.explainEvent():**
   ```ts
   if (!atom.t || atom.t <= 0) {
     return { event: atom, explanation: null, error: "Invalid event timestamp" }
   }
   ```

5. **No other blockers prevent Docker build.** All 7 source files compile, all 13 files are specified with line counts, jest config already supports ts-jest, supertest dependency exists in package.json.

