---
title: "Phase 27 — Ingestion Autonomy Implementation Checklist"
summary: "6-wave coding sequence (A–F) with explicit rollback points and commit boundaries"
created: "2026-07-07T00:00:00.000Z"
updated: "2026-07-07T00:00:00.000Z"
tags:
  - phase-27
  - implementation
  - checklist
  - waves
---

# Phase 27 — Ingestion Autonomy: Coding Checklist

**Status:** 📋 Ready to implement  
**Locked:** 2026-07-07  
**Estimated Duration:** 9.3 days  
**Rollback:** Feature flag `CIC_INGESTION_ROUTING_ENABLED`

---

## Overview

Phase 27 replaces polling-based ingestion with routing-based autonomy. Implementation follows 6 sequential waves (A–F), each producing a commit. **Waves must ship in order** — earlier waves are rollback points for later ones.

### Waves at a glance

| Wave | Scope | Commits | Duration | Risk |
|------|-------|---------|----------|------|
| A | Types + Profiles | 1 | 1d | Low |
| B | Router + Manifest (core) | 1 | 2d | Medium |
| C | Daemon integration | 1 | 1.5d | Medium |
| D | CLI + Quarantine tooling | 1 | 1d | Low |
| E | Repair + Pruning | 1 | 1.5d | Low |
| F | Nightly gates + rollback | 1 | 1.3d | Low |

**Total:** 6 commits, 9.3 days, 100% tested per nightly.

---

## Wave A: Types + Profiles

**Goal:** Define all interfaces and profiles; establish the data contract.

### Files to create

- **`cic-ingestion/src/ingestion/types.ts`**
  - `export type Lane = "fast" | "deep" | "quarantine"`
  - `export interface OperatorFlags { forceReingest, skip, quarantine, overrideProfile, overrideLane }`
  - `export interface RoutedIngestionDecision { profile, lane, extractors }`
  - `export interface ManifestRecord { id, source, mediaType, profile, lane, extractorsRun, verification, operatorFlags, timestamps, routingVersion, retryCount, cost }`
  - `export interface VerificationResult { passed, errors, cost }`
  - `export interface ExtractorResult { output, cost }`

- **`cic-ingestion/src/ingestion/ingestionProfiles.json`**
  - Declarative profiles for filesystem, api:*, images
  - JSON schema validation: `$schema`, `patternProperties`, required/additionalProperties
  - Include optional `maxRetries` per profile (default: global 3)

- **`cic-ingestion/src/ingestion/ingestionProfiles.schema.json`**
  - JSON Schema Draft 7 for profile validation
  - Used by runtime validation in tests

### Files to modify

- **`cic-ingestion/package.json`**
  - Add `types.ts` to `main.ts` import chain (if monorepo entry)
  - Update build script to include type checking

### Tests to add

- **`cic-ingestion/src/ingestion/types.test.ts`**
  - Assert all interfaces compile
  - Assert Lane enum values
  - Assert OperatorFlags structure

- **`cic-ingestion/src/ingestion/ingestionProfiles.test.ts`**
  - Load `ingestionProfiles.json`
  - Validate against schema
  - Assert each profile has `defaultLane`, `extractors`, optional `maxRetries`
  - Assert all `defaultLane` values are valid `Lane` enum

### Nightly gate

- **`ingestion_types_validation_gate`**
  - Load types.ts
  - Load ingestionProfiles.json
  - Assert no TypeScript errors
  - Assert schema validation passes

### Commit message

