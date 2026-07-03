# Workstream B & C Scaffolds

M2 execution framework with skeleton implementations for WS-B and WS-C.

## Workstream B: SLO Controller + Prometheus

**Status:** 🟡 Staged (starts after WS-A canary passes)  
**Target:** 100% Prometheus scrape success, ±1% burn-rate accuracy, <200ms canary abort

### Skeleton Files

- `src/slo-controller/types.ts` — Type definitions (SLORule, BurnRateResult, SLOViolationEvent)
- `src/slo-controller/slo-controller.ts` — Main SLO controller with burn-rate calculation
- `src/observability/metrics-endpoint.ts` — Prometheus metrics exporter + /metrics endpoint

### Implementation Checklist

```typescript
// SLO Controller (slo-controller.ts)
- [ ] loadRules() — Load SLO rules from config
- [ ] setMetrics() — Receive current metrics snapshot
- [ ] calculateBurnRate() — Burn rate = (1 - target) / window
- [ ] evaluate() — Check all rules, trigger violations
- [ ] onViolation() — Register violation callbacks
- [ ] getCanaryGateStatus() — Return pass/fail for canary gates

// Metrics Endpoint (metrics-endpoint.ts)
- [ ] recordLedgerWrite() — Track write latency/success
- [ ] recordSLOViolation() — Count violations per SLO
- [ ] setBurnRate() — Update burn rate gauge
- [ ] recordCanaryAbort() — Count aborts
- [ ] recordHttpRequest() — Track request latency/status
- [ ] recordGovernanceHookLatency() — Monitor hook performance
- [ ] getMetrics() — Return Prometheus text format
```

### Integration Points

1. **Observability Layer** → Collect latency/error-rate/saturation metrics
2. **Canary Gates** → Call `getCanaryGateStatus()` for gate validation
3. **Alerting** → Fire events to Slack/PagerDuty on violations
4. **Prometheus** → Expose `/metrics` endpoint for scraping

### Tests Required

- Unit: ≥30 tests (burn-rate calc, rule loading, violation triggers)
- Integration: ≥10 tests (end-to-end evaluation, metrics collection)
- Prometheus: ≥5 tests (scrape success, text format, label validation)

---

## Workstream C: Adapter Gateway Caching

**Status:** 🟡 Staged (starts after WS-A canary passes)  
**Target:** ≥85% hit-rate, <40ms p99 latency, no cache stampedes

### Skeleton Files

- `src/adapter-gateway/cache.ts` — L1 in-memory + L2 distributed cache with metrics

### Implementation Checklist

```typescript
// L1 Cache (in-memory)
- [ ] get() — Fetch from L1 with TTL check, update LRU
- [ ] set() — Store in L1, evict LRU if full
- [ ] invalidate() — Remove entry
- [ ] getMetrics() — Return hit/miss/eviction counts

// L2 Cache (Redis)
- [ ] get() — Fetch from Redis (connect to configured host:port)
- [ ] set() — Store in Redis with TTL
- [ ] invalidate() — Remove entry
- [ ] connection pooling — Maintain persistent pool

// Unified Cache
- [ ] get() — L1 hit → return; L2 hit → populate L1 + return
- [ ] set() — Write both L1 and L2
- [ ] invalidate() — Clear both layers
- [ ] Cache stampede prevention — Deduplicate concurrent misses
```

### Integration Points

1. **Adapter Gateway Request Path** → Check cache before origin call
2. **Canary Gates** → Validate hit-rate ≥85%, p99 < 40ms
3. **Invalidation Rules** → Clear cache on ledger updates
4. **Metrics Export** → Send hits/misses/evictions to Prometheus

### Tests Required

- Unit: ≥25 tests (LRU eviction, TTL expiry, get/set/invalidate)
- Integration: ≥8 tests (L1+L2 hierarchy, fallback, concurrency)
- Load: ≥3 tests (hit-rate under normal/spike loads, p99 latency)

---

## Execution Timeline

### Today (Session)
- ✅ Canary gates framework (WS-A validation)
- ✅ Fire drills framework (4 scenarios)
- ✅ WS-B/C GitHub issues created
- ✅ WS-B/C skeleton scaffolds done
- ✅ Team notified (#cic-dev)

### When WS-A Canary Passes
1. WS-B team begins implementation (metrics, burn-rate, SLO rules)
2. WS-C team begins implementation (cache, hit-rate, load tests)
3. Both run in parallel

### When A/B/C Complete
1. All three pass canary gates (98% tests, acceptance criteria met)
2. Fire drills execute (4 scenarios, all pass)
3. M2 gate decision at 2026-06-22 18:00 UTC

---

## File Map

```
/c/dev/
├── src/
│   ├── slo-controller/
│   │   ├── types.ts           ✅ Scaffolded
│   │   └── slo-controller.ts  ✅ Scaffolded
│   ├── adapter-gateway/
│   │   └── cache.ts            ✅ Scaffolded
│   └── observability/
│       └── metrics-endpoint.ts ✅ Scaffolded
├── scripts/
│   ├── canary-gates.ts        ✅ Committed
│   └── fire-drills.ts         ✅ Committed
├── canary-gates-config.json   ✅ Committed
├── CANARY_GATES.md            ✅ Committed
└── WS-B-C-SCAFFOLD.md         ✅ This file
```

---

## Next Steps

1. **WS-A Team:** Validate schema, implement DB client, run `npm run canary-gates:A`
2. **WS-B Team (Waiting):** Review skeleton, plan implementation
3. **WS-C Team (Waiting):** Review skeleton, plan implementation
4. **When A Passes:** B/C teams activate in parallel
5. **Daily:** Check canary gates for progress

**Questions?** See GitHub issues #2 (WS-A), #3 (WS-B), #4 (WS-C).
