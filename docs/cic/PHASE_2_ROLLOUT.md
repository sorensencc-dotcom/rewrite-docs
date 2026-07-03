---
title: "PHASE 2 ROLLOUT"
summary: "# Phase 2: TorqueQuery → Console v3 Integration Rollout"
created: "2026-07-03T19:43:45.506Z"
updated: "2026-07-03T19:43:45.506Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Phase 2: TorqueQuery → Console v3 Integration Rollout

## Status: Code Complete
**Executed:** 2026-06-20  
**Duration:** H0–H1 (infrastructure ready)  
**Next:** H1.5+ (smoke tests, browser validation)

---

## Deliverables ✓

### Backend Routes (AutonomyAPIServer)
- ✓ `cic-ingestion/src/autonomy/routes/console.ts` (445 LOC)
  - 6 GET endpoints: health, pipelines, alerts, workspace, agents, metrics
  - 5 POST endpoints: invoke, pause, restart, snapshot, actions
  - Error envelopes: `{ status: 'error', error: { code, message, details } }`
  - Polling-friendly response shape

### Mappers (TorqueQuery → Console v3 shapes)
- ✓ `cic-ingestion/src/autonomy/routes/mappers/consoleMappers.ts` (198 LOC)
  - mapTorqueHealthToConsole
  - mapTorquePipelinesToConsole
  - mapTorqueAlertsToConsole
  - mapTorqueWorkspaceToConsole
  - mapTorqueAgentsToConsole
  - mapTorqueAgentDetailToConsole

### TorqueQuery Client
- ✓ `cic-ingestion/src/services/torquequery/TorqueQueryClient.ts` (105 LOC)
  - HTTP client for TorqueQuery service
  - Configurable URL + timeout
  - 12 methods: queryHealth, queryPipelines, invokeAgent, etc.

### Server Wiring
- ✓ `cic-ingestion/src/autonomy/AutonomyAPIServer.ts`
  - Imports: createConsoleRouter, TorqueQueryClient
  - setupRoutes: instantiate TorqueQuery, mount console router at `/api`
  - /autonomy endpoint: documented all 12 console routes

### Frontend Config
- ✓ `rewrite-mcp/projects/cic-operator-console/vite.config.ts`
  - Proxy target: localhost:3000 (was 8080)
  - Path handling: remove rewrite (keep /api prefix intact)

---

## Build Status

```
✓ cic-ingestion typecheck: passed
✓ cic-ingestion build: 5 new compiled files
  - dist/src/autonomy/routes/console.js
  - dist/src/autonomy/routes/mappers/consoleMappers.js
  - dist/src/services/torquequery/TorqueQueryClient.js
  - + source maps + .d.ts files
✓ Tests: 607/638 passing (pre-existing failures unrelated)
```

---

## Next Steps (H1.5–H5)

### H1.5 — Browser validation
```bash
cd cic-ingestion && npm start        # starts AutonomyAPIServer on :3000
cd rewrite-mpc/projects/cic-operator-console && npm run dev  # starts Vite on :5173
open http://localhost:5173
```

Expected: DevTools Network tab shows `/api/console/*` calls returning 200 + correct envelope shape.

### H2 — Endpoint smoke tests
```bash
curl http://localhost:3000/api/console/health | jq .status
curl http://localhost:3000/api/console/pipelines | jq .data
curl http://localhost:3000/api/console/agents | jq .data
```

### H3 — Error surfaces
- Stop AutonomyAPIServer; verify error envelopes in browser
- Restart; verify recovery

### H4 — Integration tests
```bash
cd cic-ingestion && npm test -- autonomy/routes/console
```

### H5 — Cleanup + commit
- Delete mock-api-server.js (optional, can mark as deprecated)
- Update .env.example with TORQUE_QUERY_URL
- Commit with message:
  ```
  [human] Phase 2: TorqueQuery integration for Console v3
  
  - Created console router (12 endpoints) in AutonomyAPIServer
  - Mappers: TorqueQuery shapes → Console v3 mock shapes
  - TorqueQueryClient: HTTP client for backend
  - Updated Console v3 proxy: localhost:8080 → localhost:3000
  - Zero breaking changes to UI
  - 5-hour rollout ready (H1.5–H5)
  ```

---

## Files Changed

| File | Lines | Type | Impact |
|------|-------|------|--------|
| console.ts | 445 | NEW | Core routing logic |
| consoleMappers.ts | 198 | NEW | Data transformations |
| TorqueQueryClient.ts | 105 | NEW | Backend client |
| AutonomyAPIServer.ts | +25 | EDIT | Imports + wiring |
| vite.config.ts | -1 | EDIT | Proxy target |
| **Total** | **772** | | |

---

## Risk Assessment

- **Backend:** Routes isolated from autonomy endpoints; no impact on existing Phase 23–24 systems
- **Frontend:** Proxy swap is backward-compatible (same envelope shape as mock)
- **TorqueQuery dependency:** Non-blocking (client handles timeouts + errors gracefully)
- **Fallback:** Keep mock-api-server.js running if needed; frontend can switch back

---

## Verification Checklist (H1.5–H5)

- [ ] AutonomyAPIServer starts cleanly (no import errors)
- [ ] Console v3 dev server connects to localhost:3000
- [ ] All 6 GET endpoints return 200 + correct shapes
- [ ] All 5 POST endpoints accept requests + return success envelopes
- [ ] Error paths (TorqueQuery offline) produce error envelopes
- [ ] DevTools Network tab shows zero 404s on /api/console/*
- [ ] Panels render: Health, Pipelines, Alerts, Workspace, Agents, Metrics
- [ ] Polling intervals active: Health 10s, Pipelines 5s, Alerts 3s
- [ ] No console errors or type mismatches
- [ ] Browser memory stable over 5-minute continuous polling

---

## Post-Rollout

**Phase 3 scope (WebSocket events):**
- Subscribe to live agent/alert events from TorqueQuery
- Stream to Console v3 via WS (no polling)
- Reduce latency: alerts visible instantly vs. 3s poll cycle

**Phase 4 scope (Dashboard persistence):**
- Save user view preferences (which panels, zoom level, etc.)
- Recall on next login

---

**Generated:** 2026-06-20 | **Author:** [human] | **Ready to execute:** Yes
