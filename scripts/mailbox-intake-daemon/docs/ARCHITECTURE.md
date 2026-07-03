# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAILBOX INTAKE DAEMON                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐                                            │
│  │   Mailpit API    │                                            │
│  │  (port 8025)     │                                            │
│  └────────┬─────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         MailpitClient (Polling + Circuit Breaker)        │   │
│  │  - Poll every 5000ms                                     │   │
│  │  - Max 50 unread messages per poll                       │   │
│  │  - Health check + retry with exponential backoff         │   │
│  │  - Circuit breaker: 5 failures → OPEN (60s reset)        │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      BatchProcessor (Validation + Extraction)             │   │
│  │  - Validate: MIME types, filenames, sizes                │   │
│  │  - Extract attachments (3 concurrent, 15s timeout)        │   │
│  │  - Classify: Tier 1/2/3 by extension + confidence        │   │
│  │  - Generate manifest.json + intake.log                    │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     Staging Filesystem (C:\research-intake\)             │    │
│  │                                                           │    │
│  │  pending/           ← Batches ready for ingest            │    │
│  │  ├─ batch-123/                                            │    │
│  │  │  ├─ file1.jpg    ← Extracted attachment                │    │
│  │  │  ├─ manifest.json                                       │    │
│  │  │  └─ intake.log    ← Append-only event log              │    │
│  │  └─ batch-456/                                            │    │
│  │                                                           │    │
│  │  archive/           ← Processed batches                   │    │
│  │  rejected/          ← Validation failures                 │    │
│  │  cold/              ← Tier 3 long-term storage            │    │
│  │  logs/              ← Daemon + batch logs                 │    │
│  └────────┬─────────────────────────────────────────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      FileWatcher (manifest.json detection)                │   │
│  │  - Watch for manifest.json in pending/                    │   │
│  │  - Debounce 500ms (ensure batch complete)                 │   │
│  │  - Fallback: polling every 5000ms if watcher fails        │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   IngestOrchestrator (Routing + Upload)                   │   │
│  │  - Route batch by tier (Tier 1/2 → Drive, Tier 3 → Local) │   │
│  │  - Execute upload (Drive API resumable or local copy)     │   │
│  │  - Retry failed uploads (exponential backoff, 5 max)      │   │
│  │  - Move batch to archive/ on success                      │   │
│  └────────┬──────────────────────────────────────┬───────────┘   │
│           │                                      │                │
│           ▼                                      ▼                │
│  ┌──────────────────────┐          ┌──────────────────────────┐  │
│  │   Google Drive API   │          │   Local Filesystem       │  │
│  │                      │          │   (cold storage)         │  │
│  │  tier-1-images/      │          │                          │  │
│  │  tier-2-research/    │          │  C:\research-intake\     │  │
│  │                      │          │  └─ cold/                │  │
│  └──────────────────────┘          └──────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
src/index.ts (entry point)
├── MailpitClient
│   ├── CircuitBreaker
│   ├── Logger
│   └── node-fetch
├── BatchProcessor
│   ├── MailpitClient
│   ├── Logger
│   ├── sanitizeFilename()
│   └── fs-extra
├── FileWatcher
│   ├── chokidar
│   ├── Logger
│   └── fs-extra
├── IngestOrchestrator
│   ├── DriveUploader
│   ├── Logger
│   ├── fs-extra
│   └── path
└── IngestOrchestrator
    └── DriveUploader
        ├── google-apis
        ├── Logger
        ├── p-queue
        └── fs-extra
```

---

## Data Flow: Happy Path

```
1. POLL (MailpitClient)
   Mailpit API → [unread messages] → onMessages callback

2. PROCESS (BatchProcessor)
   Message → validate → extract → classify → Batch manifest
   Write: C:\research-intake\pending\{batchId}\manifest.json
   Write: C:\research-intake\pending\{batchId}\intake.log
   Extract files to: C:\research-intake\pending\{batchId}\{files}

3. WATCH (FileWatcher)
   manifest.json detected → debounce 500ms → isReady check

4. INGEST (IngestOrchestrator)
   Manifest → route by tier → upload → update manifest → archive

5. ARCHIVE
   pending/{batchId} → archive/{batchId} (successful)
   pending/{batchId} → rejected/{batchId} (validation failure)
   archive/{batchId} → cold/{batchId} (90+ days old)
```

---

## Batch Lifecycle State Machine

```
         ┌──────────┐
         │ CREATED  │
         │(manifest)│
         └────┬─────┘
              │
              ▼
         ┌──────────┐
         │ PENDING  │ ← Waiting for ingest
         └────┬─────┘
              │
              ▼
    ┌─────────────────────┐
    │  VALIDATING ROUTE   │
    └────┬────────────┬───┘
         │            │
   (valid)      (invalid)
         │            │
         ▼            ▼
    ┌────────┐  ┌──────────┐
    │UPLOADING│  │ REJECTED │
    └────┬────┘  └──────────┘
         │
    ┌────┴─────────────┐
    │                  │
  (success)        (failure)
    │                  │
    ▼                  ▼
┌──────────┐      ┌──────────┐
│ ARCHIVED │      │ RETRY    │ ← Exponential backoff
└──────────┘      └────┬─────┘
                       │
                  (max 5 retries exceeded)
                       │
                       ▼
                  ┌──────────┐
                  │ FAILED   │
                  └──────────┘
