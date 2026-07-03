# TIER 2 AGENTS PANEL — CONFLICT AVOIDANCE MAP
**Date:** 2026-06-20  
**Purpose:** Parallel execution without merge hell  
**Scope:** UI track (10 components + 2 hooks) + Backend track (WS server)  
**Status:** Locked — teams execute within these boundaries

---

# FILE OWNERSHIP MATRIX

| File | Owner | Type | Read-Only Cross-Team? | Notes |
|------|-------|------|----------------------|-------|
| `src/agents/types.ts` | UI | Shared Types | **YES** | Backend reads only. UI writes as needed. Lock at end of UI feature branch. |
| `src/agents/hooks.ts` | UI | Shared Hooks | **YES** | Backend reads only. No WS imports in hooks until WS exists. |
| `src/agents/components/AgentsPanel.tsx` | UI | Component | NO | UI only. Backend never touches. |
| `src/agents/components/AgentList.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentRow.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentStatusBadge.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentDetailPanel.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentConfigForm.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentMetricsPanel.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentLogsPanel.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentFilters.tsx` | UI | Component | NO | UI only. |
| `src/agents/components/AgentToolbar.tsx` | UI | Component | NO | UI only. |
| `src/hooks/useAgentList.ts` | UI | Hook | **YES** | Backend reads only. Calls REST `/api/agents` + WS `/ws/agents`. |
| `src/hooks/useAgent.ts` | UI | Hook | **YES** | Backend reads only. Calls REST `/api/agents/:id` + WS `/ws/agents/:id`. |
| `server/api/agents/getAgents.ts` | Backend | Endpoint | **YES** | UI reads response only. Backend owns implementation. |
| `server/api/agents/getAgentById.ts` | Backend | Endpoint | **YES** | UI reads response only. |
| `server/api/agents/updateAgentConfig.ts` | Backend | Endpoint | **YES** | UI reads response only. |
| `server/ws/index.ts` | Backend | WS Registry | NO | Backend only. Manages connection registry + broadcast. UI never imports. |
| `server/ws/agents.ts` | Backend | WS Endpoint | NO | Backend only. Global `/ws/agents` connection handler. |
| `server/ws/agentById.ts` | Backend | WS Endpoint | NO | Backend only. Per-agent `/ws/agents/:id` handler. |
| `server/runtime/agentEvents.ts` | Backend | Event Emitter | NO | Backend only. Hooks into agent runtime, emits to WS broadcast. |
| `WIRING.md` | UI | Spec Doc | **YES** | Read-only reference. Do not edit during execution. |
| `WEBSOCKET_WIRING.md` | Backend | Spec Doc | **YES** | Read-only reference. Do not edit during execution. |
| `BUILD_PLAN.md` | Both | Spec Doc | **YES** | Read-only reference. Do not edit during execution. |

---

# SHARED FILE COLLISION AVOIDANCE

## **File: `src/agents/types.ts`**
- **Owner:** UI track
- **Writes:** UI adds/updates types as components are built
- **Backend access:** Read-only import for return types, validation
- **Conflict risk:** MEDIUM (both teams need current state)
- **Rule:** UI merges first. Backend rebases `feature/agents-backend` → `main` after UI merges.

## **File: `src/agents/hooks.ts`**
- **Owner:** UI track
- **Writes:** UI implements `useAgentList`, `useAgent`
- **Backend access:** Read-only import (to understand hook contract)
- **Conflict risk:** MEDIUM (backend needs to know hook signatures to design WS events)
- **Rule:** Backend reads from UI branch, does NOT import until UI branch published.

## **File: `server/api/agents/` (all 3 endpoints)**
- **Owner:** Backend track
- **Writes:** Backend implements REST endpoints
- **UI access:** Read-only (fetch response types)
- **Conflict risk:** LOW (UI never edits)
- **Rule:** No collision possible.