```
feat(phase-27-wave-a): Type system + ingestion profiles

- Define Lane, OperatorFlags, RoutedIngestionDecision, ManifestRecord
- Add VerificationResult + ExtractorResult with cost fields
- Create ingestionProfiles.json with filesystem/api/image profiles
- Add profile schema validation
- Tests: types.test.ts, ingestionProfiles.test.ts

Gate: ingestion_types_validation_gate ✅

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Rollback point

If Wave A fails:
- Delete types.ts, ingestionProfiles.json, tests
- Reset cic-ingestion/package.json
- Phase 26 behavior unchanged

---

## Wave B: Router + Manifest (Core Logic)

**Goal:** Implement the routing decision engine and manifest persistence layer. This is the heart of Phase 27.

### Files to create

- **`cic-ingestion/src/ingestion/ingestionRouter.ts`**
  - `export function route(entry: any): RoutedIngestionDecision`
    - Inspect source, mediaType, size from entry
    - Load profile from ingestionProfiles.json
    - Select lane (fast/deep/quarantine) based on heuristics:
      - Fast: small files, known-good sources, operator approved
      - Deep: images, PDFs, unknown sources, past failures
      - Quarantine: malformed, repeated DLQ, suspicious
    - Return decision with extractors
  - Tests for routing logic (5+ fixtures)

- **`cic-ingestion/src/ingestion/ingestionManifest.ts`**
  - `export function recordIngestion(entry, decision, verification, cost): void`
    - Lock pattern: acquire `ingestionManifest.lock` (O_EXCL)
    - Write record to temp file (`ingestionManifest.tmp`)
    - `fsync(tmp)`
    - Append temp to `ingestionManifest.jsonl`
    - `fsync(manifest)`
    - Delete temp file
    - Release lock (delete `.lock`)
    - Throw `FileLockedError` if lock exists
  - `export function loadManifest(): ManifestRecord[]`
    - Read JSONL line-by-line
    - Skip/warn malformed lines
    - Optional checksum validation
    - Return valid records
  - `export function backfillFromProcessedLines(processedLines): void`
    - Synthesize manifest records for historical lines
    - Set `routingVersion = "legacy"`, `lane = "fast"`, `profile = "filesystem"`
    - Set extractors to whatever Phase 26 used
    - Call `recordIngestion()` for each

- **`cic-ingestion/ingestionManifest.jsonl`** (empty initially)
  - Append-only manifest log
  - Subject to pruning (Wave E)

- **`cic-ingestion/src/ingestion/ingestionManifest.test.ts`**
  - Test `recordIngestion()` writes valid JSONL
  - Test concurrent lock (FileLockedError thrown)
  - Test `loadManifest()` skips garbage
  - Test `backfillFromProcessedLines()` synthesizes records
  - Test manifest record structure (all required fields)
  - Test cost field propagation

### Files to modify

- **`cic-ingestion/src/ingestion/ingestionRouter.test.ts`**
  - Golden routing tests (use fixtures from nightly)
  - Assert profile selection
  - Assert lane selection
  - Assert extractor set correctness

### Nightly gate

- **`ingestion_routing_gate`**
  - Use fixtures from `ingestionRoutingGolden.json`
  - Assert `route(entry)` returns correct profile/lane/extractors
  - Assert `recordIngestion()` writes valid manifest records
  - Assert manifest contains all required fields + `routingVersion`, `retryCount`, `cost`
  - Assert concurrent lock prevents double-write

### Commit message

```
feat(phase-27-wave-b): Router + manifest persistence

- Implement route(entry) decision engine (profile/lane selection)
- Add recordIngestion() with lock-guarded atomic append
  - Temp → fsync → append → rename pattern
  - FileLockedError on concurrent access
- Add loadManifest() with malformed-line handling
- Add backfillFromProcessedLines() for historical data
- Create ingestionManifest.jsonl (JSONL append-only log)
- Tests: ingestionRouter.test.ts, ingestionManifest.test.ts

Gate: ingestion_routing_gate ✅

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Rollback point

If Wave B fails after integration:
- Set `CIC_INGESTION_ROUTING_ENABLED=false`
- Daemon bypasses `route()`, uses Phase 26 behavior
- Manifest still written with `profile = "legacy"`, `routingVersion = "legacy"`
- Nightly: Phase 26 gates pass, Phase 27 gates marked SKIPPED

---

## Wave C: Daemon Integration

**Goal:** Wire routing + manifest into the ingestion daemon. Daemon becomes a router executor.

### Files to modify

- **`cic-ingestion/src/ingestion/daemon.ts`**
  - Add env flag: `CIC_INGESTION_ROUTING_ENABLED` (default: true)
  - On each log entry:
    1. Parse entry
    2. Check for operator overrides (load `operatorOverrides.json`)
    3. If override → apply (skip/quarantine/forceReingest/override profile/lane)
    4. Call `route(entry)` to get decision
    5. Select extractors based on decision.lane
    6. Run extractors, collect `extractorCost`
    7. Run `verifyIngestionEntry()` (Phase 26), collect `verificationCost`
    8. Compute `totalCost = extractorCost + verificationCost`
    9. Call `recordIngestion(entry, decision, verification, { extractorCost, verificationCost, totalCost })`
    10. If verification failed + lane=quarantine → mark quarantine flag in manifest, skip indexing
    11. If verification failed + lane!=quarantine → write to DLQ (existing `failed-jobs.log`)
    12. If verification passed → continue to indexing
  - If `CIC_INGESTION_ROUTING_ENABLED=false`:
    - Bypass routing, use Phase 26 behavior (extract all, verify, index or DLQ)
    - Still write manifest with `profile="legacy"`, `routingVersion="legacy"`

