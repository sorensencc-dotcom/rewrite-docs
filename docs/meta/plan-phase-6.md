---
title: "PLAN PHASE 6"
summary: "# Phase 6: Autonomous Cross-Orchestrated Operation — Execution Plan"
created: "2026-07-03T19:43:45.884Z"
updated: "2026-07-03T19:43:45.884Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Phase 6: Autonomous Cross-Orchestrated Operation — Execution Plan

**Date:** 2026-06-17  
**Status:** LOCKED  
**Target merge:** 2026-06-24

---

## 0. Executive Summary

Phase 6 enables CIC + Labs + Collab to run autonomously, cooperatively, with GLM-5 as the shared brain and the unified router as control plane.

**Locked decisions:**
- ✅ Queue backend: **Redis**
- ✅ Scope: **Prod-critical only** (persistence + graceful shutdown)
- ✅ Retry engine: **Post-merge** (immediate after Phase 6 lands)
- ✅ Auth/authz: **Optional** (only if external exposure)

---

## 1. Scaffolding (Already Complete)

These were generated 2026-06-17 and are production-ready:

| Artifact | Status | Path |
|---|---|---|
| Config files | Done | `castironforge/config/scheduler.yaml`, `collab-task.yaml`, `workflows.yaml`, `registry.collab.yaml` |
| contextBuilder.js | Done | `castironforge/tools/collab/contextBuilder.js` |
| reportGenerator.js | Done | `castironforge/tools/collab/reportGenerator.js` |
| collabOrchestrator.js | Done | `castironforge/runtime/collabOrchestrator.js` |
| in-memory queue.js | Done | `castironforge/runtime/queue.js` (temporary) |
| CIC orchestrator stub | Done | `castironforge/runtime/cic/orchestrator.js` |
| Labs orchestrator stub | Done | `castironforge/runtime/labs/orchestrator.js` |
| bootloader.js | Done | `castironforge/runtime/bootloader.js` |
| router.js | Done | `castironforge/runtime/router.js` |
| telemetry.js | Done | `castironforge/runtime/telemetry.js` |
| orchestratorLifecycle.js | Done | `castironforge/runtime/orchestratorLifecycle.js` |
| configLoader.js | Done | `castironforge/runtime/configLoader.js` |
| workerPool.js | Done | `castironforge/runtime/workerPool.js` |
| glmTrace.js | Done | `castironforge/runtime/glmTrace.js` |

**All scaffolding is ready.**

---

## 2. Execution Sequence (3 Phases)

### Phase 6.A: Redis-Backed Queue (Prod-Critical)

**Goal:** Replace in-memory queue with Redis + atomic operations.

**Deliverables:**
1. `castironforge/runtime/queue.redis.js` — Redis queue adapter
   - `enqueueTask(task, priority)` → Redis sorted set
   - `dequeueTask()` → atomic ZPOPMIN
   - `moveToDLQ(task, reason)` → DLQ list
   - Connection pooling + retry logic
   - Clean shutdown hook

2. Unit tests:
   - Enqueue/dequeue priority ordering
   - DLQ behavior
   - Connection failure handling
   - Empty queue behavior

**Acceptance criteria:**
- ✅ All tasks survive container restart
- ✅ Priority order maintained across restarts
- ✅ DLQ populated on failures

**Effort:** 2-3 hours  
**Blocker for merge:** YES

---

### Phase 6.B: Graceful Shutdown Handler (Prod-Critical)

**Goal:** Safe shutdown for containerized environments (Docker, K8s, systemd).

**Deliverables:**
1. `castironforge/runtime/gracefulShutdown.js` — SIGTERM/SIGINT handler
   - Accept no new tasks
   - Drain in-flight tasks
   - Flush metrics to storage
   - Persist queue state
   - Close connections
   - Exit cleanly (code 0)

2. Integration into `bootloader.js`:
   - Install handler at startup
   - Timeout after 30s → force exit
   - Log shutdown sequence

3. Unit tests:
   - SIGTERM triggers drain
   - In-flight tasks complete
   - Queue persisted
   - Metrics exported
   - Clean exit

**Acceptance criteria:**
- ✅ `SIGTERM` → drain → exit 0
- ✅ No tasks lost during shutdown
- ✅ Docker `docker stop` waits gracefully

**Effort:** 1-2 hours  
**Blocker for merge:** YES

---

### Phase 6.C: Integration + Smoke Tests (Pre-Merge Gate)

**Goal:** Verify Phase 6.A + 6.B work together.

**Deliverables:**
1. Integration test suite:
   - Start Redis + bootloader
   - Enqueue 10 tasks
   - Verify all execute
   - Send SIGTERM
   - Verify drain + exit
   - Restart
   - Verify DLQ state restored

2. Smoke tests:
   - Task lifecycle (queue → execute → complete)
   - Priority ordering under load
   - DLQ population on failure
   - Metrics export on shutdown