## **File: `server/ws/` (all 3 files)**
- **Owner:** Backend track
- **Writes:** Backend implements WS server
- **UI access:** NONE (WS is backend-only)
- **Conflict risk:** NONE
- **Rule:** UI never touches. Clean separation.

---

# BRANCH STRATEGY

## **UI Track: `feature/agents-ui`**
```bash
git checkout -b feature/agents-ui origin/master
# Edit:
#   src/agents/types.ts (write)
#   src/agents/hooks.ts (write)
#   src/agents/components/* (write)
# Test locally, push when ready
git push -u origin feature/agents-ui
```

## **Backend Track: `feature/agents-backend`**
```bash
git checkout -b feature/agents-backend origin/master
# Edit:
#   server/api/agents/* (write)
#   server/ws/* (write)
#   server/runtime/agentEvents.ts (write)
# Test locally, push when ready
git push -u origin feature/agents-backend
```

## **Shared Type Import Strategy (No Collision)**
Backend imports types from UI's branch BEFORE merging:

```ts
// server/api/agents/getAgents.ts
// BEFORE UI merge: import from develop or UI branch
// import { AgentSummary } from '../../../src/agents/types'; // ❌ Don't do this yet

// AFTER UI merge: safe to import from main
import { AgentSummary } from '../../../src/agents/types'; // ✅ Now safe
```

**During parallel execution:**
- Backend does NOT import from `src/agents/types.ts` yet
- Instead, backend defines its own response types in `server/types/agent-responses.ts`
- After UI merges, backend rebases and imports from canonical `src/agents/types.ts`

---

# MERGE SEQUENCE (NO PARALLEL MERGES)

### **Step 1: UI Track Merges First**
```bash
# UI team: create PR feature/agents-ui → master
# PR must pass:
#   - All 10 components compile
#   - Hooks integrate without errors
#   - Polling works end-to-end
#   - No WS errors in browser console
# Review + merge to master
git merge feature/agents-ui --ff-only
```

**Commit message:**
```
feat(ui): agents panel — 10 components + hooks (polling-first)

- AgentsPanel, AgentList, AgentRow, AgentStatusBadge
- AgentDetailPanel, AgentConfigForm, AgentMetricsPanel
- AgentLogsPanel, AgentFilters, AgentToolbar
- useAgentList, useAgent (polling + streaming-ready)

Tests: all components render, hooks call API, no console errors
```

### **Step 2: Backend Track Rebases & Merges Second**
```bash
# Backend team: wait for UI PR merged
# Once UI on master, rebase your feature branch
git fetch origin
git rebase origin/master feature/agents-backend

# Now import from canonical src/agents/types.ts
# Update server/api/agents/* to use correct types
# Update server/ws/* to emit correct event types

# Create PR feature/agents-backend → master
# PR must pass:
#   - WS endpoints live + accept connections
#   - Broadcast helpers functional
#   - Runtime emits events correctly
#   - UI receives WS events without errors
#   - Polling fallback still works

# Review + merge to master
git merge feature/agents-backend --ff-only
```

**Commit message:**
```
feat(backend): agents panel — WS server + REST endpoints

- GET /api/agents (list agents)
- GET /api/agents/:id (agent detail)
- PATCH /api/agents/:id/config (update config)
- WS /ws/agents (global stream)
- WS /ws/agents/:id (per-agent stream)
- agentEvents emitter (runtime→WS bridge)

Tests: WS connections work, broadcasts fire, polling fallback OK
```

---

# SHARED FILE WRITE RULES (DURING PARALLEL EXECUTION)

| File | UI Can Edit? | Backend Can Edit? | Sync Rule |
|------|--------------|------------------|-----------|
| `src/agents/types.ts` | ✅ YES | ❌ NO | UI writes types. Backend reads read-only. |
| `src/agents/hooks.ts` | ✅ YES | ❌ NO | UI writes hooks. Backend reads read-only. |
| `server/api/agents/*` | ❌ NO | ✅ YES | Backend writes. UI never touches. |
| `server/ws/*` | ❌ NO | ✅ YES | Backend writes. UI never touches. |