- **`cic-ingestion/src/ingestion/operatorOverrides.json`**
  - Create empty initially (will be populated by operators)
  - Schema: `{ "id": { forceReingest, skip, quarantine, overrideProfile, overrideLane } }`

- **`cic-ingestion/src/ingestion/daemon.test.ts`** (or update existing)
  - Test normal flow (route → extract → verify → record)
  - Test operator override flow (override profile/lane respected)
  - Test quarantine path (failed verification + deep lane → quarantine flag)
  - Test DLQ path (failed verification + fast lane → DLQ)
  - Test legacy mode (`CIC_INGESTION_ROUTING_ENABLED=false`)
  - Test cost propagation (extractorCost + verificationCost in manifest)

### Nightly gate

- **`ingestion_daemon_integration_gate`**
  - Run daemon with test entries
  - Assert manifest records created
  - Assert failed entries in DLQ or marked quarantine
  - Assert routing decisions respected
  - Assert cost fields populated

### Commit message

```
feat(phase-27-wave-c): Daemon integration with routing

- Wire route() into daemon per-entry flow
- Load operatorOverrides.json, apply skip/quarantine/override
- Extract → verify → recordIngestion() workflow
- Quarantine path: failed verification + deep lane → quarantine flag (no indexing)
- DLQ path: failed verification + fast lane → failed-jobs.log
- Env flag CIC_INGESTION_ROUTING_ENABLED for rollback (legacy mode)
- Tests: daemon.test.ts with normal/override/quarantine/DLQ paths

Gate: ingestion_daemon_integration_gate ✅

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Rollback point

Same as Wave B: set flag to false, revert to Phase 26 behavior.

---

## Wave D: CLI + Quarantine Tooling

**Goal:** Give operators visibility and control over quarantined items.

### Files to create

- **`cic-ingestion/src/ingestion/quarantineReview.ts`**
  - `export function listQuarantined(): ManifestRecord[]`
    - Load manifest, filter where `operatorFlags.quarantine === true`
    - Sort by timestamp descending
  - `export function approve(id: string): void`
    - Load manifest, find record by id
    - Clear `operatorFlags.quarantine = false`
    - Set `operatorFlags.forceReingest = true`
    - Increment `retryCount`
    - Write updated record to manifest
    - Log "Quarantine approved for {id}, will re-ingest next cycle"
  - `export function reject(id: string): void`
    - Load manifest, find record by id
    - Set `operatorFlags.skip = true`
    - Keep `operatorFlags.quarantine = true` (for audit trail)
    - Write updated record to manifest
    - Log "Quarantine rejected for {id}, will skip all future ingestion"

- **`cic-ingestion/src/ingestion/quarantineReview.test.ts`**
  - Test listQuarantined (fixture with 3+ quarantined items)
  - Test approve (retryCount increments, quarantine cleared)
  - Test reject (skip set, quarantine kept)
  - Test re-ingestion after approve (next daemon cycle respects forceReingest)

### Files to modify

- **`cic-ingestion/src/cli/cic-cli.ts`** (or equivalent CLI entry)
  - Add command: `quarantine:list [--json]`
    - Calls `listQuarantined()`
    - Outputs table or JSON
  - Add command: `quarantine:approve <id>`
    - Calls `approve(id)`
    - Confirms action
  - Add command: `quarantine:reject <id>`
    - Calls `reject(id)`
    - Confirms action

- **`cic-ingestion/src/cli/cic-cli.test.ts`**
  - Test CLI commands (quarantine:list, approve, reject)
  - Test help text

### Nightly gate

- **`ingestion_quarantine_cli_gate`**
  - List quarantined items
  - Approve an item, verify retryCount increments
  - Verify next daemon cycle respects forceReingest
  - Reject an item, verify skip flag set

### Commit message

```
feat(phase-27-wave-d): Quarantine review + operator CLI

- Add quarantineReview.ts: listQuarantined(), approve(), reject()
- Wire into cic-cli: quarantine:list, quarantine:approve, quarantine:reject
- Approve clears quarantine, increments retryCount, sets forceReingest
- Reject sets skip flag (permanent skip, keeps quarantine for audit)
- Tests: quarantineReview.test.ts, cli.test.ts