**Acceptance criteria:**
- ✅ All integration tests pass
- ✅ 10/10 tasks survive restart cycle
- ✅ Zero data loss

**Effort:** 1-2 hours  
**Blocker for merge:** YES

---

## 3. Immediate Post-Merge (Within 3 Days)

### Phase 6.D: Retry/Backoff Engine (Post-Merge)

**Goal:** Self-healing task execution.

**Deliverables:**
1. `castironforge/runtime/retryEngine.js`:
   - `attempts` counter on tasks
   - Exponential backoff: 1s → 2s → 4s → 8s → 16s
   - Max retry threshold: 5 attempts
   - After N failures → DLQ + alert

2. Wire into `collabOrchestrator` + `runCICPhase` + `runLabsPhase`:
   - Catch errors
   - Re-enqueue with backoff
   - Log attempt count

3. Tests: 12 test cases (retry success, exhaustion, timing, etc.)

**Timeline:** 2026-06-24 → 2026-06-27 (3 days post-merge)

---

## 4. Deferred (After Phase 6 Stable)

### Phase 6.E: Auth/Authz Middleware

Only needed if exposing Phase 6 APIs externally (Chat Engine integration, etc.).

**Deliverables:**
- Router validation of `task.origin` + permissions
- RBAC for orchestrator access
- Audit log of denied tasks

**Timeline:** TBD (conditional on external exposure)

---

## 5. Dependency Map

```
Redis (external) ← required
    ↓
Phase 6.A: Redis Queue
    ↓
Phase 6.B: Graceful Shutdown
    ↓
Phase 6.C: Integration Tests
    ↓
MERGE GATE ✅
    ↓
(Pause for stability validation: 2026-06-24)
    ↓
Phase 6.D: Retry Engine (post-merge, 3-5 days)
```

---

## 6. File Manifest

### New files (Phase 6.A + 6.B + 6.C)

```
castironforge/
  ├── runtime/
  │   ├── queue.redis.js           ← NEW (Phase 6.A)
  │   ├── gracefulShutdown.js      ← NEW (Phase 6.B)
  │   ├── bootloader.js            ← MODIFY (add shutdown handler)
  │   └── tests/
  │       ├── queue.redis.test.js  ← NEW (Phase 6.C)
  │       └── gracefulShutdown.test.js ← NEW (Phase 6.C)
  └── docs/
      └── PHASE_6_EXECUTION.md     ← THIS FILE
```

### Modified files

```
castironforge/
  ├── runtime/bootloader.js        ← Add gracefulShutdown integration
  ├── docker-compose.yml           ← Add Redis service
  ├── .env.example                 ← Add REDIS_URL
  └── package.json                 ← Add redis@5.0.0+ dependency
```

---

## 7. Success Criteria (Ship Gate)

All must pass before merge to `feature/planning-engine`:

- ✅ Redis queue tests: 100% pass
- ✅ Graceful shutdown tests: 100% pass
- ✅ Integration tests: 100% pass
- ✅ Bootloader starts without errors
- ✅ All artifacts dropped into castironforge/ ready
- ✅ No task loss under restart cycle
- ✅ Metrics export verified
- ✅ Code review approved

---

## 8. Timeline

| Phase | Start | End | Duration | Blocker |
|---|---|---|---|---|
| 6.A (Redis) | 2026-06-17 | 2026-06-19 | 2 days | ✅ YES |
| 6.B (Shutdown) | 2026-06-19 | 2026-06-20 | 1 day | ✅ YES |
| 6.C (Integration) | 2026-06-20 | 2026-06-21 | 1 day | ✅ YES |
| Merge gate | 2026-06-22 | 2026-06-22 | 1 day | - |
| Stability wait | 2026-06-22 | 2026-06-24 | 2 days | - |
| 6.D (Retry) | 2026-06-24 | 2026-06-27 | 3 days | ❌ NO |

**Target merge:** 2026-06-22  
**Target stable:** 2026-06-24  
**Retry engine live:** 2026-06-27

---

## 9. Rollback Plan

If Phase 6.A or 6.B fails:
1. Revert to in-memory queue
2. Keep scaffolding (non-breaking)
3. Retry in next iteration

If integration tests fail:
1. Debug failure mode
2. Fix + retest
3. No rollback needed (tests are validation layer)

---

## 10. Checklist (Hand-Off to Dev)

- [ ] Create `castironforge/runtime/queue.redis.js`
- [ ] Create `castironforge/runtime/gracefulShutdown.js`
- [ ] Create Redis tests
- [ ] Create integration tests
- [ ] Update `docker-compose.yml` with Redis service
- [ ] Update `.env.example` with REDIS_URL
- [ ] Update `package.json` with redis dependency
- [ ] Verify all tests pass
- [ ] Code review
- [ ] Merge to feature/planning-engine
- [ ] Wait 2 days for stability
- [ ] Start Phase 6.D (retry engine)

---

**Next:** Proceed with Phase 6.A (Redis queue implementation)?
