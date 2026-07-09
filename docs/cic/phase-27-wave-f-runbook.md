---
title: "Phase 27 Wave F: Operational Runbook"
summary: "**Target Audience:** Site reliability engineers, DevOps, on-call operators"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 27 Wave F: Operational Runbook

**Target Audience:** Site reliability engineers, DevOps, on-call operators

## Daily Checklist

### Morning (06:00 UTC)

```bash
# 1. Check for lock file staleness
ls -la cic-ingestion/ingestionManifest.lock
# If > 5 minutes old: rm (manual cleanup required)

# 2. Inspect manifest size
stat cic-ingestion/ingestionManifest.jsonl
# Expected: grows ~1GB/month (adjust retention if needed)

# 3. Check archive directory
du -sh cic-ingestion/manifests-archived/
# Expected: 5–10GB after 3 months (depends on data volume)

# 4. Verify archive integrity (sample check)
head -1 cic-ingestion/manifests-archived/manifests-archived-*.jsonl | jq .
# Should parse valid JSON
```

### Evening (20:00 UTC)

```bash
# 1. Run nightly repair (automated, but verify manually)
npm run cic-ingestion -- repair
# Expected output:
# {
#   "totalLines": 1000000,
#   "validLines": 999998,
#   "corruptedLines": 2,
#   "missingFields": []
# }

# 2. Run nightly prune (automated, but verify manually)
npm run cic-ingestion -- prune
# Expected output:
# {
#   "totalRecords": 1000000,
#   "retainedRecords": 950000,
#   "archivedRecords": 50000,
#   "oldestRetainedDate": "2026-04-09T...",
#   "youngestArchivedDate": "2026-04-07T..."
# }

# 3. Verify manifest after operations
wc -l cic-ingestion/ingestionManifest.jsonl
# Should match retainedRecords from prune output

# 4. Report stats to governance
npm run cic-ingestion -- stats --format json | jq .
```

## Alerting Thresholds

### Critical (page on-call)

| Metric | Threshold | Action |
|--------|-----------|--------|
| corruption_rate | > 0.1% | Trigger repair + manual review |
| lock_age_minutes | > 5 | Check process health, restart if needed |
| archive_disk_usage | > 90% | Alert storage team, consider retention reduction |
| manifest_size_gb | > 20 | Prune more aggressively (reduce retention) |

### Warning (log + alert, not paging)

| Metric | Threshold | Action |
|--------|-----------|--------|
| corruption_rate | > 0.01% | Monitor, increase inspection frequency |
| archive_files_count | > 100 | Consider consolidation strategy |
| quarantine_queue_size | > 1000 | Operator review backlog forming |

### Info (log only)

| Metric | Threshold | Action |
|--------|-----------|--------|
| repair_duration_sec | > 300 | Normal variance, no action |
| prune_duration_sec | > 600 | Normal variance, no action |
| avg_record_age_days | changing | Track for capacity planning |

## Common Operations

### Scenario 1: Repair Detects Corruption

**Symptom:** Nightly repair reports `corruptedLines > 0`

**Steps:**
1. Check backup: `ls -la cic-ingestion/ingestionManifest.backup.jsonl`
2. Inspect backup for patterns: `tail -100 ingestionManifest.backup.jsonl | jq .`
3. Verify repair worked: `wc -l ingestionManifest.jsonl` (should be validLines count)
4. If corruption is data error (not system issue): no action needed
5. If corruption is system error (power loss, I/O error):
   - Check disk health: `smartctl` or vendor tools
   - Consider restore from backup + replay
   - File incident ticket

**Recovery:**
```bash
# If needed, restore from backup
cp cic-ingestion/ingestionManifest.backup.jsonl cic-ingestion/ingestionManifest.jsonl

# Replay from governance checkpoint
npm run cic-ingestion -- replay --checkpoint 2026-07-06T06:00:00Z
```

### Scenario 2: Quarantine Queue Growing

**Symptom:** `cic-ingestion quarantine list` shows > 100 items

**Steps:**
1. Check queue: `npm run cic-ingestion -- quarantine list --format json | jq '.[] | .id, .error'`
2. Group by error type: `jq -r '.error' | sort | uniq -c | sort -rn`
3. Determine root cause:
   - Network timeout → increase retry logic, check upstream health
   - Parsing error → extractor bug, file ticket
   - Unknown format → add profile + extraction rules
4. Approve batches by error type:
```bash
# Example: Approve 50 timeout errors to "fast" lane
jq -r '.[] | select(.error | contains("timeout")) | .id' | xargs -I {} \
  npm run cic-ingestion -- quarantine approve {} fast
```

**Operator Workflow:**
```bash
# 1. Sample quarantine items
npm run cic-ingestion -- quarantine list --limit 10

# 2. For each item, decide: approve, reject, or investigate
# Approve: move to a lane for reprocessing
npm run cic-ingestion -- quarantine approve <id> <target-lane>

# Reject: mark as reviewed (stays in quarantine, won't retry)
npm run cic-ingestion -- quarantine reject <id>

# 3. Re-process approved items
npm run cic-ingestion -- daemon --mode replay --since 2026-07-06T00:00:00Z
```

### Scenario 3: Prune Fails (Archive Disk Full)

**Symptom:** Prune returns error: `ENOSPC: no space left on device`

**Steps:**
1. Check disk: `df -h /archive`
2. If < 10% free: alert storage team
3. Temporary mitigation (reduce retention):
```bash
# Archive records > 60 days instead of 90 (temporary)
npm run cic-ingestion -- prune --retention 60

# Once space freed, revert
npm run cic-ingestion -- prune --retention 90
```
4. Long-term: plan capacity increase or external archive

