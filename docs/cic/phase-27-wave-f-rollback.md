---
title: "Phase 27 Wave F: Rollback Procedures"
summary: "**Purpose:** Safe rollback strategies if Phase 27 deployment has issues"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 27 Wave F: Rollback Procedures

**Purpose:** Safe rollback strategies if Phase 27 deployment has issues

**Status:** Pre-deployment safeguards (use only if critical issues block operation)

## Deployment Safety Layers

```
Layer 1: Canary (1% traffic) → if OK, Layer 2
Layer 2: Shadow (10% traffic) → if OK, Layer 3
Layer 3: Full (100% traffic) → if critical issues, ROLLBACK

Rollback Trigger: corruption_rate > 1% OR availability < 95%
```

## Rollback Scenarios

### Scenario 1: High Corruption Rate (> 1%)

**Symptoms:**
- Repair reports `corruptedLines > 10000` (assuming 1M record manifest)
- Corruption not caused by known extractor bug
- Backup shows pre-deployment manifest was clean

**Decision Tree:**

```
Is corruption in recent records (< 24 hours old)?
├─ YES: Suggests bug in Wave F repair/prune
│  └─ ROLLBACK to Wave E (reverse Wave F deployment)
│
└─ NO: Corruption older than deployment
   └─ Investigate root cause (hardware, extractor, etc)
      └─ If root cause found: fix + continue (no rollback)
      └─ If root cause unknown: ROLLBACK to Wave E
```

**Rollback Steps:**

```bash
# 1. Stop ingestion daemon
systemctl stop cic-ingestion-daemon
sleep 5

# 2. Restore manifest from pre-deployment backup
# (assumes daily backup exists)
cp /backups/ingestionManifest-2026-07-06.jsonl \
   cic-ingestion/ingestionManifest.jsonl

# 3. Remove archive directory (Wave F-specific)
rm -rf cic-ingestion/manifests-archived/

# 4. Revert codebase to Wave E
git checkout <wave-e-commit-hash>
# Example: git checkout 79d62a2

# 5. Rebuild and restart
npm install
npm run build
systemctl start cic-ingestion-daemon

# 6. Verify
npm run cic-ingestion -- stats
# Should show pre-deployment record count

# 7. Incident review (file ticket)
# - What caused corruption?
# - How to prevent in future?
# - Need additional testing before re-deployment?
```

### Scenario 2: Prune Broke Manifest Integrity

**Symptoms:**
- Prune ran, but manifest size doesn't match expected
- Archive files don't exist when they should
- Records missing from manifest + not in archive

**Decision Tree:**

```
Can records be recovered from backup?
├─ YES (backup is clean)
│  └─ Restore from backup + investigate prune logic
│     └─ ROLLBACK to Wave E if bug confirmed
│
└─ NO (backup also corrupted)
   └─ Restore from off-site backup (S3, etc)
      └─ Timeline loss: X days of records
      └─ ROLLBACK to Wave E + review archive strategy
```

**Rollback Steps (if bug in prune):**

```bash
# 1. Verify backup integrity
npm run cic-ingestion -- repair --on-manifest /backups/ingestionManifest-backup.jsonl --dry-run
# If valid, proceed to restore

# 2. Stop daemon
systemctl stop cic-ingestion-daemon

# 3. Restore manifest
cp /backups/ingestionManifest-2026-07-06.jsonl \
   cic-ingestion/ingestionManifest.jsonl

# 4. Remove partial archives
rm -rf cic-ingestion/manifests-archived/

# 5. Revert Wave F deployment
git checkout <wave-e-commit-hash>
npm install && npm run build

# 6. Run repair (to clean any corruption from failed prune)
npm run cic-ingestion -- repair

# 7. Restart daemon
systemctl start cic-ingestion-daemon

# 8. Resume normal prune schedule (once Wave E is verified)
npm run cic-ingestion -- prune --retention 90
```

### Scenario 3: Quarantine CLI Causing Data Loss

**Symptoms:**
- Quarantine approvals deleting records instead of moving them
- Manifest shrinking unexpectedly after approval operations
- `forceReingest` flag being set incorrectly

**Decision Tree:**

```
Are deleted records recoverable?
├─ YES (backup exists, within 24h)
│  └─ Restore from backup
│     └─ Investigate quarantine logic
│        └─ ROLLBACK to Wave E if CLI bug
│
└─ NO (no backup, records lost)
   └─ ROLLBACK to Wave E immediately
      └─ File critical incident
      └─ Implement post-deployment testing before re-release
```

**Rollback Steps:**

```bash
# 1. Identify time of first data loss
grep -i "approveQuarantine\|forceReingest" cic-ingestion.log | head -20
# Find first suspicious operation

# 2. Restore manifest from backup before data loss
LOSS_TIME="2026-07-07T14:30:00Z"
cp /backups/ingestionManifest-$(date -d "$LOSS_TIME" +%Y-%m-%d).jsonl \
   cic-ingestion/ingestionManifest.jsonl

# 3. Prevent future quarantine operations (disable CLI)
systemctl stop cic-ingestion-quarantine-api

# 4. Revert Wave F deployment
git checkout <wave-e-commit-hash>
npm install && npm run build

# 5. Restart daemon only (not quarantine API)
systemctl start cic-ingestion-daemon

# 6. Investigation
# - Review quarantine approval logic
# - Add integration tests for approval workflow
# - Require code review before re-deployment
```

### Scenario 4: Lock Contention Breaking Concurrency

**Symptoms:**
- Repeated lock timeouts (unable to append records)
- Ingestion stops, manifest not growing
- System appears hung

