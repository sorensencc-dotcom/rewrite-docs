---
title: "Phase 27 Wave F: Troubleshooting Guide"
summary: "**Purpose:** Diagnostics and fixes for common issues"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 27 Wave F: Troubleshooting Guide

**Purpose:** Diagnostics and fixes for common issues

## Issue: High Corruption Rate

**Symptoms:**
- Repair reports `corruptedLines > 100`
- Error messages mentioning JSON parse errors
- Manifest rewrite taking > 1 minute

**Root Causes:**

### Cause 1: Power Loss During Write
**Evidence:** Many consecutive corrupted lines, gaps in IDs
```bash
# Check timestamps
tail -20 ingestionManifest.jsonl | jq .timestamps.ingested
# Should be in ascending order; if not, indicates crash during write
```

**Fix:**
```bash
# Restore from backup (most recent pre-crash state)
cp ingestionManifest.backup.jsonl ingestionManifest.jsonl

# Verify integrity
npm run cic-ingestion -- repair --dry-run

# Replay lost records from governance
npm run cic-ingestion -- replay --since <last-clean-checkpoint>
```

### Cause 2: Extractor Bug Writing Invalid JSON
**Evidence:** Corrupted lines have pattern (e.g., all from same extractor)
```bash
# Inspect backup
grep -A1 "corrupted" ingestionManifest.backup.jsonl | head -20
# Look for incomplete records (missing closing brace, etc)
```

**Fix:**
1. File bug with extractor team: include sample corrupted records
2. Restart extractor after fix deployed
3. Manually re-ingest failed entries:
```bash
npm run cic-ingestion -- daemon --mode replay --since 2026-07-06T00:00:00Z
```

### Cause 3: Concurrent Write Collision
**Evidence:** Lock timeout errors in recent logs
```bash
# Check timestamps
grep "lock timeout" cic-ingestion.log | tail -10
```

**Fix:** See Issue: Lock Stuck below

---

## Issue: Lock File Stuck

**Symptoms:**
- Write operations timeout with "EWOULDBLOCK" or "lock timeout"
- `ls -la ingestionManifest.lock` shows file age > 5 minutes
- Manifest not growing

**Diagnosis:**

```bash
# Check lock age
stat ingestionManifest.lock | grep Modify

# Check process holding lock (Linux)
fuser ingestionManifest.lock
# Or: lsof | grep ingestionManifest

# On Windows, check for hung Node process
Get-Process node | where { $_.Handles -gt 1000 }
```

**Root Causes:**

### Cause 1: Hung recordIngestion Process
**Evidence:** Process still alive but lock unclaimed
```bash
ps aux | grep "recordIngestion\|npm run"
# Should show process age
```

**Fix:**
```bash
# Kill hung process
kill -9 <pid>

# Wait 2 seconds for cleanup
sleep 2

# Verify repair integrity (manifest may be incomplete)
npm run cic-ingestion -- repair --dry-run

# Remove stale lock
rm ingestionManifest.lock

# Resume operations
npm run cic-ingestion -- daemon --start
```

### Cause 2: Disk I/O Stalled
**Evidence:** Lock file present but process not stuck
```bash
# Check disk I/O
iostat -x 1 5
# Look for %util = 100% (saturated)

# Check for hung I/O
dmesg | grep "blocked for"
```

**Fix:**
1. Identify hung I/O process: `ps -eo stat,pid,user,comm | grep D` (uninterruptible sleep)
2. Either wait for I/O to complete or restart VM
3. After recovery, run repair to ensure manifest intact:
```bash
npm run cic-ingestion -- repair
```

### Cause 3: Network Filesystem (NFS) Issue
**Evidence:** Lock files on NFS, process alive but can't proceed
```bash
# Check NFS mount
df -h | grep nfs

# Check NFS timeout errors
dmesg | grep "NFS"
```

**Fix:**
```bash
# Remount NFS
sudo umount -l /path/to/nfs
sudo mount <nfs-server>:/path /path/to/nfs

# Remove stale lock
rm ingestionManifest.lock

# Resume operations
npm run cic-ingestion -- daemon --start
```

---

## Issue: Prune Fails with ENOSPC

**Symptoms:**
- Prune command fails with "no space left on device"
- Archive directory exists but can't write
- Manifest not pruned

**Diagnosis:**

```bash
# Check disk space
df -h /archive (or wherever archive dir is)
# Example: 0 bytes available

# Check inode usage
df -i /archive
# May be out of inodes even if space available

# Check manifest size
du -h ingestionManifest.jsonl
```

**Root Causes:**

### Cause 1: Archive Partition Full
**Evidence:** `df` shows 100% usage on archive partition

**Fix (Temporary):**
```bash
# Find and remove old archive files not needed
ls -lah manifests-archived/
# Example: manifests-archived-2026-01-*.jsonl can be deleted if backed up

# Or consolidate old archives
# Combine multiple old archives into single compressed file
gzip -c manifests-archived-2026-01-*.jsonl > archives-2026-01.jsonl.gz
rm manifests-archived-2026-01-*.jsonl
```