```

---

## Failure Handling Strategies

### Circuit Breaker (Mailpit API Failures)

```
CLOSED → recordFailure() → count reaches 5 → OPEN
  ▲                                          │
  │                                   reject all calls
  │                          (timeout 60s)
  └────────────────────────────┬────────────┘
                               │
                            HALF_OPEN
                               │
                    recordSuccess() × 2
                               │
                               ▼
                            CLOSED
```

### Retry Logic (Upload Failures)

```
Attempt 1 → Fail (retryable)
           ↓ backoff 500ms
Attempt 2 → Fail (retryable)
           ↓ backoff 1000ms
Attempt 3 → Fail (retryable)
           ↓ backoff 2000ms
Attempt 4 → Fail (retryable)
           ↓ backoff 4000ms
Attempt 5 → Fail (retryable)
           ↓ backoff 8000ms
FAILED (mark non-retriable, manual intervention required)
```

### Validation Failures

```
Message arrives
   ↓
validate() → errors found
   ↓
Move to rejected/{batchId}
   ↓
Write rejection.json + intake.log
   ↓
Alert Slack (optional)
```

---

## Threading & Concurrency Model

### Single-Threaded Event Loop (Node.js)

```
Main Thread (Event Loop)
├── Polling interval (setTimeout 5000ms)
├── File watcher (chokidar events)
├── Upload queue (p-queue, 3 concurrent)
└── Retry timeouts (setTimeout with exponential backoff)

No shared mutable state across promises.
All state updates are atomic (manifest write, directory moves).
```

### Concurrency Limits

| Operation | Max Concurrent | Reason |
|-----------|----------------|--------|
| Extraction | 3 | Mailpit download bandwidth |
| Upload | 3 | Drive API quota |
| Polling | 1 | Sequential, 5000ms interval |
| File watching | 1 | Debounce per batch |

---

## Performance Characteristics

### Polling

- **Interval:** 5000ms
- **Throughput:** ~10 msgs/sec (50 msgs × 1/5s)
- **Latency:** 5000ms average (5s poll interval)

### Extraction

- **Concurrent:** 3 files
- **Timeout:** 15s per file
- **Throughput:** ~12 files/sec (3 concurrent)

### Upload

- **Concurrent:** 3 uploads
- **Timeout:** 300s per upload
- **Throughput:** depends on file size + network

### Expected End-to-End

| Batch Size | Extraction | Upload | Total |
|------------|-----------|--------|-------|
| 3 files × 10MB | 5s | 10s | 15s |
| 10 files × 10MB | 15s | 30s | 45s |
| 50 files × 10MB | 60s | 120s | 180s |

---

## Configuration Propagation

```
config.json
    ↓
loadConfig()
    ↓
DaemonConfig object
    ├─ MailpitPoolConfig → MailpitClient
    ├─ ValidationConfig → BatchProcessor
    ├─ ClassificationConfig → BatchProcessor
    ├─ FileWatcherConfig → FileWatcher
    ├─ RoutingConfig → IngestOrchestrator
    └─ DriveConfig → DriveUploader
```

---

## Logging Architecture

```
Events
  ├── daemon.log (main process events)
  ├── MailpitClient.log (polling + API)
  ├── BatchProcessor.log (validation + extraction)
  ├── FileWatcher.log (watching + polling fallback)
  ├── IngestOrchestrator.log (routing + upload)
  └── DriveUploader.log (Drive API)

Batch Logs
  └── {batchId}/intake.log (append-only JSON lines)
      ├── batch_created
      ├── batch_classified
      ├── ingest_triggered
      ├── extraction_completed
      ├── ingest_completed
      └── (optional) ingest_failed / retry_scheduled
```

---

## Storage Layout

```
C:\research-intake\
├── pending/                 (active batches)
│   ├── batch-001/
│   │   ├── file1.jpg
│   │   ├── manifest.json
│   │   └── intake.log
│   └── batch-002/
│
├── archive/                 (processed, <90 days)
│   ├── batch-001/
│   └── batch-002/
│
├── rejected/                (validation failures)
│   ├── batch-badx/
│   │   ├── rejection.json
│   │   └── intake.log
│   └── ...
│
├── cold/                    (Tier 3, >90 days)
│   ├── batch-old1/
│   └── batch-old2/
│
└── logs/                    (daemon logs)
    ├── daemon.log
    ├── MailpitClient.log
    ├── BatchProcessor.log
    └── ...
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Polling over IMAP | Simpler integration, Mailpit API stability |
| File watcher + polling fallback | Resilient to watcher failures |
| Circuit breaker on Mailpit API | Prevent cascading failures, auto-recovery |
| Exponential backoff retry | Reduce load during transient failures |
| Append-only intake logs | Auditability, debugging, no race conditions |
| Deterministic batch IDs | Idempotency, reproducibility |
| Three-tier classification | Flexibility (can add more tiers later) |
| Local staging + Drive sync | Works offline, simple consistency model |

---

## Future Extensibility

### Add New Upload Method

```typescript
// In IngestOrchestrator.executeUpload()
case 'sftp':
  return this.executeSftpUpload(batchDir, manifest, route);
```

### Add New Classification Tier

```typescript
// In config.json
"tier4Patterns": ["\\.pst$", "\\.eml$"]

// In BatchProcessor.classifyBatch()
else if (tier4Count > 0) {
  primaryTier = 'tier-4';
}
```

### Add Distributed Processing

```typescript
// Separate polling node → publish to queue
// Separate processing node → subscribe to queue
// Shared state store (Redis/DB) for batch status
```

### Add ML Classification

```typescript
// Replace heuristic classifier with ML model
// Tier confidence from model probability
// Manual review threshold configurable
```
