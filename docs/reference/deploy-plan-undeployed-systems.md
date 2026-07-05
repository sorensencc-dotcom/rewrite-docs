---
title: "DEPLOY PLAN UNDEPLOYED SYSTEMS"
summary: "# Deploy Plan: 4 Production-Ready Systems (Undeployed)"
created: "2026-07-03T19:43:46.012Z"
updated: "2026-07-03T19:43:46.012Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Deploy Plan: 4 Production-Ready Systems (Undeployed)

**Date:** 2026-06-21  
**Status:** All systems have passing tests. Blockers identified. 4–5 day deployment window.

---

## EXECUTIVE SUMMARY

| System | Tests | Status | Blocker | Deploy Priority |
|--------|-------|--------|---------|-----------------|
| **Phase 27.3: Registry + Policy Engine** | 760/786 (96%) | Code ready | No Dockerfile, sandbox TODOs (6) | 🔴 **CRITICAL** |
| **CIC Runtime v0.2: Agent Execution** | Integration ready | Code ready | No Dockerfile, no compose entry | 🔴 **CRITICAL** |
| **Phase 24: Governance Council** | 13/13 ✓ | Running (3113) | Client integration unclear | 🟡 **HIGH** |
| **Bootstrap Orchestrator** | N/A (script) | Ready | No automation trigger | 🟡 **MEDIUM** |

---

## SYSTEM 1: PHASE 27.3 REGISTRY + POLICY ENGINE

### Current State
- **Code Path:** `cic-ingestion/src/aperture/`
- **Tests:** 760/786 passing (96%)
- **Adapters:** BaseAdapter + 5 concrete adapters (Browser, Screenshot, Model, Anthropic, Puppeteer)
- **Sandbox:** SandboxRuntime (TypeScript, starts/stops processes)

### Blockers

**BLOCKER A: Sandbox Resource Isolation (6 TODOs)**
```
File: cic-ingestion/src/aperture/sandbox/SandboxRuntime.ts:38-40, 97-99
- TODO: Set resource limits (memory, CPU, FDs)
- TODO: Scope environment variables
- TODO: Inject scoped credentials
- TODO: Revoke scoped credentials
- TODO: Close open file descriptors
- TODO: Kill remaining processes
```
**Impact:** Sandbox doesn't isolate resources → agents can access host resources → security risk
**Fix:** Implement resource limits using child_process options + cgroup inspection
**Effort:** 2–3 hours

**BLOCKER B: JSON Schema Validation (2 TODOs)**
```
File: cic-ingestion/src/aperture/adapters/BaseAdapter.ts:45, 73
- validate() returns hardcoded true
- validateOutput() returns hardcoded true
```
**Impact:** Adapters don't validate I/O against schema → invalid data passes through
**Fix:** Use `jsonschema` npm package, implement validate() + validateOutput()
**Effort:** 1–2 hours

**BLOCKER C: No Dockerfile**
**Impact:** Can't containerize aperture service
**Fix:** Create `cic-ingestion/Dockerfile.aperture` (multi-stage, based on current pattern)
**Effort:** 1 hour

**BLOCKER D: Not in docker-compose**
**Impact:** Service not orchestrated with other services
**Fix:** Add aperture service entry to docker-compose.yml (port 3117)
**Effort:** 30 minutes

### Deployment Sequence

```
D-4: Fix sandbox isolation (3h)
  ✓ Implement resource limits (ulimit, cgroup)
  ✓ Scope env vars (whitelist only needed vars)
  ✓ Implement credential cleanup on exit
  
D-3: Fix schema validation (2h)
  ✓ Implement BaseAdapter.validate()
  ✓ Implement BaseAdapter.validateOutput()
  ✓ Add schema validation tests
  
D-2: Create Dockerfile.aperture + docker-compose entry (1.5h)
  ✓ Multi-stage build (builder → runtime)
  ✓ Expose port 3117
  ✓ Add health check
  ✓ Add environment vars (VAULT_URL, POLICY_REGISTRY_URL)
  
D-1: Integration testing (2h)
  ✓ Run docker-compose up
  ✓ Health checks pass
  ✓ Policy engine responds to /health
  ✓ Manual e2e: Submit policy → validate → execute
  
D: Ship & monitor
  ✓ Merge PR (Phase 27.3 + Aperture Service)
  ✓ Watch logs for first 30 min
```

### Success Criteria
- [ ] docker-compose up brings up aperture:3117
- [ ] Sandbox isolates adapter processes (verified via ps/cgroup inspection)
- [ ] Schema validation rejects invalid input
- [ ] All integration tests pass
- [ ] Policy Engine responds correctly to policy submission

---

## SYSTEM 2: CIC RUNTIME v0.2 AGENT EXECUTION

### Current State
- **Code Path:** `cic-runtime/` (root package)
- **Version:** v0.2.0 in package.json
- **Entry:** `cic-runtime/defineAgent.ts`
- **Tests:** integration.test.ts (60+ lines, tests manifest → DB → session flow)
- **Example Agent:** `cic-agent/pr-reviewer/` (has tools, channels, schedules)