**Fix (Permanent):**
1. Request storage team expand partition
2. Or implement off-site archive replication:
```bash
# Daily cron job to sync archives to S3
aws s3 sync manifests-archived/ s3://backup-bucket/manifests-archived/ --delete

# After sync verified, remove local archive
rm -rf manifests-archived/*
```

### Cause 2: Out of Inodes
**Evidence:** `df -i` shows 100% inode usage despite free space

**Fix:**
```bash
# Find high-inode-usage files
find manifests-archived/ -type f | wc -l
# If > 1M files, consolidate

# Consolidate archives by month
for month in {01..12}; do
  cat manifests-archived-2026-${month}-*.jsonl > archives-2026-${month}.jsonl
  rm manifests-archived-2026-${month}-*.jsonl
done

# Verify and continue prune
npm run cic-ingestion -- prune
```

---

## Issue: Repair Takes Too Long (> 5 minutes)

**Symptoms:**
- Repair command runs but takes 300+ seconds
- Manifest very large (> 10 GB)
- Process high CPU/memory

**Diagnosis:**

```bash
# Check manifest size
du -h ingestionManifest.jsonl
# Example: 12 GB

# Check corruption ratio
npm run cic-ingestion -- repair --dry-run
# Report: { totalLines: 100000000, corruptedLines: 5000 }
# (100M lines = high I/O overhead)

# Check system load
top -b -n 1 | head -20
# Check %CPU, memory available
```

**Root Causes:**

### Cause 1: Manifest Too Large
**Evidence:** Manifest > 5 GB, repair takes proportionally long

**Fix:**
```bash
# Reduce retention to prune more aggressively
npm run cic-ingestion -- prune --retention 30
# (Archive records > 30 days old instead of 90)

# After manifest is smaller, revert
npm run cic-ingestion -- prune --retention 90
```

**Prevention:**
```bash
# Schedule repair/prune during low-traffic window
# Add to cron (e.g., 02:00 UTC when traffic is low)
0 2 * * * cd /path && npm run cic-ingestion -- repair && npm run cic-ingestion -- prune
```

### Cause 2: Slow Storage Backend
**Evidence:** Repair progresses slowly (high iowait in `top`)

**Fix:**
```bash
# Check storage performance
fio --name=randread --ioengine=libaio --iodepth=4 \
    --rw=randread --bs=4k --direct=1 \
    --size=1G --runtime=60 --group_reporting

# If IOPS < 1000, storage is bottleneck
# Contact storage team for optimization
```

**Mitigation:**
```bash
# Increase retention policy to reduce repair frequency
# (trade-off: more storage used)
vim cic-ingestion/config.yaml
# retention_days: 60 (reduce from 90)
```

---

## Issue: Quarantine Queue Not Processing

**Symptoms:**
- Quarantine items stuck (not approving or rejecting)
- Manual approval commands timeout
- Queue growing indefinitely

**Diagnosis:**

```bash
# Check quarantine size
npm run cic-ingestion -- quarantine list --format json | jq length
# Example: 500 items

# Check lock/permission issues
ls -la ingestionManifest.lock
ls -la ingestionManifest.jsonl
# Verify readable/writable by ingestion user

# Check recent quarantine approvals
npm run cic-ingestion -- quarantine list --format json | jq '.[] | .updatedAt' | sort -r | head
# Should show recent timestamps
```

**Root Causes:**

### Cause 1: Manifest Lock Contention
**Evidence:** Lock file exists, approval commands timeout

**Fix:** See Issue: Lock File Stuck above

### Cause 2: Operator Not Using CLI Correctly
**Evidence:** Manual commands fail with permission errors
```bash
# Verify operator permissions
npm run cic-ingestion -- quarantine approve test-id fast --verbose
# If "permission denied": check file ownership

# Run as correct user
sudo -u ingestion-user npm run cic-ingestion -- quarantine approve test-id fast
```

**Fix:**
```bash
# Ensure ingestion user owns manifest files
chown -R ingestion-user:ingestion-group cic-ingestion/ingestionManifest*

# Try approval again
npm run cic-ingestion -- quarantine approve test-id fast
```

### Cause 3: Batch Processing Backlog
**Evidence:** Many approvals queued, processing slowly
```bash
# Check if batch job is running
ps aux | grep "quarantine.*batch"

# Check job queue
npm run cic-ingestion -- jobs list
```

**Fix:**
```bash
# Manually trigger batch processing
npm run cic-ingestion -- quarantine process --batch --parallel 4

# Or process in smaller batches
npm run cic-ingestion -- quarantine list | head -50 | xargs -I {} \
  npm run cic-ingestion -- quarantine approve {} fast
```

---

## Issue: Archive Files Missing/Corrupted

**Symptoms:**
- Prune reports successful archive but files not found
- Archive file exists but can't read JSON
- Date mismatch (file says 2026-04-09 but contains wrong dates)

