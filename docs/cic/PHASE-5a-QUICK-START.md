---
title: "PHASE 5a QUICK START"
summary: "# Phase 5a — Quick Start Guide"
created: "2026-07-03T19:43:45.452Z"
updated: "2026-07-03T19:43:45.452Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Phase 5a — Quick Start Guide

## Start Planning Console v3

### Local Development (No Docker)
```bash
# Compile TypeScript
npm run build

# Start server
node dist/src/planning-console/server.js

# Access at http://localhost:3000
```

### Docker (Recommended)
```bash
# Build all services
docker-compose build

# Start Console + all dependencies
docker-compose up planning-console

# Access at http://localhost:3000
```

### Verify Health
```bash
# Quick health check
curl http://localhost:3000/health

# Check all services accessible
curl http://localhost:3000/api/health
```

---

## All 29 HTTP Routes

### Data Fetchers (GET) — 20 Routes

#### Health Panel (5)
- `GET /api/health` — Runtime status
- `GET /api/metrics` — Event rate
- `GET /api/governance/decisions` — Decision log
- `GET /api/approvals/pending` — Approval queue
- `GET /api/vector/metrics` — Vector DB health

#### Pipelines Panel (4)
- `GET /api/ingestion/status` — Active jobs
- `GET /api/queue/depth` — Queue depth
- `GET /api/synthesis/results` — Synthesis results
- `GET /api/errors` — Failures

#### Agents Panel (4)
- `GET /api/autonomy/proposals` — Invocation history
- `GET /api/approvals/history` — Approval audit
- `GET /api/agents/failures` — Failure patterns
- `GET /api/cost/tracking` — Cost tracking

#### Alerts Panel (5)
- `GET /api/alerts/health` — Health thresholds
- `GET /api/drift/warnings` — Drift warnings
- `GET /api/violations` — Governance violations
- `GET /api/cost/alerts` — Cost overruns
- `GET /api/guardrail/blocks` — Guardrail blocks

#### Utility (2)
- `GET /api/skills` — Skill registry
- `GET /` → Static HTML

### Control Endpoints (POST) — 6 Routes

- `POST /api/ingestion/pause` — Pause events
- `POST /api/ingestion/resume` — Resume events
- `POST /api/autonomy/proposals/invoke` — Invoke skill
- `POST /api/snapshot/export` — Export state
- `POST /api/restart` — Restart runtime
- `POST /api/approvals/clear` — Clear queue

### Server (1)
- `GET /health` — Server health

---

## All 8 Data Sources

| Source | Port | Key Routes |
|--------|------|-----------|
| Unified API | 3100 | `/api/health`, `/api/errors`, `/queue/depth` |
| CIC Ingestion | 3116 | `/api/autonomy/proposals`, `/api/metrics`, `/api/vector/metrics` |
| Governance | 3113 | `/api/violations`, `/api/approvals/pending` |
| Vault | 3111 | `/api/governance/decisions`, `/api/approvals/history` |
| TorqueQuery | 3110 | [via Unified API] `/api/queue/depth` |
| Knowledge Graph | 3107 | `/api/ingestion/status`, `/api/drift/warnings` |
| Planning Engine | 3114 | `/api/synthesis/results` |
| Harvester v2 | 3115 | `/api/cost/tracking`, `/api/cost/alerts` |

---

## All 6 Control Endpoints

### 1. Pause Ingestion
```bash
curl -X POST http://localhost:3000/api/ingestion/pause \
  -H 'Content-Type: application/json' \
  -d '{"reason":"debugging","duration":15}'
```

### 2. Resume Ingestion
```bash
curl -X POST http://localhost:3000/api/ingestion/resume
```

### 3. Invoke Skill
```bash
curl -X POST http://localhost:3000/api/autonomy/proposals/invoke \
  -H 'Content-Type: application/json' \
  -d '{"skillId":"phase-synthesis","parameters":{"phase":"5a"}}'
```

### 4. Snapshot Export
```bash
curl -X POST http://localhost:3000/api/snapshot/export \
  -H 'Content-Type: application/json' \
  -d '{"snapshotType":"all","format":"tar.gz","includeLogs":true}' \
  --output snapshot.tar.gz
```

### 5. Restart Runtime
```bash
curl -X POST http://localhost:3000/api/restart
```

### 6. Clear Approval Queue
```bash
curl -X POST http://localhost:3000/api/approvals/clear \
  -H 'Content-Type: application/json' \
  -d '{"filterExpiredOnly":true}'
```

---

## Panel Data Refresh Rates

| Panel | Refresh | Latency |
|-------|---------|---------|
| Health | 10s | < 200ms |
| Pipelines | 5-10s | < 500ms |
| Agents | 10s | < 300ms |
| Alerts | 5s | < 200ms |

---

## Files

| File | Purpose |
|------|---------|
| `rewrite-mcp/src/planning-console/server.ts` | Express server (409 LOC) |
| `rewrite-mcp/src/planning-console/PlanningConsoleUI.tsx` | React components (617 LOC) |
| `rewrite-mcp/Dockerfile.planning-console` | Docker build |
| `docker-compose.yml` | Service wiring |
| `PHASE-5a-IMPLEMENTATION.md` | Full docs |
| `PHASE-5a-EXECUTIVE-SUMMARY.md` | High-level overview |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Connection refused` | Check `docker-compose up` (all services running?) |
| `404 on /api/health` | Unified API not responding (check port 3100) |
| `CORS errors in browser` | Routes set correct headers (should be OK) |
| `Slow panel refresh` | Check service latency: `curl http://localhost:3100/health` |

---

## Ready?

✓ All 8 data sources wired  
✓ All 6 controls implemented  
✓ All 29 routes working  
✓ Docker integration complete  

**Next:** `docker-compose up planning-console`
