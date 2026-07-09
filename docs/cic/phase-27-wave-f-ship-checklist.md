---
title: "Phase 27 Wave F: Ship-Readiness Checklist"
summary: "**Target Ship Date:** 2026-07-10"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 27 Wave F: Ship-Readiness Checklist

**Target Ship Date:** 2026-07-10  
**Effort Completed:** Waves A–E (4 waves + master gate + 4 docs + golden fixtures)  
**Status:** Final validation before deployment  

## Pre-Ship Gates

### ✅ Code Quality

- [ ] Master gate (Wave F) tests pass (22/22 assertions)
- [ ] All Wave A–E tests still passing
  - Wave A: 45/45 types + profiles
  - Wave B: 45/45 router + manifest
  - Wave C: daemon-routing integration
  - Wave D: 9/9 quarantine tests
  - Wave E: 40/40 repair + prune tests
- [ ] No TypeScript compilation errors in cic-ingestion/
- [ ] No linting errors (`npm run lint`)
- [ ] Code review pass (1+ LGTM from platform team)

### ✅ Test Coverage

- [ ] Master gate covers all 5 waves
  - Wave A: Type system validation
  - Wave B: Routing + manifest recording
  - Wave C: Daemon integration
  - Wave D: Quarantine workflow
  - Wave E: Repair + prune durability
- [ ] E2E scenarios (golden fixtures)
  - Normal ingestion (10 diverse API records)
  - Quarantine queue (3 problem entries)
  - Archival (4 old records > 90d)
  - Corruption recovery (8 mixed valid + corrupted)
- [ ] Recovery scenarios
  - Partial corruption recovery
  - Retention boundary edge cases
- [ ] Lock contention handled (--maxWorkers=1 proven safe)

### ✅ Documentation

- [ ] Architecture doc ([phase-27-wave-f-architecture.md](./phase-27-wave-f-architecture.md))
  - 5-layer pipeline design
  - Type system detailed
  - Routing logic explained
  - Manifest format documented
  - Durability strategy detailed
- [ ] Operational runbook ([phase-27-wave-f-runbook.md](./phase-27-wave-f-runbook.md))
  - Daily checklist (morning + evening)
  - Alerting thresholds
  - Common operations (6 scenarios)
  - Escalation path
  - Maintenance windows
- [ ] Troubleshooting guide ([phase-27-wave-f-troubleshooting.md](./phase-27-wave-f-troubleshooting.md))
  - 6 major issues with root causes
  - Diagnostic commands
  - Fixes provided
  - Quick-fix checklist
- [ ] Golden fixtures ([phase-27-wave-f-fixtures.md](./phase-27-wave-f-fixtures.md))
  - 4 fixture files created
  - Use cases documented
  - Templates provided
  - E2E testing examples
- [ ] Rollback procedures ([phase-27-wave-f-rollback.md](./phase-27-wave-f-rollback.md))
  - 4 rollback scenarios
  - Decision trees
  - Step-by-step procedures
  - Post-rollback checklist

### ✅ Integration

- [ ] All Wave A–E files in place
  ```
  ✅ types.ts (Wave A)
  ✅ ingestionProfiles.ts (Wave A)
  ✅ ingestionRouter.ts (Wave B)
  ✅ ingestionManifest.ts (Wave B)
  ✅ daemon-routing.ts (Wave C)
  ✅ operatorOverrides.ts (Wave C)
  ✅ quarantineReview.ts (Wave D)
  ✅ repairManifest.ts (Wave E)
  ✅ pruneManifest.ts (Wave E)
  ✅ ingestion-wave-f-master-gate.ts (Wave F)
  ```
- [ ] No breaking changes to existing APIs
  - ManifestRecord interface stable
  - recordIngestion signature unchanged
  - quarantine list/approve/reject stable
- [ ] Governance integration verified
  - Stats endpoint updated
  - Incident reporting wired
  - Nightly cron jobs configured

### ✅ Performance

- [ ] Repair completes in < 5 min for 1M record manifest
- [ ] Prune completes in < 5 min for 1M record manifest
- [ ] Lock acquisition succeeds within 5s
- [ ] Concurrent writes safe (tested with --maxWorkers=1)
- [ ] Memory usage < 500MB for 1M record manifest

### ✅ Security

- [ ] Lock file permissions secure (0600)
- [ ] Manifest file permissions secure (0644)
- [ ] Backup file permissions secure (0600)
- [ ] Archive directory permissions secure (0755)
- [ ] No plaintext secrets in logs
- [ ] No SQL injection vectors (not applicable, file-based)
- [ ] No path traversal in archive naming

### ✅ Monitoring

- [ ] Alerting rules configured
  ```
  - corruption_rate > 0.1% → CRITICAL (page)
  - lock_age_minutes > 5 → CRITICAL (page)
  - prune_failures > 0 → CRITICAL (page)
  - quarantine_queue > 1000 → WARNING (log)
  - manifest_size_gb > 20 → WARNING (log)
  ```