### Blockers

**BLOCKER A: No Dockerfile**
**Impact:** Can't containerize runtime
**Fix:** Create `cic-runtime/Dockerfile` (multi-stage, Node 20-alpine)
**Effort:** 1 hour
```dockerfile
# Build stage: TypeScript → JavaScript
# Runtime stage: run defineAgent() + Express server
# Health check: GET /health
# Expose: 3118 (default, configurable)
```

**BLOCKER B: Not in docker-compose**
**Impact:** Runtime not orchestrated
**Fix:** Add cic-runtime service entry (port 3118, depends on: vault, torquequery, postgres)
**Effort:** 30 minutes
```yaml
cic-runtime:
  build: cic-runtime/Dockerfile
  container_name: cic-runtime
  environment:
    - PORT=3118
    - VAULT_URL=http://vault:3111
    - TORQUEQUERY_URL=http://torquequery:3110
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_NAME=cic_agents
    - DB_USER=postgres
    - DB_PASSWORD=postgres
  depends_on:
    - vault
    - torquequery
    - postgres
  ports: ["3118:3118"]
  networks: [cic-network]
```

**BLOCKER C: Integration tests need postgres:5434**
**Impact:** Tests can't run in CI
**Fix:** Update docker-compose to expose postgres on :5433 + :5434 (for runtime tests)
**Effort:** 30 minutes

**BLOCKER D: Missing Agent Manifest Loader**
**Impact:** defineAgent() can't find agent definitions
**Fix:** Verify `cic-runtime/defineAgent.ts` resolves relative paths correctly
**Effort:** 30 minutes (might just need path.resolve() fix)

### Deployment Sequence

```
D-4: Create Dockerfile.cic-runtime (1h)
  ✓ Multi-stage (tsc compile)
  ✓ Health check: /health
  ✓ Entry: npm start
  
D-3: Update docker-compose (1h)
  ✓ Add cic-runtime:3118 service
  ✓ Wire vault + torquequery + postgres
  ✓ Add postgres:5434 for tests
  
D-2: Fix integration tests (1h)
  ✓ Update postgres connection strings
  ✓ Verify manifest resolution
  ✓ Add docker-compose test setup
  
D-1: Full stack test (2h)
  ✓ docker-compose up (all 13+ services)
  ✓ Wait for health checks
  ✓ POST /api/agents/deploy {agent: pr-reviewer}
  ✓ Verify session created in postgres
  ✓ Verify metrics exported
  
D: Ship
  ✓ Merge PR (CIC Runtime Service)
  ✓ Verify in staging k8s
```

### Success Criteria
- [ ] docker-compose up brings up cic-runtime:3118
- [ ] Runtime loads pr-reviewer agent from `cic-agent/`
- [ ] Integration tests pass (manifest → DB → sessions)
- [ ] Health check responds 200
- [ ] Webhook events create sessions in postgres

---

## SYSTEM 3: PHASE 24 GOVERNANCE COUNCIL

### Current State
- **Code Path:** `services/cic-governance/`
- **Service:** Running in docker-compose:3113
- **Tests:** 13/13 passing ✓
- **Features:** Council voting, proposal submission, context retrieval

### Blockers

**BLOCKER A: Client Integration Unclear**
**Impact:** VaultClient + MemoryQueryClient might not exist or might not work correctly
**Fix:** Verify these files exist and implement missing stubs
```bash
# Check if files exist
ls -la services/cic-governance/src/clients/
# Expected: VaultClient.ts, MemoryQueryClient.ts
```
**Effort:** 1–2 hours (might be quick fixes to client constructors)

**BLOCKER B: No Test Coverage for Voting Loop**
**Impact:** Can't verify governance council actually makes decisions
**Fix:** Add integration test: proposal → vote → decision → vault write
**Effort:** 2 hours

**BLOCKER C: Vault Integration Not Verified**
**Impact:** Governance decisions might not persist
**Fix:** Add test that calls `/api/governance/vote` → checks vault for record
**Effort:** 1–2 hours

### Deployment Sequence

```
D-2: Verify clients exist + work (2h)
  ✓ Read VaultClient.ts implementation
  ✓ Read MemoryQueryClient.ts implementation
  ✓ Fix constructor issues (if any)
  ✓ Test client connectivity to vault + torquequery
  
D-1: Add voting loop test (2h)
  ✓ Test: POST /api/governance/proposal
  ✓ Test: POST /api/governance/vote
  ✓ Verify: Record written to vault
  ✓ Verify: Metrics exported
  
D: Verification (1h)
  ✓ docker-compose up
  ✓ Manual governance flow: propose → vote → check vault
  ✓ Curl to verify endpoints
```

### Success Criteria
- [ ] Clients (VaultClient, MemoryQueryClient) exist + initialize without errors
- [ ] Council.submitProposal() returns proposal with ID
- [ ] Council.voteOnProposal() records vote in vault
- [ ] All integration tests pass
- [ ] docker-compose logs show governance decisions being logged

---

