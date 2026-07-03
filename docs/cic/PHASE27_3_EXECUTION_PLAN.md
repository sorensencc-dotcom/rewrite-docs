# PHASE 27.3 EXECUTION PLAN
**Status:** Ready to execute (parallel with observability)  
**Duration:** 2-3 hours  
**Output:** 5 adapters + validation layer + test suite  

---

## TRACK A: ADAPTER TEST TEMPLATES (Parallel Execution)

### Test Structure (Per Adapter)
Each adapter gets:
- 5 unit tests (valid, schema failure, guard failure, oversize, malformed)
- 2 integration tests (with orchestrator, with WS broadcast)
- 1 fuzz test (randomized input)
- 1 regression test (known issue from prior phase)

### Deploy Order
```
T+0h:   Create test skeletons
T+30m:  Implement BrowserNavigateAdapter + tests
T+1h:   Implement BrowserScreenshotAdapter + tests
T+1.5h: Implement ModelGenerateAdapter + tests
T+2h:   Implement AnthropicClient + tests
T+2.5h: Implement PuppeteerEngine + tests
T+3h:   Full integration test suite
```

### Test Files
```
src/adapters/__tests__/
├── BrowserNavigateAdapter.test.ts
├── BrowserScreenshotAdapter.test.ts
├── ModelGenerateAdapter.test.ts
├── AnthropicClient.test.ts
├── PuppeteerEngine.test.ts
└── orchestrator.integration.test.ts
```

### Coverage Requirement
- 90% line coverage on all adapters
- 100% coverage on envelope wrapping
- All error paths tested
- All guard functions tested in isolation + in chain

---

## TRACK B: RUNTIME OBSERVABILITY PLAN (Parallel Execution)

[See separate document: CIC_RUNTIME_OBSERVABILITY_PLAN.md]

Key deliverables:
- Metrics schema (adapter latency, error rate, throughput)
- Structured logging config
- Prometheus scrape targets
- Grafana dashboards (adapter health, runtime SLIs)
- Alert rules (latency threshold, error spike, crash detection)

---

## MERGE GATE (SEQUENTIAL AFTER BOTH TRACKS)

### Phase 27.3 PR Merge Checklist
- [ ] All 5 adapters compile + type-safe
- [ ] All test files pass locally (npm test)
- [ ] 90%+ coverage reported
- [ ] No console.log, debugger, commented code
- [ ] Envelope invariants validated
- [ ] Guard functions validated in isolation
- [ ] Integration tests pass end-to-end

### Observability PR Merge Checklist
- [ ] Prometheus config correct (targets up)
- [ ] Grafana dashboards render (no 404s)
- [ ] Alert rules fire on test events
- [ ] Structured logs parseable by Prometheus

---

## ROLLBACK PLAN

If Phase 27.3 merge fails:
1. Identify failing adapter (test output will show which)
2. Revert that adapter only (git revert <commit>)
3. Keep validation layer + passing adapters
4. File issue for failing adapter, retry in next cycle

If observability merge fails:
1. Keep Phase 27.3
2. Defer observability to Phase 28
3. Use basic console logs until dashboards ready

---

## SUCCESS CRITERIA

**Phase 27.3 complete when:**
- All 5 adapters return validated envelopes
- All envelopes pass schema checks
- All guards fire correctly
- All tests green (130+ test cases)
- Integration chain works (navigate → screenshot → model → anthropic)

**Observability complete when:**
- Adapter metrics appear in Prometheus
- Grafana shows real adapter performance
- Alerts fire on errors
- Structured logs appear in output
