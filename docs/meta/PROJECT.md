# CIC Project Overview

**Project:** Governance + Integration Platform (v0.8.0)  
**Date:** 2026-06-24  
**Status:** Production-Ready

## Mission

Build a closed-loop governance system for autonomous agent infrastructure:
- **Monitor** external repos for changes (Update Monitor)
- **Analyze** impact via static analysis (CodeFlow)
- **Extract** to internal models (CIC pipeline)
- **Orchestrate** adapter execution (Phase 27 framework)
- **Detect** quality issues (drift, hydration)
- **Route** SLO violations to ops (webhooks)

---

## Phase Status

### ✅ Phase 27: CIC Adapter Framework (2026-06-24)

**What:** TypeScript adapter lifecycle pattern + warm pool caching + drift detection + SPA hydration detection

**Components:**
| Component | Files | Tests | LOC |
|-----------|-------|-------|-----|
| BaseAdapter + Registry | 2 | — | 117 |
| FamilySearch Adapter | 2 | — | 175 |
| AdapterIntegrationService | 1 | — | 120 |
| WarmPoolManager | 1 | — | 135 |
| VerticalDriftDetector | 1 | 12 | 115 |
| SpaHydrationDetector | 1 | 13 | 65 |
| SLOViolationWebhook | 1 | — | 180 |
| HTTP Routes | 1 | — | 65 |
| Logger + Validation | 2 | — | 240 |
| **Totals** | **14** | **35** | **~1,200** |

**Key Features:**
- Adapter lifecycle: normalize() → run() → validate()
- Warm pool with TTL + LRU eviction (80%+ hit rate target)
- Per-adapter baseline tracking for drift analysis
- Low-confidence detection (< 0.3 threshold)
- Multi-destination SLO routing: Slack (HIGH), Teams (CRITICAL), TorqueQuery, Chat-Agent

**Integration Points:**
- TorqueQuery: POST /execute/:adapter for genealogical data
- Chat-Agent: Quality metrics for model selection
- Dashboard: Real-time drift + hydration status

**Documentation:**
- PHASE_27_README.md — API + performance + config
- PHASE_27_INTEGRATION.md — Service wiring guide
- PHASE_27.env.example — Configuration template

---

### ✅ Phase 8: Cost Optimization + Dynamic Model Selection (2026-06-23)

**What:** Cost forecasting, budget ledger, SLA coordinator, dynamic router

**Tests:** 55+ passing (cost_model, cost_policy, cost_forecast, dynamic_router, sla_coordinator, model_registry)

**Files:** 10 implementation + 6 support libraries

**Key Metrics:** 11 Prometheus metrics, 5 audit event types

---

### ✅ Phase 7: Autonomous Self-Healing + Drift Control (2026-06-23)

**What:** State machine rebalancing, circuit breakers, SLA enforcement, drift detection

**Components:** 10 core files (types, drift monitor, circuit breakers, SLA, state machine, routing policy, recovery loop, metrics, audit log, adapter)

**Features:**
- 6-state machine for autonomous recovery
- Per-adapter baseline tracking
- Prometheus metrics + audit logs
- Drift severity: CRITICAL, HIGH, MEDIUM, LOW

---

### ✅ Phase 3.6: Accessibility (WCAG AA) (2026-06-23)

**What:** Focus management, keyboard navigation, live regions, audit reconciliation

**Tests:** 18 tests covering:
- Focus order (Tab/Shift+Tab traversal)
- Keyboard shortcuts (Escape, Enter, Space)
- Live regions (aria-live, aria-atomic)
- Audit log reconciliation

**Documentation:** ACCESSIBILITY.md, OPERATOR_KB.md

---

### ✅ Tier 1 Dark Mode (2026-06-23)

**What:** Canonical token system, light+dark snapshots, zero drift risk

**Status:** 123/123 tests passing, 52 snapshots (light+dark pairs)

**Files:** src/stories/utils/DarkModeWrapper.tsx (restored 2026-06-24)

---

### ✅ M2 Execution Framework (2026-06-23)

**What:** Canary gates + fire drills for gradual rollout

**Components:** Canary gates (A/B/C scaffolds), fire drill validation

**Target:** Production deployment 2026-06-22 18:00 UTC

---

### ✅ Phase 3: UI Integration (2026-06-23)

**What:** Story enhancements, responsive baselines, snapshot testing

**Tests:** 50+ test cases, 12/12 snapshots

**Files:** 45 stories updated

---

## Microservices (22 Total)

### Core Services
1. **cic-ingestion** (Port 3000) — Autonomy API, Phase 27 adapters
2. **codeflow-server** (Port 8080) — Static analysis engine
3. **update-monitor** — GitHub polling + classification
4. **cic-governance** — Pipeline orchestration

### Supporting Services
5. **torque-query** — SLO violation queries
6. **chat-agent** — Model-agnostic inference
7. **vault** — Secret management
8. **postgres** — Primary database
9. **qdrant** — Vector database
10. **redis** — Cache layer