**Non-negotiable:** If either team violates this, merge will require manual conflict resolution. Avoid.

---

# SYNC CHECKPOINTS (REAL-TIME COORDINATION)

### **Hour 0 — Both teams start**
- UI: Create 10 component stubs + hooks stub
- Backend: Create 3 WS endpoints + 3 REST endpoints
- **Check-in:** Slack or call — confirm both compiling locally

### **Hour 1.5 — UI reaches polling point**
- UI: Hooks calling REST endpoints, polling works
- Backend: REST endpoints returning mock data
- **Check-in:** UI can see list + detail via polling

### **Hour 2.5 — Backend WS server live**
- Backend: WS endpoints accept connections, emit test events
- **Check-in:** Browser DevTools shows WS connection established

### **Hour 3 — Integration point**
- UI: Flip `streaming: enabled` in hooks
- Backend: Broadcast real events from runtime
- **Check-in:** UI updates from WS, not just polling

### **Hour 4 — Merge prep**
- UI: Final PR review, all components polished
- Backend: Final PR review, all error handling locked
- **Check-in:** Both PRs ready for sequential merge

---

# CONFLICT RESOLUTION PLAYBOOK

If merge conflict occurs:

### **Scenario 1: Merge conflict in `src/agents/types.ts`**
- **Cause:** UI edited types while Backend tried to import
- **Fix:** UI owns resolution. Backend rebases after UI merges.
- **Action:** Backend runs `git rebase origin/master feature/agents-backend`, resolves conflicts keeping UI version.

### **Scenario 2: Merge conflict in `server/api/agents/*`**
- **Cause:** Should NOT happen (UI never edits backend files)
- **If it does:** Operator error. Check for wrong branch/file edit.
- **Action:** Revert, verify branch ownership, re-merge.

### **Scenario 3: Merge conflict in `src/agents/hooks.ts`**
- **Cause:** UI edited hooks while Backend tried to import
- **Fix:** Same as Scenario 1. Backend rebases after UI merges.

### **Scenario 4: Indirect conflict (type mismatch after merge)**
- **Cause:** UI types changed, backend response doesn't match
- **Fix:** Automated via TypeScript. Backend rebases, TS compiler reports mismatches, backend fixes.
- **Action:** Quick rebase-fix, re-test, re-merge.

---

# COMMIT TIMELINE (PARALLEL EXECUTION)

| Time | UI Track | Backend Track | Sync Point |
|------|----------|---------------|-----------|
| **T+0h** | Start; create 10 stubs | Start; create 3 WS + 3 REST stubs | Both branches exist |
| **T+1h** | Hooks call REST endpoints; polling works | REST endpoints return mock data | Check-in: polling works |
| **T+2h** | Components polish + type refinement | WS endpoints live; test events emit | Check-in: WS connections work |
| **T+3h** | Final polish; ready for PR | WS integrated into agent runtime | Integration point: UI flips streaming=true |
| **T+3.5h** | PR review + merge to master | Wait for UI merge (blocking) | **UI merged first** |
| **T+4h** | ✅ UI on master | Rebase feature/agents-backend onto master | Backend can now import real types |
| **T+4.5h** | ✅ UI PR closed | Backend PR review starts | Type imports validated by TS compiler |
| **T+5h** | ✅ Done | PR review + merge to master | **Backend merged second** |
| **T+5.5h** | — | ✅ Backend on master | **Both tracks complete** |

---

# FILE CHECKLIST (NO FILE LEFT BEHIND)