Gate: ingestion_quarantine_cli_gate ✅

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Rollback point

Minimal impact — if CLI breaks, delete quarantineReview.ts and CLI commands, revert daemon integration. Manifest unaffected.

---

## Wave E: Repair + Pruning

**Goal:** Manifest durability and lifecycle management.

### Files to create

- **`cic-ingestion/src/ingestion/repairManifest.ts`**
  - `export function scanAndRepair(dryRun: boolean = false): { removed: number, archived: number }`
    - Read ingestionManifest.jsonl line-by-line
    - For each line:
      - Try parse + validate against JSON schema
      - If invalid → log warning, remove line
      - If valid → keep
    - Optional checksum validation (if checksum field exists, verify CRC32 or SHA256)
    - Report removed count
    - If `!dryRun` → rewrite manifest (write temp, fsync, replace)

- **`cic-ingestion/src/ingestion/pruneManifest.ts`**
  - `export function pruneByRetention(retentionDays: number = 90, dryRun: boolean = false): { archived: number, kept: number }`
    - Load manifest
    - Split by timestamp (last N days vs older)
    - Write current records to ingestionManifest.jsonl
    - Archive older records to `ingestionManifest.archive.<YYYY-MM-DD>.jsonl`
    - Report counts
    - If `!dryRun` → apply changes

- **`cic-ingestion/src/ingestion/repairManifest.test.ts`**
  - Test repair with corrupted lines (skip + count)
  - Test repair with valid lines (keep all)
  - Test checksum validation (if checksum field present)

- **`cic-ingestion/src/ingestion/pruneManifest.test.ts`**
  - Test retention policy (keep 90 days, archive older)
  - Test archive file naming
  - Test dry-run (no changes applied)

### Files to modify

- **`cic-ingestion/src/cli/cic-cli.ts`**
  - Add command: `manifest:repair [--dry-run]`
    - Calls `scanAndRepair(dryRun)`
    - Reports removed/archived counts
  - Add command: `manifest:prune [--retention-days=90] [--dry-run]`
    - Calls `pruneByRetention(retentionDays, dryRun)`
    - Reports kept/archived counts

### Nightly gate

- **`ingestion_manifest_durability_gate`**
  - Test repair with corrupted manifest (corrupted lines removed)
  - Test prune by retention (old records archived, new kept)
  - Assert archive files named correctly
  - Assert manifest rebuilds correctly after repair/prune

### Commit message

```
feat(phase-27-wave-e): Manifest repair + retention policy

- Add repairManifest(): validate + remove corrupted lines
  - Optional checksum validation (CRC32/SHA256)
- Add pruneManifest(): 90-day retention, archive older records
  - Archive to ingestionManifest.archive.<YYYY-MM-DD>.jsonl
- Wire into CLI: manifest:repair, manifest:prune
- Tests: repairManifest.test.ts, pruneManifest.test.ts

Gate: ingestion_manifest_durability_gate ✅

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Rollback point

Low impact — repair/prune are optional operator tools. If they break, operators skip them, manifest grows but is usable. Can disable in CLI without affecting daemon.

---

## Wave F: Nightly Gates + Rollback

**Goal:** Final integration testing and rollback documentation. Phase 27 goes live.

### Files to create

- **`docs/cic/phases/phase-27-ingestion-autonomy.md`**
  - Complete specification (markdown rendering of the locked plan)
  - Usage guide for operators
  - CLI command reference
  - Troubleshooting
  - Rollback procedure

- **`src/harness/regression/ingestionRoutingGolden.json`**
  - 5–10 golden fixtures for routing gate
  - Example formats:
    ```json
    [
      {
        "entry": { "source": "filesystem", "mediaType": "text/plain", "size": 512 },
        "expectedProfile": "filesystem",
        "expectedLane": "fast",
        "expectedExtractors": ["TextExtractor", "SemanticExtractor"]
      },
      {
        "entry": { "source": "api:familysearch", "mediaType": "application/json", "size": 2048 },
        "expectedProfile": "api:familysearch",
        "expectedLane": "deep",
        "expectedExtractors": ["TextExtractor", "RelationshipExtractor", "TopicExtractor"]
      }
    ]
    ```

### Files to modify

- **`src/harness/regression/nightly.ts`**
  - Add gate: `ingestion_routing_gate`
    - Use fixtures from ingestionRoutingGolden.json
    - Assert routing correctness
  - Add gate: `ingestion_manifest_safety_gate`
    - Assert no crashes during recordIngestion()
    - Assert manifest records have all required fields
  - Update `cic_query_gate`:
    - Assert quarantined/skipped items not in search index

- **`docs/cic/phases/phase-27-rollback.md`**
  - Rollback steps (set flag, redeploy, verify gates)
  - Recovery procedure (re-enable flag, re-test)
  - Troubleshooting common issues

### Nightly gate

- **`phase_27_complete_gate`** (meta-gate)
  - All Phase 27 gates pass (routing, daemon, CLI, manifest, quarantine)
  - Manifest record count matches entry count
  - No concurrent write errors
  - Cost fields populated correctly

### Final validation

Run full nightly suite:
```
npm run test:nightly

