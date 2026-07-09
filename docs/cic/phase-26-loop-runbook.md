---
title: "Phase 26 Loop Runbook"
summary: "Phase 26 implements three autonomic verification loops wired to actual running infrastructure. Each loop follows the pat"
updated: "2026-07-09"
tags:
  - cic
---
# Phase 26 Loop Runbook

## Overview

Phase 26 implements three autonomic verification loops wired to actual running infrastructure. Each loop follows the pattern: **Trigger → Find Work → Execute → Verify → Record**.

All loops are **operator-grade** (deterministic, machine-readable error codes, persistent state) and run separately from the main autonomy API. No message brokers, no embedding generation, no fictional infrastructure.

---

## 1. Ingestion Verification Loop

**Trigger**: IngestionDaemon runCycle (every 30s via `setInterval`)  
**Find Work**: Stream client_sessions.jsonl, extract via `clientSessionExtractor`  
**Execute**: Call `verifyIngestionEntry(extracted)` per entry  
**Verify**: Return `{ ok, reasonCode, reason }` with machine-readable codes:
- `MISSING_FIELD` — required field absent
- `BAD_TYPE` — field type mismatch (e.g. id is number, not string)
- `EXTRACTOR_ERROR` — extraction threw exception

**Record**: 
- On `!ok`: write to `cic-ingestion/dlq/failed-jobs.log` (append-only JSONL)
- Skip state mutation; process next entry
- Per-entry try/catch prevents one bad entry from aborting the rest

**DLQ Entry Schema**:
```json
{
  "dlqVersion": 1,
  "timestamp": "2026-07-06T14:30:00Z",
  "entry": { "id": "...", "source": "...", "payload": {...} },
  "reasonCode": "MISSING_FIELD",
  "reason": "entry.id is required",
  "replayCount": 0
}
```

**Replay**: Operator runs `dlqReplayer.ts` (manual CLI, not auto-scheduled):
```bash
npx ts-node cic-ingestion/src/ingestion/dlqReplayer.ts
```

Replayer re-runs extract + verify per entry:
- On recovery: write to `cic-ingestion/dlq/dlq-recovered.log`, remove from DLQ
- On repeat failure: increment persisted `replayCount` in DLQ entry
- When `replayCount >= 2` for same reasonCode: append lesson to `cic-ingestion/EXTRACTOR.md`

**File Rotation**: DLQ rotates to `failed-jobs.<YYYY-MM-DD>.log` when:
- File > 10MB, or
- Last modified > 30 days ago

Rotation checked at replayer startup, not scheduled separately.

---

## 2. Extractor Quality Loop

**Trigger**: Manual (npm script or nightly gate)  
**Find Work**: Load golden inputs from `rewrite-mcp/projects/cic/src/harvester/extractors/__fixtures__/golden-inputs.json`  
**Execute**: Run each input through `IExtractor` implementations:
- TextExtractor
- ImageAnalyzer
- SemanticExtractor
- RelationshipExtractor
- TopicExtractor

**Verify**: Validate output shape (expected fields present):
```json
{
  "extractor": "TextExtractor",
  "passed": 2,
  "failed": 0,
  "details": [
    { "goldenId": "text-001", "ok": true },
    { "goldenId": "text-002", "ok": true }
  ]
}
```

**Record**:
- Write per-run report to stdout (pass/fail per extractor)
- On repeated failures: append lesson to `rewrite-mcp/projects/cic/src/harvester/extractors/EXTRACTOR.md`

**Run Manually**:
```bash
cd rewrite-mcp/projects/cic
npm run verify:extractors
```

---

## 3. Nightly Regression Loop

**Trigger**: Manual (run-nightly.sh) or optional cron (requires `CIC_NIGHTLY_REGRESSION_ENABLED=true`)  
**Schedule** (if enabled): `0 3 * * *` (03:00 UTC daily)

**Find Work**: Three verification gates, running in parallel:

### Gate 1: Ingestion Verification
- Load test fixture (5-10 well-formed entries)
- Call `verifyIngestionEntry` per entry
- Status codes: `PASS` (all ok), `FAIL` (any !ok)

### Gate 2: Extractor Quality
- Run `npm run verify:extractors` (harvester package)
- Status codes: `PASS` (all pass), `FAIL` (any fail), `SERVICE_UNAVAILABLE` (npm script error)

