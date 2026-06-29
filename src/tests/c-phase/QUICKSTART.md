# C-Phase Quick Start

## Files Generated

| File | Purpose | Tests |
|------|---------|-------|
| `c01-routing-profile-determinism.test.ts` | Route ID, fallback chain, model selection stability | 12 |
| `c02-capability-filtering-determinism.test.ts` | Vision/toolCalls/maxTokens filtering determinism | 12 |
| `c03-fallback-chain-determinism.test.ts` | Primary→fallback transition, chain ordering | 11 |
| `c04-agent-determinism.test.ts` | Agent trace, calls, receipts stability | 18 |
| `c05-json-ordering-determinism.test.ts` | Serialization, key/array/nested ordering | 10 |
| `c06-no-hidden-nondeterminism.test.ts` | Race conditions, timestamps, caching, modes | 14 |
| `stress-determinism.js` | 300+ parallel runs stress test | - |
| `README.md` | Full documentation | - |

**Total: 87 unit tests + 300 stress runs**

## One-Command Run

```bash
npm test -- src/tests/c-phase && node src/tests/c-phase/stress-determinism.js
```

## Individual Runs

### All Jest tests:
```bash
npm test -- src/tests/c-phase
```

### One tier:
```bash
npm test -- src/tests/c-phase/c01-routing-profile-determinism.test.ts
```

### Stress only:
```bash
node src/tests/c-phase/stress-determinism.js
```

## What Each Test Validates

### C-1 (12 tests)
- 100-run identical output per profile
- Route ID stability
- Fallback chain consistency
- Model selection under different profiles

### C-2 (12 tests)
- toolCalls filter determinism
- vision filter determinism
- Combined requirements (toolCalls + vision)
- maxTokens filtering
- No-requirement fallback

### C-3 (11 tests)
- Primary unavailable → same fallback always
- Fallback ordering (FIFO stable)
- Count of fallbacks consistent
- Reasons consistent
- Final model/provider stable

### C-4 (18 tests)
- OrchestratorAgent: 100 runs identical
- EnrichmentAgent: 50 runs identical
- SynthesisAgent: 100 runs identical
- AuditAgent: single & dual form
- Cross-agent patterns
- Trace/calls/receipts stable

### C-5 (10 tests)
- 100 runs → byte-identical JSON
- Key ordering stable
- Array ordering stable
- Nested object ordering stable
- No UUID/timestamp fields
- 1000 runs → single serialization

### C-6 (14 tests)
- No timestamp injection
- No random() calls
- No unstable JSON.stringify
- No provider latency variance
- No provider drift
- 100 parallel concurrent calls identical
- Concurrent routing independent
- Error messages deterministic
- 1000-run stress

## Exit Codes

```
0 = ✅ All tests passed
1 = ❌ Test failed (nondeterminism detected)
```

## Next After C-Phase Passes

1. Generate C-Obs telemetry layer (`routing_telemetry_instrumentation.ts`)
2. Generate D-Phase chaos matrix (`d-phase-chaos-suite.test.ts`)
3. Integration test fire drills

---

**Generated:** 2026-06-25  
**Phase:** C (Routing Determinism)  
**Status:** Ready for execution