**Diagnosis:**

```bash
# Check archive files exist
ls -la manifests-archived/

# Check archive integrity
head -1 manifests-archived-2026-04-09.jsonl | jq .
# Should parse as valid JSON

# Check file size (should be > 0)
du -h manifests-archived-2026-04-09.jsonl

# Check record count
wc -l manifests-archived-2026-04-09.jsonl
```

**Root Causes:**

### Cause 1: Prune Crashed During Archive Write
**Evidence:** Archive file exists but incomplete (0 bytes or truncated)
```bash
# Check file size vs expected
du -h manifests-archived-2026-04-09.jsonl
# Example: 0 bytes (write failed)

# Check timestamps in previous day's archive
tail -1 manifests-archived-2026-04-08.jsonl | jq .timestamps.ingested
# Should be earlier than missing day
```

**Fix:**
```bash
# Remove incomplete archive file
rm manifests-archived-2026-04-09.jsonl

# Re-run prune (will recreate archive)
npm run cic-ingestion -- prune

# Verify
ls -la manifests-archived-2026-04-09.jsonl
du -h manifests-archived-2026-04-09.jsonl
```

### Cause 2: Date Formatting Bug
**Evidence:** Archive filename says 2026-04-09 but contains 2026-04-10 records
```bash
# Check archive dates
jq .timestamps.ingested manifests-archived-2026-04-09.jsonl | sort -u | head
# Should all start with "2026-04-09" or earlier
```

**Fix:**
1. File bug with prune logic
2. For now, rename archive file to correct date or consolidate:
```bash
# Consolidate into single consolidated archive
cat manifests-archived-*.jsonl | sort -k10 > archives-consolidated.jsonl
rm manifests-archived-*.jsonl
```

---

## Issue: Out-of-Sync with Governance

**Symptoms:**
- Governance reports 1M total records but manifest only has 500K
- Quarantine queue count doesn't match governance database
- Record IDs in manifest differ from governance

**Diagnosis:**

```bash
# Compare counts
MANIFEST_COUNT=$(npm run cic-ingestion -- stats | jq .record_count)
GOVERNANCE_COUNT=$(curl -s https://governance-api/stats | jq .ingestion.total_records)
echo "Manifest: $MANIFEST_COUNT, Governance: $GOVERNANCE_COUNT"

# If Governance > Manifest: records may be in quarantine or archive
curl -s https://governance-api/stats | jq '{total, ingested, quarantine, archived}'
```

**Root Causes:**

### Cause 1: Records Archived But Governance Not Updated
**Evidence:** Governance has records manifest doesn't have
```bash
# Find record IDs in governance but not manifest
curl -s https://governance-api/records?since=2026-04-01 | jq '.[] | .id' > /tmp/gov-ids.txt
cat ingestionManifest.jsonl | jq .id > /tmp/manifest-ids.txt
comm -23 <(sort /tmp/gov-ids.txt) <(sort /tmp/manifest-ids.txt) | head -20
# Shows IDs only in governance
```

**Fix:**
```bash
# Check if records are in archive
grep -l "gov-id-1" manifests-archived/*.jsonl
# If found, expected (records are archived)

# If not found anywhere: records were lost
# File incident ticket to investigate loss

# Governance should be source of truth
npm run cic-ingestion -- sync-from-governance --since 2026-04-01
```

### Cause 2: Prune Removed Recent Records
**Evidence:** Manifest has fewer records than yesterday, but prune ran
```bash
# Check manifest size delta
YESTERDAY=$(du -h ingestionManifest.jsonl.backup | awk '{print $1}')
TODAY=$(du -h ingestionManifest.jsonl | awk '{print $1}')
echo "Yesterday: $YESTERDAY, Today: $TODAY"
# If Today < Yesterday: prune removed too many

# Check prune logs
npm run cic-ingestion -- prune --dry-run --verbose
# Verify retention policy is correct
```

**Fix:**
```bash
# Restore from backup if prune removed recent records
cp ingestionManifest.backup.jsonl ingestionManifest.jsonl

# Check retention policy (should be >= 90 days default)
npm run cic-ingestion -- config show | jq .retention_days

# If misconfigured:
npm run cic-ingestion -- config set retention_days 90

# Re-run prune with correct setting
npm run cic-ingestion -- prune
```

---

## Quick Fixes Checklist

| Issue | Quick Fix | Verify |
|-------|-----------|--------|
| Lock stuck | `rm ingestionManifest.lock` | `npm test -- ... master-gate` |
| Disk full | Prune with lower retention | `du -h manifests-archived/` |
| Quarantine backlog | Run batch approval | `quarantine list --count` |
| Corruption high | Restore from backup | `repair --dry-run` |
| Out of sync | Sync from governance | Compare record counts |
| Slow repair | Reduce retention | Measure repair time |

---

See also: [phase-27-wave-f-runbook.md](./phase-27-wave-f-runbook.md), [phase-27-wave-f-architecture.md](./phase-27-wave-f-architecture.md)
