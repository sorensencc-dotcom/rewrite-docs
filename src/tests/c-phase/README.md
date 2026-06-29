# C-Phase Test Execution Plan: MAAL Routing Determinism Suite

## Overview

This directory contains the **operator-grade C-phase test suite** for proving MAAL routing is mathematically deterministic under mock mode.

## Test Files

### C-1: Routing Profile Determinism (`c01-routing-profile-determinism.test.ts`)

Validates that for a fixed `AgentRoutingProfile`:
- Same input → same route (100 runs)
- Same input → same fallback chain
- Same input → same provider selection
- Pinned profiles lock model selection

**Test count:** 12 tests

### C-2: Capability Filtering Determinism (`c02-capability-filtering-determinism.test.ts`)

Validates capability-based routing filtering:
- `requires: { toolCalls: true }` → always same model
- `requires: { vision: true }` → always same model
- Combined requirements (toolCalls + vision) deterministic
- maxTokens filtering stable
- No requirements fallback deterministic

**Test count:** 12 tests

### C-3: Fallback Chain Determinism (`c03-fallback-chain-determinism.test.ts`)

Validates fallback behavior under capability mismatches:
- Primary unavailable → always same fallback
- Fallback order stable
- Fallback count deterministic
- Fallback reasons consistent
- Final model/provider stable under fallback

**Test count:** 11 tests

### C-4: Agent Determinism (`c04-agent-determinism.test.ts`)

Validates agent behavior:
- `OrchestratorAgent.runPlan()` deterministic (100 runs)
- `EnrichmentAgent.enrich()` deterministic (50 runs)
- `SynthesisAgent.synthesize()` deterministic (100 runs)
- `AuditAgent.audit()` single & dual form deterministic
- Cross-agent patterns stable
- Agent trace/calls/receipts stable

**Test count:** 18 tests

### C-5: JSON Ordering Determinism (`c05-json-ordering-determinism.test.ts`)

Validates output serialization:
- 100 runs → byte-identical JSON
- Stable key ordering
- Stable array ordering
- Stable nested object ordering
- No UUID/timestamp fields
- 1000 runs → single unique serialization

**Test count:** 10 tests

### C-6: No Hidden Nondeterminism (`c06-no-hidden-nondeterminism.test.ts`)

Detects nondeterministic sources:
- No timestamp injection
- No random() calls
- No unstable JSON.stringify
- No provider latency variance
- No provider drift
- No async race conditions (100 parallel)
- Concurrent routing independent
- Error surfaces deterministic
- 1000-run stress test

**Test count:** 14 tests

## Stress Test

### `stress-determinism.js`

Runs 300+ determinism checks in parallel:
- 100 routing runs × 3 profiles = 300 runs
- 100 agent runs
- 100 parallel concurrent routing

**Pass criteria:** All outputs byte-identical

## Running Tests

### Run all C-phase tests:

```bash
npm test -- src/tests/c-phase
```

### Run specific tier:

```bash
npm test -- src/tests/c-phase/c01-routing-profile-determinism.test.ts
npm test -- src/tests/c-phase/c02-capability-filtering-determinism.test.ts
npm test -- src/tests/c-phase/c03-fallback-chain-determinism.test.ts
npm test -- src/tests/c-phase/c04-agent-determinism.test.ts
npm test -- src/tests/c-phase/c05-json-ordering-determinism.test.ts
npm test -- src/tests/c-phase/c06-no-hidden-nondeterminism.test.ts
```

### Run stress test (requires Node.js 18+):

```bash
node src/tests/c-phase/stress-determinism.js
```

## Expected Output

### Jest output (all 87 tests):

```
 PASS  src/tests/c-phase/c01-routing-profile-determinism.test.ts
 PASS  src/tests/c-phase/c02-capability-filtering-determinism.test.ts
 PASS  src/tests/c-phase/c03-fallback-chain-determinism.test.ts
 PASS  src/tests/c-phase/c04-agent-determinism.test.ts
 PASS  src/tests/c-phase/c05-json-ordering-determinism.test.ts
 PASS  src/tests/c-phase/c06-no-hidden-nondeterminism.test.ts

Tests:       87 passed, 87 total
```

### Stress test output:

```
📊 Test 1: Routing Determinism (100 runs × 3 profiles)...
  ✓ Profile mock → ✅ DETERMINISTIC
  ✓ Profile mock,claude-3.7 → ✅ DETERMINISTIC
  ✓ Profile mock,claude-3.7 → ✅ DETERMINISTIC

📊 Test 2: Agent Determinism (100 runs)...
  ✓ OrchestratorAgent → ✅ DETERMINISTIC

📊 Test 3: Parallel Routing (100 concurrent)...
  ✓ Parallel routing → ✅ DETERMINISTIC

============================================================
📈 STRESS TEST SUMMARY
============================================================

Routing:  300/300 ✅
Agent:    100/100 ✅
Parallel: 100/100 ✅

✅ C-PHASE DETERMINISM PASSED: All 300 runs produced identical output
```

## Pass Criteria

C-phase passes only if:

1. ✅ All 87 unit tests pass
2. ✅ All 300 stress test runs produce byte-identical output
3. ✅ No nondeterministic fields detected
4. ✅ No timestamp/UUID/random() in output
5. ✅ No async race conditions (100 parallel identical)
6. ✅ Agent determinism validated (100 runs identical)

## After C-Phase Passes

Proceed to:

1. **C-Obs: Routing Telemetry Layer**
2. **D-Phase: Offline Fire-Drill Harness**

## Test Artifacts

Each test produces implicit verification files:
- `routing_decision.json` (implicitly verified)
- `fallback_trace.json` (implicitly verified)
- `agent_trace.json` (implicitly verified)
- `provider_mock_receipts.json` (implicitly verified)

All must be **byte-stable** across runs.

---

**Total Test Coverage:** 87 Jest tests + 300 stress runs = **387 determinism assertions**
