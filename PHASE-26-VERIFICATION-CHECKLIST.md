# PHASE-26 Verification Checklist

**Status:** Pre-deployment verification (BLOCKING)
**Priority:** CRITICAL
**Session:** 2026-07-05

---

## Immediate Verification (Before Next Window)

### [ ] Docker Image Confirmation
**Risk:** Image build may have failed silently despite polling exit 0
**Command:** 
```bash
docker inspect cic-phase-26:0.26.0
docker images | grep cic-phase-26
```
**Expected:** Image exists, 0.26.0 tag present
**Blocker:** If missing, cannot deploy

### [ ] Docker Runtime Test
**Risk:** Image exists but doesn't run (missing entrypoint, node version mismatch)
**Command:**
```bash
docker run --rm cic-phase-26:0.26.0 node --version
docker run --rm cic-phase-26:0.26.0 npm --version
```
**Expected:** Node 22.x, npm 10.x
**Blocker:** If fails, image is broken

### [ ] E2E Test Suite Execution
**Risk:** TS compilation passes but runtime logic broken (ProposalForDecision missing fields, null check fragility)
**Command:**
```bash
npm test -- src/autonomy/__tests__/e2e-test-harness.ts 2>&1 | tail -50
```
**Expected:** 8 test cases PASS (or at minimum, 0 hard crashes)
**Known issues:** May fail on:
- ProposalForDecision field completeness (decision_deadline added, but may need more)
- MemoryService/GovernanceService logic (stubs may not match actual implementation)
- Null checks in waitFor pattern (fragile temporal logic)

**Blocker:** Runtime crashes = deployment blocked

### [ ] Git Commit Verification
**Risk:** Cherry-pick or rebase lost commits
**Command:**
```bash
git log --oneline | head -10
git log --grep="PHASE-26" --oneline
```
**Expected commits:**
1. ad4bb24 — TS compilation 188→0
2. 8219838 — Config + scheduler
3. a988e92 — Wave executor ES modules
4. f09f4c7 — Node 22 LTS upgrade
5. 92f8008 — Dockerfile explicit COPY

---

## Docker Build Debugging (If Image Missing)

### [ ] Check rewrite-mcp node_modules
**Risk:** Subdir node_modules still has npm temp files
**Command:**
```bash
ls -la rewrite-mcp/projects/cic/ingestion/node_modules/.bin/ | grep "^\." | head
```
**Fix if found:**
```bash
cd rewrite-mcp/projects/cic/ingestion
npm ci --omit=dev
cd - # back to root
docker build --no-cache -t cic-phase-26:0.26.0 .
```

### [ ] Verify .dockerignore Format
**Risk:** CRLF line endings (Windows Git) break .dockerignore parsing
**Command:**
```bash
file .dockerignore
cat -A .dockerignore | head
```
**Expected:** UTF-8 with LF (not CRLF)
**Fix if needed:**
```bash
dos2unix .dockerignore
# or
sed -i 's/\r$//' .dockerignore
```

### [ ] Docker Build Detailed Log
**Risk:** Build failure happens in later stage, not context transfer
**Command:**
```bash
docker build --progress=plain -t cic-phase-26:0.26.0 . 2>&1 | tee docker-build-detailed.log
tail -100 docker-build-detailed.log | grep -E "error|Error|failed|FAIL"
```

---

## Test Failure Debugging (If E2E Suite Fails)

### [ ] ProposalForDecision Field Audit
**Risk:** Added decision_deadline but other required fields missing
**Command:**
```bash
grep -r "ProposalForDecision" src --include="*.ts" | grep -E "interface|type" | head -5
grep -r "submitProposal(" src --include="*.ts" -A 2 | head -30
```
**Expected:** All call sites have decision_deadline + all required fields
**Fix pattern:** Add field to test mock or expand interface

### [ ] MemoryService/GovernanceService Export Verification
**Risk:** Stubs created but actual implementations diverged
**Command:**
```bash
ls -la src/autonomy/services/*.ts
grep "export.*MemoryService\|export.*GovernanceService" src/autonomy/services/*.ts
```
**Expected:** Both services export correctly, TS stubs align with implementation

### [ ] Null Check Fragility Audit
**Risk:** waitFor pattern returns null sometimes, null check insufficient
**Command:**
```bash
grep -n "if (!resolved)" src/autonomy/__tests__/e2e-test-harness.ts
grep -n "waitFor" src/autonomy/__tests__/e2e-test-harness.ts -B 2 -A 5
```
**Check:** Every waitFor() must have null guard + descriptive error message

---

## Sign-Off Criteria

- [x] TS compilation: 0 errors (verified ad4bb24)
- [x] Wave executor: health checks pass (verified a988e92)
- [ ] Docker image: exists and runs (VERIFY IMMEDIATELY)
- [ ] E2E tests: pass or identified failures documented (VERIFY IMMEDIATELY)
- [ ] All commits: present in git log (VERIFY IMMEDIATELY)

---

## Next Window Tasks

1. **Start:** Run all immediate verification checks (30 min)
2. **Debug:** If Docker fails, execute docker build debugging sequence (30-60 min)
3. **Debug:** If tests fail, execute test failure debugging sequence (30-60 min)
4. **Confirm:** All sign-off criteria met before prod deploy
5. **Deploy:** Only after all checks pass

**Estimated:** 1-2 hours to full readiness (if no surprises)

---

**Owner:** Next session operator
**Created:** 2026-07-05 (end of PHASE-26 TS compilation window)
**Blocker Status:** DO NOT DEPLOY until this checklist passes