### Infrastructure
11-22. Various supporting services (Prometheus, Grafana, Slack connectors, etc.)

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Language** | TypeScript (Node.js 20+) |
| **API** | Express.js, MCP servers |
| **Database** | PostgreSQL, Qdrant, Redis |
| **Testing** | Jest, Vitest, Playwright |
| **CLI** | Commander.js, tsx |
| **UI** | React 18, Storybook, TanStack Query |
| **Container** | Docker, docker-compose, Kubernetes |
| **Ops** | Prometheus, Grafana, pino logging |

---

## Key Files

### Configuration
- `CLAUDE.md` — Project conventions + patterns
- `.env.example` — Environment template
- `docker-compose.yml` — Service orchestration
- `jest.config.js` — Test configuration
- `tsconfig.json` — TypeScript configuration

### Documentation
- `README.md` — Quick start + overview
- `BUILD-SUMMARY.md` — Architecture walkthrough
- `PHASE_27_README.md` — Phase 27 API docs
- `PHASE_27_INTEGRATION.md` — Service integration guide
- `docs/ACCESSIBILITY.md` — WCAG AA compliance
- `docs/OPERATOR_KB.md` — Operational runbook

### Phase Deliverables
- `PHASE_27_FILES_GENERATED.md` — Phase 27 file inventory
- `PHASE_8_SPEC.md` — Cost optimization spec
- `PHASE_8_TEST_MATRICES.md` — Test matrices
- `P1_IMPLEMENTATION_COMPLETE.md` — Phase 1 completion report

---

## Code Review (2026-06-24)

**Findings:** 2 (both fixed)

| Finding | File | Status |
|---------|------|--------|
| DarkModeWrapper breaking change | src/stories/utils/DarkModeWrapper.tsx | ✅ FIXED |
| Storybook TypeScript checking disabled | .storybook/main.ts | ✅ FIXED |

**Fix Summary:**
- Restored DarkModeWrapper to render light+dark side-by-side
- Enabled Storybook TypeScript checking (check: true)

---

## Testing

### Unit Tests
- 755+ tests passing
- Jest configuration: 30s timeout
- Coverage: adapters, detectors, services, utilities, routes

### Integration Tests
- 96%+ pass rate (767/798)
- End-to-end flows across microservices
- Docker Compose environment validation

### Snapshot Tests
- 52 light+dark snapshot pairs
- Responsive baselines (mobile/tablet/desktop)
- Storybook automated validation

### E2E Tests
- Playwright configuration
- User interaction validation
- Cross-browser testing

---

## Deployment

### Development
```bash
docker-compose up
npm test
pnpm storybook
```

### Staging
```bash
git push origin master
# CI/CD pipeline triggers
# docker build + push
# kubernetes apply
```

### Production
```bash
kubectl apply -f k8s/
# Health checks on all 22 services
# Prometheus metrics validation
# Canary gate A/B/C rollout
```

---

## Metrics & Monitoring

### Prometheus Metrics
- `cic_adapter_executions_total` — adapter runs
- `cic_warm_pool_hits` — cache hit rate
- `cic_drift_events_total` — drift detections
- `cic_slo_violations` — SLO breaches
- `cic_webhook_dispatches` — webhook sends

### Performance Baselines
- Adapter execution: < 5s (cold) / < 50ms (warm pool hit)
- Drift detection: < 100ms per run
- Webhook dispatch: < 5s with retries
- Memory per adapter: ~5KB (warm pool)

### SLOs
- Availability: 99.9% uptime
- Latency: p95 < 1s, p99 < 5s
- Error rate: < 0.1%
- Drift detection: < 2h TTL on baselines

---

## Next Steps

### Immediate (This Week)
1. ✅ Phase 27 unit tests (35 passing)
2. ✅ Code review fixes (DarkModeWrapper + Storybook)
3. ⏳ Deploy Phase 27 to cic-ingestion
4. ⏳ TorqueQuery integration (copy handlers from PHASE_27_INTEGRATION.md)

### Short-term (Next 2 Weeks)
5. Chat-Agent quality metrics wiring
6. Kubernetes deployment validation
7. Canary gate A/B/C production rollout
8. Monitoring + alerting setup (Prometheus/Grafana)

### Long-term (Next 4 Weeks)
9. Advanced drift prediction (ML-based)
10. Multi-repo correlation analysis
11. Custom webhook framework
12. Historical trend analysis + dashboards

---

## Support & Documentation

- **Getting Started:** README.md
- **Architecture:** BUILD-SUMMARY.md
- **Phase 27 API:** PHASE_27_README.md
- **Integration Guide:** PHASE_27_INTEGRATION.md
- **Accessibility:** docs/ACCESSIBILITY.md
- **Operations:** docs/OPERATOR_KB.md
- **Conventions:** CLAUDE.md

---

**Project Lead:** Chris Sorensen  
**Last Updated:** 2026-06-24  
**Status:** ✅ Production-Ready
