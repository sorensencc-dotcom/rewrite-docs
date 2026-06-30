# docs-manager → CIC Ingestion Export Contract

**Version:** 1.0.0  
**Last Updated:** 2026-06-30  
**Status:** Locked (schema immutable until v2.0.0)

---

## Overview

docs-manager exports semantic audit and sync events as JSONL to a single file. CIC ingestion consumes this file in a deterministic, replay-safe manner.

**Producer:** docs-manager service  
**Consumer:** cic-ingestion (`docsManagerJob.ts`)  
**Transport:** JSONL (JSON Lines) over filesystem  
**Consumption:** Append-only; ingestion tracks last offset in state.

---

## Export Paths

All paths relative to project root.

| Event Type      | Path                                      | Mode          |
|-----------------|-------------------------------------------|---------------|
| audit.json      | `C:\dev\docs-manager\out\audit.json`      | Overwrite     |
| drift.json      | `C:\dev\docs-manager\out\drift.json`      | Overwrite     |
| sync.json       | `C:\dev\docs-manager\out\sync.json`       | Overwrite     |
| consolidation   | `C:\dev\docs-manager\out\consolidation.json` | Overwrite |
| **All events**  | `C:\dev\cic-ingestion\logs\docs_manager.jsonl` | Append-only |

**Production mapping:** Replace `C:\dev` with `$PROJECT_ROOT` or env var `$CIC_PROJECT_ROOT`.

---

## JSONL Schema

Each line is a single DocsManagerEvent. No newlines within JSON objects.

### DocsManagerEvent (Union Type)

```typescript
type DocsManagerEvent = 
  | AuditEvent
  | DriftEvent
  | SyncEvent
  | ConsolidationEvent;

interface DocsManagerEventEnvelope {
  schemaVersion: "1.0.0";
  type: "audit" | "drift" | "sync" | "consolidation";
  timestamp: number; // milliseconds since epoch
  sequenceId: number; // incremental; tracks producer ordering
}
```

---

## Event Schemas

### 1. AuditEvent

Emitted when docs-manager scans documentation for schema/format violations.

```typescript
interface AuditEvent extends DocsManagerEventEnvelope {
  type: "audit";
  docId: string; // e.g. "doc:service-api:v1"
  path: string; // relative path in docs tree, e.g. "services/api/openapi.yaml"
  severity: "info" | "warning" | "error";
  message: string; // human-readable finding
  category: "schema" | "format" | "reference" | "coverage"; // audit type
  details?: {
    expectedSchema?: string;
    actualValue?: string;
    suggestedFix?: string;
  };
}
```

**Example:**
```json
{"schemaVersion":"1.0.0","type":"audit","timestamp":1719734400000,"sequenceId":1,"docId":"doc:codeflow-api:v1","path":"specs/codeflow-openapi.yaml","severity":"error","category":"schema","message":"Missing required field 'operationId' in GET /analyze","details":{"expectedSchema":"OpenAPI 3.0","actualValue":"missing","suggestedFix":"Add operationId: analyzeDocs"}}
```

---

### 2. DriftEvent

Emitted when semantic similarity or reference drift is detected.

```typescript
interface DriftEvent extends DocsManagerEventEnvelope {
  type: "drift";
  docId: string;
  specId: string; // reference spec ID, e.g. "spec:codeflow-api:v1"
  path: string;
  driftType: "semantic" | "structural" | "reference";
  similarityScore: number; // 0.0–1.0; 1.0 = identical
  threshold: number; // configured threshold for this docId
  breached: boolean; // similarityScore < threshold
  changes?: string[]; // list of detected changes (optional)
}
```

**Example:**
```json
{"schemaVersion":"1.0.0","type":"drift","timestamp":1719734410000,"sequenceId":2,"docId":"doc:codeflow-api:v1","specId":"spec:codeflow-api:v1","path":"specs/codeflow-openapi.yaml","driftType":"semantic","similarityScore":0.87,"threshold":0.95,"breached":true,"changes":["endpoint /analyze renamed to /analyze-docs","parameter 'input' type changed from string to object"]}
```

---

### 3. SyncEvent

Emitted when docs-manager initiates a sync, promotion, or rollback.

```typescript
interface SyncEvent extends DocsManagerEventEnvelope {
  type: "sync";
  docId: string;
  syncType: "refresh" | "promotion" | "rollback";
  fromVersion: string; // e.g. "v1.2.3"
  toVersion: string;
  path: string;
  status: "initiated" | "in_progress" | "success" | "failed";
  duration?: number; // milliseconds (only on success/failed)
  errorMessage?: string; // if failed
  metadata?: {
    approverIds?: string[];
    changeLog?: string;
    rollbackOf?: number; // sequenceId of sync being rolled back
  };
}
```

**Example:**
```json
{"schemaVersion":"1.0.0","type":"sync","timestamp":1719734420000,"sequenceId":3,"docId":"doc:codeflow-api:v1","syncType":"promotion","fromVersion":"staging-20260630","toVersion":"v1.3.0","path":"specs/codeflow-openapi.yaml","status":"success","duration":2500,"metadata":{"approverIds":["user:chris"],"changeLog":"Added POST /analyze-docs endpoint; fixed schema drift in GET /status"}}
```

---

### 4. ConsolidationEvent

Emitted when docs-manager consolidates multiple docs into a canonical version.

