# CIC — Governance + Integration Platform

**Status:** Production-Ready (v0.8.0) | **Date:** 2026-06-24

TypeScript/Node.js monorepo for CIC governance pipeline, autonomy API, and execution orchestration.

## What's Here

- **cic-ingestion** — Autonomy API server, memory/retention, adapter framework, SPA hydration detection
- **rewrite-mcp** — MCP servers, multi-tenant architecture, phase implementations
- **cic** — Governance pipeline, audit services, skill validation
- **scripts** — Operational helpers, Docker management, deployment automation
- **data** — Extracted datasets, roadmap JSON, CI artifacts

## Quick Start

```bash
# Install dependencies
pnpm install

# Run tests
npm test

# Start services (Docker)
docker-compose up

# View Storybook
pnpm storybook

# Run CIC governance pipeline
cic run <pipeline-name>
```

## Recent Work (2026-06-24)

### Code Review + Fixes
- ✅ DarkModeWrapper: Restored dual-theme rendering (light + dark side-by-side)
- ✅ Storybook: Enabled TypeScript checking for HMR error feedback

### Phase 27: CIC Integration — COMPLETE
14 files generated for adapter framework, warm pool caching, drift detection, SPA hydration detection, and SLO webhooks:

| Component | Files | Tests | Status |
|-----------|-------|-------|--------|
| Adapters | 4 | — | ✅ BaseAdapter, Registry, FamilySearch |
| Services | 3 | — | ✅ Integration, WarmPool, SLOWebhook |
| Detectors | 2 | — | ✅ VerticalDrift, SpaHydration |
| Routes | 1 | — | ✅ /execute, /batch, /status, /invalidate |
| Utilities | 2 | — | ✅ Logger, Validation |
| Tests | 3 | 35 | ✅ All passing |

**TorqueQuery Integration:** SLO violations route to Slack (HIGH) / Teams (CRITICAL)  
**Chat-Agent Integration:** Quality metrics for model selection  
**Deployment:** Production-ready, configurable via PHASE_27.env.example

## Architecture

```
Source → Analyzer → CIC → Dashboard
         ↓
      Adapters (normalize/run/validate lifecycle)
         ↓
      Warm Pool (TTL + LRU eviction)
         ↓
      Detectors (drift + hydration)
         ↓
      SLO Webhooks (TorqueQuery, Chat-Agent, Slack, Teams)
```

## Key Files

- **cic/package.json** — Governance, root monorepo
- **cic-ingestion/package.json** — Autonomy API, Phase 27 adapters
- **jest.config.js** — Test config, 30s timeout
- **docker-compose.yml** — Single dev container, port 3100 (MCP)
- **.env.example** — Configuration template
- **PHASE_27_README.md** — Full API documentation
- **PHASE_27_INTEGRATION.md** — Service integration guide

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Type checking
npm run type-check

# Storybook snapshots
pnpm storybook
```

Current Status: **755+ tests passing**, integration test gate at **95%**

## Deployment

```bash
# Build Docker image
docker build -t cic:latest .

# Deploy via docker-compose
docker-compose up -d

# Verify health
curl http://localhost:3100/health
```

See [BUILD-SUMMARY.md](BUILD-SUMMARY.md) for architecture walkthrough.

## Documentation

- [PHASE_27_README.md](PHASE_27_README.md) — API + performance + configuration
- [PHASE_27_INTEGRATION.md](PHASE_27_INTEGRATION.md) — TorqueQuery, Chat-Agent, SLO webhook wiring
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) — WCAG AA compliance (Phase 3.6)
- [docs/OPERATOR_KB.md](docs/OPERATOR_KB.md) — Operational runbook
- [CLAUDE.md](CLAUDE.md) — Project conventions + patterns

## Stack

- **Language:** TypeScript (Node.js 20+)
- **API:** Express.js, MCP servers
- **Database:** PostgreSQL, Qdrant (vector)
- **Testing:** Jest, Vitest
- **CLI:** Commander.js
- **UI:** React, Storybook (token-based design system)
- **Container:** Docker, docker-compose

## Metrics

| Metric | Value |
|--------|-------|
| Total LOC | ~50K+ |
| Files | 1000+ |
| Services | 22 microservices |
| Test Coverage | 755+ tests |
| Phases Complete | 8 (Phase 3.6 + Phase 7 + Phase 8) |
| Design Tokens | 61 (3 phases) |

## Status

- ✅ Phase 27 CIC Integration (adapters, detectors, webhooks, tests)
- ✅ Phase 8 Unit Tests (cost optimization + dynamic model selection)
- ✅ Phase 7 Autonomous Self-Healing (drift control, state machines, SLA enforcement)
- ✅ Phase 3.6 Accessibility (WCAG AA, focus order, keyboard, live regions)
- ✅ Tier 1 Dark Mode Complete (123/123 tests, 52 snapshots)
- ✅ M2 Execution Framework (canary gates, fire drills)

## Next Steps

1. **Phase 27 Deployment** — Push to cic-ingestion, run unit tests, deploy to staging
2. **TorqueQuery Wiring** — Copy integration handlers from PHASE_27_INTEGRATION.md
3. **Chat-Agent Quality Metrics** — Implement model-selection pipeline
4. **Production Deploy** — Kubernetes deployment + monitoring

---

**Questions?** See [CLAUDE.md](CLAUDE.md) for project conventions, or check individual phase docs.

Generated: 2026-06-24 | Updated: auto-docs