### Gate 3: CIC Query
- Load golden queries from `src/harness/regression/cicQueryGolden.json`
- Call real `/search/cic-query` endpoint (TorqueQuery)
- Per query, compare primary match ID + score to baseline
- Status codes:
  - `PASS` — primary ID matches expected
  - `WARN` — ID drifted but score in `expected_score_range`
  - `FAIL` — score out of range or no results
  - `SERVICE_UNAVAILABLE` — endpoint threw (network error, not empty response)

**Record**:
- Write per-run artifacts to `logs/nightly/<timestamp>/`:
  - `gates.json` — structured gate results + success flag
  - `metrics.json` — pass/fail/warn/unavailable counts
  - `stdout.log` — human-readable summary
- File structure matches `roadmap-runner/scheduler.js` convention (logDir per run)

**Golden Query Fixture** (`src/harness/regression/cicQueryGolden.json`):
```json
[
  {
    "id": "golden-query-001",
    "query": "memory consolidation",
    "expected_primary_match_id": "memory-core-001",
    "expected_score_range": [0.75, 0.95]
  }
]
```

**Baselinig**: `expected_score_range` is set from real `/search/cic-query` response on first fixture creation (not guessed). Re-baseline manually when intentional ranking changes occur.

**Run Manually**:
```bash
npx ts-node src/harness/regression/nightly.ts
```

**Optional Cron** (requires setup in `AutonomyAPIServer.ts`):
```bash
CIC_NIGHTLY_REGRESSION_ENABLED=true npm run start:autonomy
```

If enabled, cron runs at `0 3 * * *` (03:00 UTC), uses same nightly.ts.

---

## 4. Error Codes Reference

### Ingestion Verification (reasonCode)

| Code | Meaning | Example |
|------|---------|---------|
| `MISSING_FIELD` | Required envelope field absent | entry.id is null |
| `BAD_TYPE` | Field type mismatch | entry.id is number, not string |
| `EXTRACTOR_ERROR` | Extraction threw exception | clientSessionExtractor threw |

### Nightly Gates (status)

| Status | Meaning |
|--------|---------|
| `PASS` | All checks passed |
| `WARN` | Some checks drifted but within acceptable range |
| `FAIL` | One or more checks failed (out of range, no results) |
| `SERVICE_UNAVAILABLE` | Gate infrastructure unavailable (endpoint down, npm script missing) |

---

## 5. Lessons & Debugging

### Ingestion EXTRACTOR.md
Path: `cic-ingestion/EXTRACTOR.md`

Auto-appended by dlqReplayer when a reasonCode reaches replayCount >= 2:
```markdown
## 2026-07-07 — MISSING_FIELD: client_session entries with missing "source" field

**Fix:** Extend clientSessionExtractor fallback to infer source from entry.backend if source missing

**Why:** Certain legacy log formats omit the source field; extractor needs backward compat
```

### Harvester EXTRACTOR.md
Path: `rewrite-mcp/projects/cic/src/harvester/extractors/EXTRACTOR.md`

Auto-appended by verifyExtractors when golden input fails:
```markdown
## 2026-07-07 — TextExtractor: HTML entity handling

**Fix:** Sanitize input via html-entities library before tokenization

**Why:** Test fixture includes HTML entities; extractor crashes on malformed UTF-8
```

---

## 6. Deferred: Embedding & Drift Loop

**Status**: Not implemented Phase 26. Scheduled for future phase.

**Blocker**: `castironforge/cic-ingestion/src/vector/retrievalDriftDetector.ts` imports:
- `vectorLayer.ts` — missing source, only dist/.js exists
- `torqueQueryPlanner.ts` — missing source, only dist/.js exists

**Why Deferred**: Reconstructing TypeScript sources for compiled Qdrant layer requires reverse-engineering; Phase 26 scope focuses on ground-truth loops (ingestion + extractors + search). Embedding loop unblocks when:
1. Qdrant layer TypeScript sources are committed, or
2. Drift detection uses alternative approach (e.g. golden-embeddings JSON fixture + post-hoc comparison)

**Runnable Today**: `RetrievalDriftDetector.check()` works at runtime (compiled .js), but cannot be unit-tested or modified without the .ts source.

---

## 7. Corrected from Earlier Draft

Earlier aspirational design assumed infrastructure that does not exist in the actual codebase:

| Assumed | Reality | Correction |
|---------|---------|-----------|
| Message broker queue (RabbitMQ, Kafka) | File-based DLQ (JSONL append-only) | Use filesystem; operator-run replay |
| Crucible-style cross-model auditors | Harvester extractors (single IExtractor interface) | Separate extractor types; per-extractor validation |
| `cic-observability.ts` as real telemetry | Console mock (stubs); metrics via `ResilientMetricsCollector` | Use `GET /metrics` endpoint for production metrics |
| `governance-playbook.md` runbook (nonexistent) | None; state in daemon + driftEngine | Document pragmatic operator actions in EXTRACTOR.md lessons |