```typescript
interface ConsolidationEvent extends DocsManagerEventEnvelope {
  type: "consolidation";
  consolidationId: string; // e.g. "cons:api-gateway:20260630"
  sourceDocIds: string[]; // docs being consolidated
  targetDocId: string; // canonical doc after consolidation
  status: "initiated" | "in_progress" | "success" | "failed";
  duration?: number;
  mergeStrategy: "semantic" | "structural" | "manual";
  conflictCount?: number; // unresolved conflicts (if any)
  metadata?: {
    rationale?: string;
    approverIds?: string[];
    errorDetails?: string; // if failed
  };
}
```

**Example:**
```json
{"schemaVersion":"1.0.0","type":"consolidation","timestamp":1719734430000,"sequenceId":4,"consolidationId":"cons:api-gateway:20260630","sourceDocIds":["doc:gateway-v1:legacy","doc:gateway-v2:current"],"targetDocId":"doc:gateway:canonical","status":"success","duration":5000,"mergeStrategy":"semantic","mergeConflictCount":0,"metadata":{"rationale":"Single source of truth for API gateway spec","approverIds":["user:chris"]}}
```

---

## JSONL Append Protocol

### Producer Responsibilities

1. **Atomic writes:** Write each event as a single line to `docs_manager.jsonl` before announcing completion.
2. **Sequence invariant:** `sequenceId` increments monotonically per event. No gaps.
3. **Timestamp ordering:** Events should be ordered by timestamp (loose; clock skew ±5s tolerated).
4. **Error on write failure:** If write fails, emit log + alert; do NOT skip sequence ID.
5. **Flush after line:** Ensure file is flushed after each newline. No buffering.

### Consumer Responsibilities

1. **Last offset tracking:** Store last-seen `sequenceId` in `cic-ingestion/state/docs_manager_state.json`.
2. **Replay safety:** On restart, resume from `lastSeenSequenceId + 1`. Drop duplicates.
3. **Malformed line handling:** Log + skip; continue from next line. Count skips in metrics.
4. **Interval polling:** Read file every 30s (configurable). Append-only, no truncation.

**State file format:**
```json
{
  "lastSeenSequenceId": 42,
  "lastProcessedTimestamp": 1719734430000,
  "lastUpdated": "2026-06-30T12:34:56Z",
  "eventsProcessed": 42,
  "eventsSkipped": 0
}
```

---

## Versioning & Breaking Changes

**Current:** `schemaVersion: "1.0.0"`

**How to evolve:**
- **Non-breaking** (new optional field in event): Keep `schemaVersion: "1.0.0"`
- **Breaking** (remove field, change type, new required field): Bump to `"2.0.0"`
  - Producer emits both v1 and v2 events for 30 days (migration window).
  - Consumer reads both; logs deprecation warning for v1.

---

## Validation & Testing

### Producer Validation

Before writing to JSONL:
1. `timestamp` is within ±5s of `Date.now()`
2. `sequenceId` > previous event's sequenceId
3. All required fields present and typed correctly
4. `severity`, `syncType`, `mergeStrategy` are from enum
5. `similarityScore` is 0.0–1.0 if present

### Consumer Validation

On read:
1. Parse line as JSON; skip on error.
2. Check `schemaVersion` is `"1.0.0"` or `"2.0.0"`.
3. Check `type` is one of four event types.
4. Check `sequenceId > lastSeenSequenceId`; skip if not.
5. Validate `timestamp` is reasonable (within ±1 day of now).

### Example Test Cases

```typescript
// Producer: audit event
{"schemaVersion":"1.0.0","type":"audit","timestamp":1719734400000,"sequenceId":1,"docId":"doc:api:v1","path":"openapi.yaml","severity":"error","category":"schema","message":"Missing operationId"}

// Consumer: rejects malformed JSON
{invalid json
// → logs "malformed line at offset X", skips, continues

// Consumer: rejects duplicate sequenceId
{"schemaVersion":"1.0.0","type":"drift",...,"sequenceId":10}
{"schemaVersion":"1.0.0","type":"drift",...,"sequenceId":10}  
// → second line skipped, logged as duplicate

// Consumer: rejects future-dated event
{"schemaVersion":"1.0.0","type":"audit",...,"timestamp":9999999999999}
// → skipped, logged as invalid timestamp
```

---

## Deployment Checklist

- [ ] docs-manager exports to `C:\dev\docs-manager\out\*.json` on every scan/sync/consolidation
- [ ] `docs_manager.jsonl` JSONL appender configured in docs-manager
- [ ] CIC ingestion consumes from `C:\dev\cic-ingestion\logs\docs_manager.jsonl`
- [ ] State file `C:\dev\cic-ingestion\state\docs_manager_state.json` initialized
- [ ] Ingestion job runs every 30s
- [ ] /metrics endpoint returns `docsManager` block (audits, drift, lastSync)
- [ ] Monitoring alerts on `eventsSkipped > 0`
- [ ] Docs updated in runbook with troubleshooting (missing file, parse errors, drift alerts)

---

## Rollback & Disaster

**If JSONL gets corrupted:**
1. Pause ingestion job.
2. Restore `docs_manager.jsonl` from backup (hourly snapshots recommended).
3. Reset `docs_manager_state.json` to `lastSeenSequenceId: 0`.
4. Resume ingestion job.

**If docs-manager export hangs:**
1. Alert fires on no new events for 5 minutes.
2. Operator investigates docs-manager logs.
3. If stuck, force-kill docs-manager process and restart.
4. Next export continues from `lastSeenSequenceId + 1` (no data loss).

---

## Reference

- Producer: `docs-manager/index.ts` → `emitDocsManagerEvent(event)`
- Consumer: `cic-ingestion/src/ingestion/jobs/docsManagerJob.ts`
- State: `cic-ingestion/state/docs_manager_state.json`
- Spec version: locked until next breaking change