## SYSTEM 4: BOOTSTRAP ORCHESTRATOR

### Current State
- **Script:** `bootstrap-all.sh` (11.7 KB, 300+ lines)
- **Purpose:** Multi-repo GitHub automation (clone, configure, test, rollback)
- **Features:** --dry-run, --group filtering, snapshot-based rollback
- **Status:** Production-ready

### Blockers

**BLOCKER A: No Automation Trigger**
**Impact:** Script runs manually only
**Fix:** Wire GitHub Actions workflow to call bootstrap-all.sh on repository setup event
**Effort:** 1–2 hours

**BLOCKER B: No Deployment Integration**
**Impact:** Orchestrator not visible in CIC dashboard
**Fix:** Add POST endpoint to cic-ingestion that wraps bootstrap-all.sh
**Effort:** 1 hour

**BLOCKER C: No Status Dashboard**
**Impact:** Can't monitor bootstrap runs
**Fix:** Add `/api/bootstrap/status` endpoint that reads bootstrap logs
**Effort:** 1–2 hours

### Deployment Sequence

```
D-1: Create GitHub Actions workflow (1h)
  ✓ Trigger: repository.created event
  ✓ Run: bootstrap-all.sh --group <inferred>
  ✓ Report: status comment on repo
  
D: Add API endpoint (1h)
  ✓ POST /api/orchestrator/bootstrap
  ✓ Params: {owner, repos, dryRun}
  ✓ Returns: {jobId, status, logUrl}
  
D+1: Add dashboard (1–2h)
  ✓ Console v3: "Orchestrator" panel
  ✓ Show recent bootstrap runs
  ✓ Show status + logs
```

### Success Criteria
- [ ] bootstrap-all.sh runs on GitHub repo creation
- [ ] POST /api/orchestrator/bootstrap triggers script
- [ ] Dashboard shows bootstrap history + status

---

## DEPLOYMENT TIMELINE

### CRITICAL PATH (Phases 27.3 + v0.2 Runtime)

```
Monday 2026-06-23
  D-4: Start Aperture fixes (sandbox isolation + schema validation)
       Start Runtime Dockerfile
  
Tuesday 2026-06-24
  D-3: Finish Aperture fixes
       Docker-compose entries
       
Wednesday 2026-06-25
  D-2: Governance verification
       Runtime integration tests
       
Thursday 2026-06-26
  D-1: Full-stack testing
       (all 13+ services up)
       Manual e2e flows
       
Friday 2026-06-27
  D: Merge + deploy to staging
     Watch logs for 30 min
     Enable governance council voting
```

### HIGH PATH (Phase 24 Governance Verification)
- Parallel to Critical Path
- Completes by D-1
- No blockers for shipping (already running)

### MEDIUM PATH (Bootstrap Orchestrator)
- Can start D-1
- Low risk (script-only)
- Completes by D+1

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Sandbox isolation complexity | HIGH | MEDIUM | Test on Linux first, use existing cgroup libs |
| Schema validation perf cost | MEDIUM | LOW | Profile after implementation |
| Postgres connection string mismatch | MEDIUM | MEDIUM | Test docker-compose locally first |
| Vault client initialization | MEDIUM | HIGH | Verify client files exist before D-2 |
| Resource exhaustion (docker-compose 13 services) | LOW | HIGH | Monitor docker ps + docker stats during D-1 |

---

## SUCCESS CRITERIA (ALL SYSTEMS)

By end of D (2026-06-27):

- [ ] **Phase 27.3:** docker-compose up → aperture:3117 healthy + policy engine responding
- [ ] **CIC Runtime:** docker-compose up → runtime:3118 healthy + agents deployable
- [ ] **Phase 24:** Governance council voting → vault records → metrics exported
- [ ] **Orchestrator:** bootstrap-all.sh working + API endpoint wired
- [ ] **Integration:** All 4 systems talking to vault, torquequery, postgres
- [ ] **Testing:** Full e2e flow: policy submission → agent execution → decision recorded
- [ ] **Monitoring:** Prometheus metrics for all 4 systems
- [ ] **Docs:** Deployment guide + troubleshooting

---

## ROLLBACK PLAN

If deployment fails:

1. **Aperture:** Revert commit, keep cic-ingestion base image
2. **Runtime:** Revert commit, keep postgres
3. **Governance:** No rollback needed (already running, just verify)
4. **Orchestrator:** Revert workflow, script still available locally

File issues for each failed component, retry in next cycle (2026-06-30).

---

## ACTION ITEMS (START NOW)

- [ ] Assign: Aperture fixes (sandbox + schema) — **2 days**
- [ ] Assign: Runtime Dockerfile + docker-compose — **1.5 days**
- [ ] Assign: Governance verification (clients + tests) — **2 days parallel**
- [ ] Assign: Orchestrator GitHub Actions — **1 day D-1**
- [ ] Create staging K8s namespace for Phase 27 deployments
- [ ] Prep docker-compose test environment (pull latest images)
- [ ] Brief team on deployment window (2026-06-23 to 2026-06-27)