These corrections ensure loops are grounded in actual running code, not aspirational architecture.

---

## 8. Integration with Autonomy API

All three loops run independently from `AutonomyAPIServer`. They are **not** exposed as HTTP endpoints; they are CLI/scheduled tools.

**Server Role**: Provides infrastructure loops depend on:
- `/search/cic-query` endpoint (nightly gate 3 target)
- `/autonomy/execution/*` for fire-drills (unrelated, but co-located)
- `/metrics` endpoint (Prometheus metrics for external monitoring, not used by loops)

**Server Startup** (unchanged):
```bash
npm run start:autonomy
# Starts on port 3000, ready for nightly.ts queries
```

**Cron Integration** (optional, requires setup):
```typescript
// In AutonomyAPIServer.ts setupCronSchedules()
if (process.env.CIC_NIGHTLY_REGRESSION_ENABLED === 'true') {
  cron.schedule('0 3 * * *', async () => {
    // Run nightly.ts
  });
}
```

Currently disabled by default (mirrors `CIC_PDF_REPORTS_ENABLED` pattern).

---

## 9. Operational Checklist

**Before Phase 26 Verification**:

- [ ] Ingestion daemon running (npm start:daemon)
- [ ] Autonomy API running (npm start:autonomy) — required for nightly gate 3
- [ ] Golden fixtures created + baselined:
  - `cic-ingestion/src/ingestion/__fixtures__/test-entries.jsonl` (optional; using mock in harness)
  - `rewrite-mcp/projects/cic/src/harvester/extractors/__fixtures__/golden-inputs.json` ✅
  - `src/harness/regression/cicQueryGolden.json` ✅

**Manual Verification**:

```bash
# 1. Test ingestion verification
npm test -- cic-ingestion/src/ingestion/verify.test.ts

# 2. Test extractor quality
cd rewrite-mcp/projects/cic && npm run verify:extractors

# 3. Test nightly regression (requires API up)
npx ts-node src/harness/regression/nightly.ts

# 4. Test DLQ replayer (manual, with malformed + valid entries)
npx ts-node cic-ingestion/src/ingestion/dlqReplayer.ts
```

**CI/CD Integration**:
- `npm test` runs all suites; Phase 26 tests included
- `run-nightly.sh` calls `nightly.ts` (used by cron or manual invoke)
- DLQ replayer operator-run only; not in CI

---

## 10. Files Created (Phase 26)

**Ingestion Layer**:
- `cic-ingestion/src/ingestion/verify.ts` — verification logic + error codes
- `cic-ingestion/src/ingestion/dlqReplayer.ts` — replay CLI
- `cic-ingestion/src/ingestion/daemon.ts` — extended with verify + DLQ
- `cic-ingestion/EXTRACTOR.md` — lessons file (auto-appended)
- `cic-ingestion/dlq/failed-jobs.log` — created on first failure

**Harvester Layer**:
- `rewrite-mcp/projects/cic/src/harvester/extractors/verifyExtractors.ts` — harness
- `rewrite-mcp/projects/cic/src/harvester/extractors/__fixtures__/golden-inputs.json` ✅
- `rewrite-mcp/projects/cic/src/harvester/extractors/EXTRACTOR.md` — lessons file

**Nightly Layer**:
- `src/harness/regression/nightly.ts` — three gates + artifact writing
- `src/harness/regression/cicQueryGolden.json` ✅
- `run-nightly.sh` — unchanged (now points at real nightly.ts)

---

## 11. Success Criteria

Phase 26 loop layer is production-ready when:

1. ✅ All 5 TypeScript files written + no compilation errors
2. ✅ Ingestion verify passes existing test suite + new per-reasonCode assertions
3. ✅ DLQ replayer rotates files, persists replayCount, appends lessons
4. ✅ verifyExtractors runs against golden-inputs.json, reports per-extractor pass/fail
5. ✅ nightly.ts runs three gates in parallel, writes gates.json + metrics.json
6. ✅ mkdocs build --strict passes (runbook doc added to nav)
7. ✅ Manual E2E: run nightly.ts with API up/down, confirm SERVICE_UNAVAILABLE handling
8. ✅ No fictional infrastructure referenced; only actual running code

---

**Last Updated**: 2026-07-06  
**Phase**: 26 Loop Layer  
**Status**: Ready for Verification
