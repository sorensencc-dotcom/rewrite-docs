---
title: "Phase 27 Wave F: Architecture & Integration"
summary: "**Status:** Implementation (due 2026-07-10)"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 27 Wave F: Architecture & Integration

**Status:** Implementation (due 2026-07-10)  
**Waves A–E:** ✅ Complete (types, routing, manifest, daemon, CLI, durability)  
**Wave F Scope:** Gates + docs + golden fixtures

## Overview

Phase 27 replaces log-polling ingestion with event-driven routing. Six waves deliver:

| Wave | Component | Status | Tests |
|------|-----------|--------|-------|
| A | Types + profiles | ✅ | 45/45 |
| B | Router + manifest | ✅ | 45/45 |
| C | Daemon integration | ✅ | (routing + overrides) |
| D | CLI + quarantine | ✅ | 9/9 |
| E | Repair + prune | ✅ | 40/40 |
| **F** | **Gates + docs** | 🚀 | **TBD** |

## System Design

### 5-Layer Pipeline

```
1. [Source] → client logs, API responses, external feeds
   ↓
2. [Router] → Examines source/mediaType → profile selection
   ↓
3. [Extractor] → Profile determines lane (fast/deep/slow/quarantine)
   ↓
4. [Manifest] → Append-only log (JSONL) + O_EXCL lock for safety
   ↓
5. [Durability] → nightly repair (corruption removal) + prune (retention)
```

### Types (Wave A)

```typescript
interface ManifestRecord {
  id: string;                  // unique identifier
  source: string;              // origin URL
  mediaType: string;           // text/plain, application/json, etc
  profile: string;             // routing profile (api, web, local)
  lane: string;                // fast, deep, slow, quarantine
  extractorsRun: string[];     // list of extractors applied
  verification: {
    passed: boolean;
    errors: string[];
  };
  operatorFlags: {
    quarantine?: boolean;      // manual quarantine flag
    priority?: string;         // high/normal/low
    forceReingest?: boolean;   // CLI approval signal
  };
  timestamps: {
    ingested?: string;         // when received
    verified?: string;         // when verified
    indexed?: string;          // when indexed
  };
  routingVersion: string;      // e.g., "1.0.0"
  retryCount: number;
  cost: {
    extractorCost: number;
    verificationCost: number;
    totalCost: number;
  };
}
```

### Routing (Wave B)

**Input:** Metadata (source, mediaType, profile)  
**Output:** Lane assignment + extractor list

```
source = "https://api.github.com/*" → profile:api, lane:fast
source = "https://example.com/*"    → profile:web, lane:deep
source = "local-file"               → profile:local, lane:slow
```

### Manifest (Wave B)

File: `ingestionManifest.jsonl` (append-only)

**Concurrency Safety:**
- `O_EXCL` flag ensures atomic writes
- Lock file `ingestionManifest.lock` for coordination
- 5-second timeout with exponential backoff
- `fsync()` for durability

**Format:** One JSON record per line

```jsonl
{"id":"rec-1","source":"api.github.com","profile":"api","lane":"fast",...}
{"id":"rec-2","source":"example.com","profile":"web","lane":"deep",...}
```

### Daemon (Wave C)

**Role:** Monitors logs, routes entries, records to manifest

**Integration Points:**
- Governance (cicStateStore)
- Extractors (TextExtractor, HTMLExtractor, etc)
- Harness (replay + drift detection)
- Overrides (operator flags)

### CLI (Wave D)

**Commands:**
- `cic-ingestion quarantine list` — show quarantine items
- `cic-ingestion quarantine approve <id> <lane>` — move to target lane
- `cic-ingestion quarantine reject <id>` — mark as rejected

**Workflow:**
1. Suspicious entry lands in `lane:quarantine`
2. Operator reviews via CLI
3. Approve → move to target lane + set `forceReingest`
4. Reject → mark as reviewed

### Durability (Wave E)

#### Repair

**Purpose:** Detect + remove corrupted records  
**Triggers:** Nightly, manual via CLI

**Detects:**
- Invalid JSON (parse errors)
- Missing required fields (id, source, profile, lane, extractorsRun, verification, operatorFlags, timestamps, routingVersion, retryCount)

**Actions:**
- Create backup if corruption found
- Remove corrupted lines
- Rewrite manifest with valid records only

#### Prune

**Purpose:** Implement 90-day retention + archive old records

**Triggers:** Nightly

**Process:**
1. Read manifest
2. Separate by age (ingested > verified > indexed)
3. Archive records older than cutoff to `manifests-archived-YYYY-MM-DD.jsonl`
4. Rewrite manifest with recent records only

**Retention:** Configurable (default 90 days)

## Golden Paths

### Path 1: Normal Ingestion

```
1. Source: API response (JSON)
2. Router: profile:api, lane:fast
3. Extractor: JSONExtractor
4. Result: recorded to manifest, cost < 10ms
```

### Path 2: Web Content

```
1. Source: HTML page
2. Router: profile:web, lane:deep
3. Extractor: HTMLExtractor, TextExtractor
4. Verification: semantic validation
5. Result: recorded, cost < 500ms
```

### Path 3: Suspicious Entry