### **UI Track Deliverables**
- [ ] `src/agents/types.ts` — Locked
- [ ] `src/agents/hooks.ts` — Locked
- [ ] `src/agents/components/AgentsPanel.tsx` — Locked
- [ ] `src/agents/components/AgentList.tsx` — Locked
- [ ] `src/agents/components/AgentRow.tsx` — Locked
- [ ] `src/agents/components/AgentStatusBadge.tsx` — Locked
- [ ] `src/agents/components/AgentDetailPanel.tsx` — Locked
- [ ] `src/agents/components/AgentConfigForm.tsx` — Locked
- [ ] `src/agents/components/AgentMetricsPanel.tsx` — Locked
- [ ] `src/agents/components/AgentLogsPanel.tsx` — Locked
- [ ] `src/agents/components/AgentFilters.tsx` — Locked
- [ ] `src/agents/components/AgentToolbar.tsx` — Locked
- [ ] UI tests passing (jest)
- [ ] No console errors in browser
- [ ] Polling end-to-end works

### **Backend Track Deliverables**
- [ ] `server/api/agents/getAgents.ts` — Locked
- [ ] `server/api/agents/getAgentById.ts` — Locked
- [ ] `server/api/agents/updateAgentConfig.ts` — Locked
- [ ] `server/ws/index.ts` — Locked
- [ ] `server/ws/agents.ts` — Locked
- [ ] `server/ws/agentById.ts` — Locked
- [ ] `server/runtime/agentEvents.ts` — Locked
- [ ] Backend tests passing (jest)
- [ ] WS connections accept + broadcast works
- [ ] REST endpoints return correct types

---

# QUICK REFERENCE — DO's & DON'Ts

| Action | Status | Reason |
|--------|--------|--------|
| **UI edits `src/agents/types.ts`** | ✅ DO | Owner track. Backend reads after UI merges. |
| **Backend edits `src/agents/types.ts`** | ❌ DON'T | Causes merge conflict. Backend rebases after UI merges. |
| **UI edits `server/ws/*`** | ❌ DON'T | Backend-only files. UI never touches. |
| **Backend edits `src/agents/components/*`** | ❌ DON'T | UI-only files. Backend never touches. |
| **Both teams edit `src/agents/hooks.ts`** | ❌ DON'T | UI edits, backend reads only. |
| **Merge UI + Backend simultaneously** | ❌ DON'T | Causes type conflicts. UI first, backend rebases, backend second. |
| **Import `src/agents/types` before UI merges** | ❌ DON'T | Types not final yet. Backend uses own response types until merge. |
| **Keep branches long-lived** | ❌ DON'T | Merge after 4–5 hours. Stale branches increase conflict risk. |

---

# EXAMPLE: SHARED TYPE IMPORT (AFTER UI MERGE)

Once UI track merges to `master`, backend can safely import canonical types:

**Before UI merge (backend's temp response types):**
```ts
// server/types/agent-responses.ts
export interface AgentSummary {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error';
  uptimePercent: number;
}
```

**After UI merge (backend imports canonical):**
```ts
// server/api/agents/getAgents.ts
import { AgentSummary } from '../../../src/agents/types'; // ✅ Now canonical

export async function getAgents(req: Request, res: Response) {
  const agents: AgentSummary[] = await fetchAgents();
  res.json(agents);
}
```

**No type duplication. Single source of truth.**

---

# OPERATIONAL GATES

Both tracks must pass before moving to Alerts panel:

| Gate | Owner | Pass Criteria | Blocker If? |
|------|-------|---------------|------------|
| **UI compile** | UI | All 10 components + 2 hooks compile | Red squiggles in IDE |
| **UI tests** | UI | All tests passing (jest) | Any test failure |
| **UI E2E polling** | UI | List + detail load via REST polling | Blank list or 404 errors |
| **Backend compile** | Backend | All endpoints + WS + runtime compile | Red squiggles in IDE |
| **Backend tests** | Backend | All tests passing (jest) | Any test failure |
| **Backend WS handshake** | Backend | `/ws/agents` accepts connection, no auth errors | Connection refused or token validation fails |
| **Integration E2E** | Both | UI updates from WS events after merge | UI updates from polling only, WS events ignored |

**Merge to master blocked until all gates green.**

---

**This is the conflict map. Teams execute within these boundaries. No surprises.**