- [ ] Dashboard panels added
  - Repair stats (daily)
  - Prune stats (daily)
  - Manifest health (realtime)
  - Quarantine queue (realtime)
  - Archive growth (weekly)
- [ ] Logging captures key events
  - Repair start/end + counts
  - Prune start/end + counts
  - Lock acquisitions (debug level)
  - Errors + backtraces

### ✅ Deployment

- [ ] Docker image builds successfully
  ```bash
  docker build -f Dockerfile -t cic-ingestion:wave-f .
  # Expected: successful build, ~500MB image
  ```
- [ ] Kubernetes manifests updated (if applicable)
- [ ] Canary deployment config prepared (1%, 10%, 100%)
- [ ] Rollback plan reviewed (phase-27-wave-f-rollback.md)
- [ ] Backup strategy verified
  - Daily manifest backup to local disk
  - Weekly backup to S3 (off-site)
  - 30-day retention

### ✅ Communication

- [ ] Release notes written (summarize Phase 27)
  - What changed (log polling → event-driven routing)
  - Why (better reliability, lower latency)
  - What's new (repair, prune, quarantine CLI)
  - How to operate (link to runbook)
  - Rollback plan (link to procedures)
- [ ] Stakeholder briefing scheduled
  - Ops/SRE team (runbook walkthrough)
  - Engineering (architecture overview)
  - Product (feature announcement)
- [ ] On-call handoff completed
  - Current on-call trained on Phase 27
  - Escalation contacts identified
  - Incident response plan reviewed

## Post-Ship Verification

**Day 0 (Deployment Day)**

- [ ] Canary deployed (1% traffic)
  - Monitor for 30 minutes
  - Check: corruption_rate, availability, lock contention
  - If all green, proceed to 10%

- [ ] Shadow deployed (10% traffic)
  - Monitor for 1 hour
  - Perform manual testing:
    ```bash
    npm run cic-ingestion -- quarantine list
    npm run cic-ingestion -- repair --dry-run
    npm run cic-ingestion -- prune --dry-run
    ```
  - If all green, proceed to 100%

- [ ] Full deployment (100% traffic)
  - Monitor for 4 hours
  - Check dashboard every 30 min
  - Have rollback team on standby

**Day 1 (First Full Day)**

- [ ] Daily standup: review overnight ops
  - Repair stats: corruption_rate, lines processed
  - Prune stats: records archived, archive size
  - Quarantine: queue size, approval rate
  - Incidents: any page-worthy events?

- [ ] Spot check:
  ```bash
  # Verify manifest integrity
  npm run cic-ingestion -- repair --dry-run
  # Expected: corruptedLines = 0 or < 10 (low corruption)

  # Verify archival working
  ls -lah cic-ingestion/manifests-archived/
  # Expected: archive file(s) present, growing

  # Verify quarantine queue
  npm run cic-ingestion -- quarantine list --count
  # Expected: < 100 items (operators keeping up)
  ```

**Week 1 (Post-Deployment)**

- [ ] Weekly ops review
  - Summarize repair/prune/quarantine stats
  - Any incidents or alerts triggered?
  - Operator feedback: what's working, what's hard?
  - Adjust thresholds if too many false positives

- [ ] Operator training update
  - Any new troubleshooting scenarios discovered?
  - Update runbook if necessary
  - Schedule follow-up training if needed

**Month 1 (Stability)**

- [ ] Monthly retrospective
  - How is Phase 27 performing?
  - What operational issues have we hit?
  - Capacity planning: is 90-day retention sustainable?
  - Security: any incidents or vulnerabilities?

## Sign-Off

| Role | Name | Date | Status |
|---|---|---|---|
| **Engineer** | ___ | ___ | ⬜ Pending |
| **Code Reviewer** | ___ | ___ | ⬜ Pending |
| **QA Lead** | ___ | ___ | ⬜ Pending |
| **Platform Lead** | ___ | ___ | ⬜ Pending |
| **On-Call Manager** | ___ | ___ | ⬜ Pending |

**Ship Decision:** ⬜ READY TO SHIP once all sign-offs obtained

---

## Final Verification Command

```bash
# Run full Phase 27 test suite (all waves)
npm test -- \
  --testPathPattern="ingestion-" \
  --maxWorkers=1 \
  --testTimeout=10000

# Expected output:
# PASS: repairManifest.test.ts (8 tests)
# PASS: pruneManifest.test.ts (10 tests)
# PASS: ingestion-durability-gate.test.ts (22 assertions)
# PASS: ingestion-wave-f-master-gate.test.ts (TBD assertions)
# ... all Wave A-D tests passing
# Total: 136+ tests PASS, 0 FAIL
```

Once this passes → **READY FOR SHIP-GATE**

---

See also: [phase-27-ingestion-autonomy-locked.md](./phase-27-ingestion-autonomy-locked.md)