### Scenario 4: Manifest Lock Stuck (Timeout)

**Symptom:** Writes timeout consistently, `lock_age_minutes > 5`

**Steps:**
1. Check lock file:
```bash
stat cic-ingestion/ingestionManifest.lock
# If > 5 minutes old: process likely crashed during write
```

2. Inspect process:
```bash
ps aux | grep ingestion
# Look for hung recordIngestion or repair/prune processes
```

3. Safe recovery:
```bash
# Kill hung process
kill -9 <pid>

# Remove stale lock
rm cic-ingestion/ingestionManifest.lock

# Verify manifest integrity
npm run cic-ingestion -- repair --dry-run

# Resume normal operations
npm run cic-ingestion -- daemon --start
```

**Preventive Measures:**
- Ensure `recordIngestion` completes < 1s per record
- Monitor slow extractors (add timeout)
- Review error logs for hung processes

### Scenario 5: Capacity Planning

**Assessment:**
```bash
# Check current manifest size
du -h cic-ingestion/ingestionManifest.jsonl
# Example: 2.5 GB

# Check archive size
du -sh cic-ingestion/manifests-archived/
# Example: 8.2 GB

# Calculate growth rate
# 1. Get size from 7 days ago
# 2. Compare: (current - past) / 7 = daily_growth_gb
# 3. Project: daily_growth_gb * 365 = yearly_growth

# Estimate retention needed
# Example: If daily_growth = 0.05 GB/day
# 90-day retention = 0.05 * 90 = 4.5 GB manifest
# +archive = ~15 GB total

# Recommendation
if total_size_gb > available_storage_gb * 0.8; then
  alert="Reduce retention or increase storage"
fi
```

### Scenario 6: Restore from Archive

**Use Case:** Operator requests records from archive for analysis

**Steps:**
```bash
# 1. Find archive file by date
ls cic-ingestion/manifests-archived/manifests-archived-2026-04-*.jsonl

# 2. Extract records for specific date
jq 'select(.timestamps.ingested | startswith("2026-04-09"))' \
  manifests-archived-2026-04-09.jsonl > /tmp/2026-04-09-records.jsonl

# 3. Restore to manifest (append, don't overwrite)
cat /tmp/2026-04-09-records.jsonl >> cic-ingestion/ingestionManifest.jsonl

# 4. Run repair to deduplicate if needed
npm run cic-ingestion -- repair

# 5. Prune again to re-archive if older than retention
npm run cic-ingestion -- prune
```

## Escalation Path

### Level 1: Monitoring + Alerting
- Alerts fire for critical metrics
- Dashboards show repair/prune stats
- Operator acknowledges (auto-page if not acknowledged in 5 min)

### Level 2: Runbook + Manual Review
- Operator follows scenario runbooks above
- If cause is simple (lock stuck, prune disk full): apply fix
- If root cause unclear: proceed to Level 3

### Level 3: Engineering Review
- Page on-call engineer (CIC platform team)
- Collect diagnostics: repair output, lock age, recent logs
- Investigate disk I/O, process logs, manifests
- Apply fix + file incident ticket

### Level 4: Post-Incident
- Review incident timeline
- Update runbook if new scenario discovered
- Adjust thresholds if false alarms
- Increase testing coverage for scenario

## Maintenance Windows

**Weekly:** Run full repair + prune cycle manually, verify output

**Monthly:**
- Audit quarantine queue (reconcile vs governance)
- Review corruption patterns (find root causes)
- Consolidate archives (combine old date-stamped files if possible)
- Capacity planning review

**Quarterly:**
- Full archive integrity audit (sample check random archives)
- Retention policy review (adjust if needed)
- Update this runbook with new scenarios

## Disaster Recovery

### If Manifest Completely Lost

```bash
# 1. Restore from backup
cp cic-ingestion/ingestionManifest.backup.jsonl cic-ingestion/ingestionManifest.jsonl

# 2. If backup also lost, replay from governance checkpoint
npm run cic-ingestion -- replay --since 2026-01-01T00:00:00Z

# 3. Verify record count matches governance
npm run cic-ingestion -- stats | jq .record_count
curl https://governance-api/stats | jq .ingestion.total_records
# Should match (or governance should be > manifest count)
```

### If Archive Lost (Recoverable Data)

```bash
# Archive is historical; if lost, data is gone but recent manifest is safe
# Recommendation: ensure off-site backup of archives

# For future: implement archive replication
# Example: daily sync to S3
aws s3 sync cic-ingestion/manifests-archived/ \
  s3://backup-bucket/manifests-archived/ --delete
```

## Notification Templates

### Slack Alert (Critical)

```
🚨 **CIC Ingestion Critical Alert**
Metric: corruption_rate
Value: 0.5%
Threshold: 0.1%
Action: Repair manifest, check disk health
Link: <link-to-dashboard>
```

### Email Alert (Daily Summary)

```
Subject: CIC Ingestion Nightly Report — 2026-07-07

Repair Results:
  Total: 1,000,000 lines
  Valid: 999,998
  Corrupted: 2
  Status: ✅ PASS

Prune Results:
  Total: 1,000,000 records
  Retained: 950,000
  Archived: 50,000
  Status: ✅ PASS

Manifest Health: 99.99% (excellent)
Archive Size: 8.2 GB
Disk Available: 42% free
Next Prune: 2026-07-08 20:00 UTC
```

---

See also: [phase-27-wave-f-architecture.md](./phase-27-wave-f-architecture.md), [phase-27-wave-f-troubleshooting.md](./phase-27-wave-f-troubleshooting.md)