```
1. Source: Unknown type
2. Router: profile:unknown, lane:quarantine
3. Verification: fails
4. Result: flagged for review
5. CLI: operator approves → forceReingest
6. Result: moved to target lane, re-processed
```

### Path 4: Old Record Lifecycle

```
Day 1: ingested, recorded to manifest
Day 30: still in manifest
Day 90: prune cutoff reached
Day 91: archived to manifests-archived-YYYY-MM-DD.jsonl
```

### Path 5: Corruption Recovery

```
1. Manifest corrupted (partial write, bad JSON)
2. Nightly repair: detects 5 corrupted lines
3. Backup created: ingestionManifest.backup.jsonl
4. Corrupted lines removed
5. Manifest rewritten with 1,000 valid records
6. Operator reviews backup if needed
```

## File Locations

```
cic-ingestion/
├── src/ingestion/
│   ├── types.ts                        # Wave A: ManifestRecord interface
│   ├── ingestionProfiles.ts            # Wave A: Profile definitions
│   ├── ingestionRouter.ts              # Wave B: Route decision logic
│   ├── ingestionManifest.ts            # Wave B: Append + lock mechanism
│   ├── daemon-routing.ts               # Wave C: Daemon loop
│   ├── operatorOverrides.ts            # Wave C: Override handling
│   ├── quarantineReview.ts             # Wave D: CLI review logic
│   ├── repairManifest.ts               # Wave E: Corruption detection + repair
│   ├── pruneManifest.ts                # Wave E: Retention + archival
│   └── ingestion-wave-f-master-gate.ts # Wave F: E2E validation
├── ingestionManifest.jsonl             # Runtime: manifest log
├── ingestionManifest.lock              # Runtime: concurrency lock
└── manifests-archived/                 # Runtime: archive directory
    └── manifests-archived-YYYY-MM-DD.jsonl
```

## Nightly Operations Schedule

**00:00 UTC**
- Repair manifest (detect + remove corruption)
- Prune manifest (archive records > 90 days old)
- Verify archive integrity
- Report stats to governance

**06:00 UTC**
- Reindex archived records if needed
- Cleanup orphaned lock files (> 5 min old)

**12:00 UTC**
- Snapshot manifest for analytics
- Generate retention report

## Failure Modes & Recovery

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Partial write during append | JSON parse error | Repair removes line, creates backup |
| Missing required field | Validation check | Repair removes record, logs to operator |
| Concurrent writes | Lock timeout (5s) | Backoff retry (100ms, 200ms, 400ms, 800ms) |
| Stale lock file | Age > 5 minutes | Manual cleanup via operator |
| Archive disk full | Write error | Pause archival, alert operator |
| Retention boundary edge | >= 90 days | Conservative: retain if timestamp ambiguous |

## Metrics & Observability

**Repair Stats:**
- totalLines: count of lines in manifest
- validLines: count of valid records
- corruptedLines: count of corrupted lines
- missingFields: array of records with missing fields

**Prune Stats:**
- totalRecords: count of records processed
- retainedRecords: count kept in manifest
- archivedRecords: count moved to archive
- oldestRetainedDate: most recent date of archived records
- youngestArchivedDate: oldest date of archived records

**Manifest Health:**
- corruption_rate = corruptedLines / totalLines
- retention_ratio = retainedRecords / totalRecords
- archive_age_days = now - oldestArchivedDate
- lock_contention = failed_acquires / total_attempts

## Operator Procedures

### Manual Repair

```bash
npm run cic-ingestion -- repair
# Output: { totalLines: 1000, validLines: 998, corruptedLines: 2 }
# Backup created at ingestionManifest.backup.jsonl
```

### Manual Prune

```bash
npm run cic-ingestion -- prune --retention 60
# Archive records > 60 days old (default: 90)
# Output: { totalRecords: 1000, retainedRecords: 900, archivedRecords: 100 }
```

### Quarantine Workflow

```bash
# List quarantined entries
npm run cic-ingestion -- quarantine list

# Approve entry (move to lane, set forceReingest)
npm run cic-ingestion -- quarantine approve <id> fast

# Reject entry (mark reviewed)
npm run cic-ingestion -- quarantine reject <id>
```

### Rollback (if needed)

```bash
# Restore from backup
cp ingestionManifest.backup.jsonl ingestionManifest.jsonl

# Re-prune with different retention
npm run cic-ingestion -- prune --retention 120

# Verify
npm run cic-ingestion -- repair --dry-run
```

## Testing Strategy

**Wave F Master Gate** validates:
1. Type system (ManifestRecord structure)
2. Routing (profile + lane assignment)
3. Manifest recording (append + concurrency)
4. Daemon integration (multi-record flow)
5. Quarantine CLI (approval workflow)
6. Repair (corruption detection + removal)
7. Prune (retention + archival)
8. E2E pipeline (all 5 waves together)
9. Recovery scenarios (edge cases)

**Coverage:**
- Happy path: recent record flow
- Sad path: corrupted manifest recovery
- Edge cases: boundary dates, concurrent writes
- Golden fixtures: realistic production scenarios

---

See also: [phase-27-ingestion-autonomy-locked.md](./phase-27-ingestion-autonomy-locked.md)