Expected output:
✅ ingestion_types_validation_gate
✅ ingestion_routing_gate
✅ ingestion_daemon_integration_gate
✅ ingestion_quarantine_cli_gate
✅ ingestion_manifest_durability_gate
✅ phase_27_complete_gate
✅ ingestion_verification_gate (Phase 26)
✅ cic_query_gate
```

### Commit message

```
feat(phase-27-wave-f): Nightly gates + documentation (Phase 27 LOCKED)

- Add ingestionRoutingGolden.json fixtures (5+ golden cases)
- Wire Phase 27 gates into nightly:
  - ingestion_routing_gate
  - ingestion_manifest_safety_gate
  - phase_27_complete_gate
- Create phase-27-ingestion-autonomy.md (spec + operator guide)
- Create phase-27-rollback.md (rollback procedures)
- All Phase 26 gates still pass (Phase 27 backward-compatible)
- Tests: nightly suite validates all 6 waves

Gate: phase_27_complete_gate ✅

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Rollback point

If nightly fails:
1. Set `CIC_INGESTION_ROUTING_ENABLED=false`
2. Redeploy
3. Nightly re-runs:
   - Phase 26 gates pass
   - Phase 27 gates skipped
4. Debug failing gate
5. Re-enable and retry

---

## Overall Rollback Logic

**Feature flag:** `CIC_INGESTION_ROUTING_ENABLED`

| Flag Value | Behavior |
|------------|----------|
| `true` (default) | Phase 27 routing active; uses all 6 waves |
| `false` | Phase 26 behavior; bypasses routing, uses single extractor path |

**Rollback steps (any wave):**
1. Set env var: `CIC_INGESTION_ROUTING_ENABLED=false`
2. Redeploy daemon
3. Verify nightly: Phase 26 gates ✅, Phase 27 gates skipped
4. Diagnose issue
5. Fix + test in staging
6. Re-enable flag
7. Redeploy + nightly ✅

**Manifest persistence:** Manifest file continues to exist even in legacy mode (backward-compatible, aids debugging).

---

## Ship Criteria (All must pass)

- ✅ All 6 waves commit cleanly (no merge conflicts)
- ✅ Nightly: all Phase 27 gates pass
- ✅ Nightly: all Phase 26 gates still pass (backward-compatible)
- ✅ No concurrent write errors (FileLockedError test passes)
- ✅ Cost fields populated (Phase 28 prep)
- ✅ CLI commands work (quarantine:list, approve, reject)
- ✅ Rollback tested (flag toggle verified)
- ✅ Documentation complete (phase-27-ingestion-autonomy.md)

---

## Success Metrics (Post-ship)

Once Phase 27 ships:

- Ingestion routing is **predictable** (profile-driven, not chaos)
- Ingestion is **operator-governed** (overrides work)
- Ingestion is **auditable** (manifest records track all decisions)
- Ingestion is **scalable** (routing + lanes handle varied sources)
- Ingestion is **safe** (quarantine prevents bad data → index)
- Phase 28 is **unblocked** (cost fields ready)
- Phase 30 governance is **unblocked** (manifest provides audit trail)

---

## Status

| Wave | Status | Notes |
|------|--------|-------|
| A | 📋 Ready | Start with types.ts, profiles.json |
| B | 📋 Ready | Router + manifest (the core) |
| C | 📋 Ready | Daemon wiring (single commit) |
| D | 📋 Ready | CLI tooling |
| E | 📋 Ready | Repair + prune (optional but recommended) |
| F | 📋 Ready | Nightly + docs (ship gate) |

**Next step:** Begin Wave A (types.ts + ingestionProfiles.json).