**Decision Tree:**

```
Is lock issue persistent (> 1 hour)?
├─ YES: Suggests bug in Wave F lock logic
│  └─ ROLLBACK to Wave E (lock implementation changed)
│
└─ NO (< 1 hour, transient)
   └─ Manual recovery (clear stale lock, restart)
      └─ Monitor for recurrence
      └─ If happens again, ROLLBACK
```

**Rollback Steps (if persistent):**

```bash
# 1. Kill stuck processes
pkill -9 node

# 2. Clean up lock files
rm -f cic-ingestion/ingestionManifest.lock*

# 3. Wait for cleanup
sleep 2

# 4. Revert Wave F (lock mechanism reverted)
git checkout <wave-e-commit-hash>
npm install && npm run build

# 5. Restart daemon
systemctl start cic-ingestion-daemon

# 6. Test writes (should succeed now)
npm run cic-ingestion -- daemon --mode test --records 100

# 7. Review
# - What changed in lock acquisition?
# - Why did Wave F timeout logic not work?
# - Need longer timeout? Different backoff?
```

## Pre-Rollback Checklist

Before deciding to rollback, verify:

- [ ] Backup exists and is valid (can be restored)
- [ ] Backup is recent (< 24h old)
- [ ] Rollback won't lose critical data (> 95% manifest recovery expected)
- [ ] Off-site backup exists (S3 or remote)
- [ ] Incident is severe enough to justify downtime
- [ ] Rootcause is confirmed to be in Wave F (not pre-existing)

**If any checkbox fails → escalate to architecture team (don't rollback alone)**

## Rollback Timeline

| Phase | Time | Action |
|-------|------|--------|
| **Decision** | 0–10m | Confirm issue, gather data, brief team |
| **Preparation** | 10–20m | Prep backup, test restore process, alert stakeholders |
| **Execution** | 20–30m | Kill processes, restore, revert code, restart |
| **Verification** | 30–40m | Test writes, check manifest, inspect logs |
| **Communication** | 40–50m | Notify stakeholders, file incident, schedule post-mortem |
| **Post-Mortem** | +24h | Review rootcause, improve testing, plan re-deployment |

**Total downtime:** 30–40 minutes (acceptable for critical data integrity issue)

## Post-Rollback Procedure

**Day 1 (immediately after rollback):**

```bash
# 1. Verify Wave E is stable
npm run cic-ingestion -- stats
npm run cic-ingestion -- repair --dry-run

# 2. Check logs for errors
tail -200 cic-ingestion.log | grep -i "error\|warn"

# 3. Monitor repair/prune (Wave E versions)
# Should succeed without issues

# 4. Collect diagnostics for investigation
mkdir /tmp/incident-2026-07-07
cp cic-ingestion.log /tmp/incident-2026-07-07/
cp ingestionManifest.backup.jsonl /tmp/incident-2026-07-07/
git log --oneline -20 > /tmp/incident-2026-07-07/git-history.txt
npm run cic-ingestion -- stats > /tmp/incident-2026-07-07/stats.json
```

**Day 2–3 (investigation):**

1. **Rootcause Analysis**
   - What specific code change broke it?
   - Was the change in repair, prune, or CLI?
   - Did tests not catch the issue?

2. **Test Coverage Review**
   - Which tests did NOT cover the failure scenario?
   - Add integration tests to catch regression

3. **Code Review**
   - Request external code review of Wave F changes
   - Focus on lock handling, manifest format, archive logic

4. **Re-Deployment Plan**
   - Fix identified bug
   - Add test coverage
   - Plan phased rollout again (canary first)
   - Require sign-off before re-deployment

**Week 1 (after-action review):**

- Incident post-mortem meeting
- Document lessons learned
- Update runbooks with new scenarios
- Plan re-deployment timeline

## Preventing Rollback (Best Practices)

1. **Comprehensive Testing**
   - Master gate tests all 5 waves (in this PR)
   - Integration tests for repair + prune together
   - Corruption scenarios (power loss, concurrent writes)
   - Archive integrity tests

2. **Canary Deployment**
   - Start with 1% traffic
   - Monitor corruption_rate, lock contention, availability
   - Ramp up only if all metrics pass

3. **Backup Strategy**
   - Daily manifest backup to local disk
   - Weekly backup to S3 (off-site)
   - Archive backup (S3 Glacier) for long-term recovery

4. **Monitoring & Alerting**
   - Page on-call if corruption_rate > 0.5%
   - Page on-call if lock timeouts > 10 per hour
   - Page on-call if manifest growth stops > 5 min
   - Warn (no page) if prune takes > 10 min

5. **Graceful Degradation**
   - If prune fails, disable archival (keep all records)
   - If repair fails, continue (operator can manual intervene)
   - If lock stuck, operators can manual kill + restart

## Rollback Approval Process

| Severity | Decision Maker | Approval Time | Action |
|----------|---|---|---|
| **Critical** (data loss, >95% unavailable) | On-Call Eng + Manager | < 5 min | Rollback immediately, notify C-suite |
| **High** (>50% data loss, availability 50–95%) | On-Call Eng | < 15 min | Rollback, post-mortem scheduled |
| **Medium** (< 50% data loss, mostly usable) | Platform Lead | < 1 hour | Attempt fix, rollback if fix fails |
| **Low** (cosmetic, no data loss) | Engineer | < 4 hours | Schedule fix in next sprint |

---

See also: [phase-27-wave-f-runbook.md](./phase-27-wave-f-runbook.md), [phase-27-wave-f-troubleshooting.md](./phase-27-wave-f-troubleshooting.md)
