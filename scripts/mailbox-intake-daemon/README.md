# Mailbox Intake Daemon v1.0.0

Deterministic email-to-research-intake pipeline. Polls Mailpit, validates, classifies, extracts, and ingests attachments into tiered archive (Drive + local cold storage).

## Architecture

```
Mailpit (polling)
    ↓
MailpitClient (5000ms interval)
    ↓
BatchProcessor (validation + extraction)
    ↓
FileWatcher (manifest.json debounce)
    ↓
IngestOrchestrator (routing + upload)
    ↓
Archive (Drive Tier 1/2 + local Tier 3)
```

## Installation

```bash
npm install
npm run build
```

## Configuration

Copy `config.example.json` to `config.json` and customize:

```json
{
  "mailpit": {
    "baseUrl": "http://localhost:8025",
    "pollIntervalMs": 5000
  },
  "validation": {
    "requireAttachments": true,
    "maxAttachmentSizeMb": 100
  },
  "routing": {
    "tier1": { "destination": "DRIVE_FOLDER_ID_TIER_1", "uploadMethod": "drive-api" },
    "tier2": { "destination": "DRIVE_FOLDER_ID_TIER_2", "uploadMethod": "drive-api" },
    "tier3": { "destination": "C:\\research-intake\\cold", "uploadMethod": "local-copy" }
  }
}
```

### Google Drive Setup

1. Create Google Cloud project
2. Enable Drive API
3. Create OAuth2 credentials (Desktop app)
4. Get `clientId`, `clientSecret`, `refreshToken`
5. Create Drive folders for tier-1-images, tier-2-research
6. Add folder IDs to routing config

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Windows Task Scheduler

Create scheduled task:

```powershell
$taskAction = New-ScheduledTaskAction -Execute "C:\Program Files\nodejs\node.exe" `
  -Argument "C:\dev\scripts\mailbox-intake-daemon\dist\index.js" `
  -WorkingDirectory "C:\dev\scripts\mailbox-intake-daemon"

$taskTrigger = New-ScheduledTaskTrigger -AtStartup

Register-ScheduledTask -TaskName "Mailbox Intake Daemon" `
  -Action $taskAction -Trigger $taskTrigger -RunLevel Highest
```

## Directory Structure

```
C:\research-intake\
├── pending/          # Active batches (waiting for ingest)
├── archive/          # Processed batches
├── rejected/         # Validation failures
├── cold/             # Tier 3 local archive
└── logs/             # Daemon + batch logs
```

## Batch Lifecycle

### 1. Polling (Mailpit → Staging)

- Poll interval: 5000ms
- Max messages per poll: 50
- Unread messages only
- Circuit breaker: 5 failures → OPEN (60s reset)

### 2. Validation

- Require attachments
- Max 100 attachments per email
- Max 500MB total size
- Max 100MB per attachment
- Block MIME: application/x-exe, application/x-dll, ...
- Block filenames: *.exe, *.dll, *.sys, ...

### 3. Extraction

- Download attachments from Mailpit
- Timeout: 15s per file
- Parallel: 3 concurrent downloads
- Sanitize filenames (remove invalid chars, max 255 chars)
- Write to pending/{batchId}/

### 4. Classification

- **Tier 1** (images): .jpg, .png, .gif, .heic, etc. → Confidence 0.95
- **Tier 2** (documents): .pdf, .docx, .xlsx, etc. → Confidence 0.95
- **Tier 3** (other): .txt, .log, .bak, etc. → Confidence 0.5
- **Mixed** (Tier 1 + 2): Flagged for manual review

### 5. Manifest Generation

```json
{
  "batch_id": "batch-1718308800000-abc123",
  "sender": "research@example.com",
  "subject": "Research scan",
  "attachments": [
    {
      "fileName": "scan.jpg",
      "extractionStatus": "success",
      "mimeType": "image/jpeg",
      "sizeBytes": 512000,
      "tier": "tier-1"
    }
  ],
  "classification": {
    "primary_tier": "tier-1",
    "confidence": 0.95,
    "requires_manual_review": false
  },
  "ingest_status": {
    "status": "pending"
  }
}
```

### 6. File Watching

- Watch: C:\research-intake\pending\
- Trigger: manifest.json written
- Debounce: 500ms
- Fallback: Polling if watcher fails

### 7. Routing & Upload

| Tier | Destination | Method |
|------|-------------|--------|
| Tier 1 | Drive folder (tier-1-images) | Resumable upload |
| Tier 2 | Drive folder (tier-2-research) | Resumable upload |
| Tier 3 | Local C:\research-intake\cold | File copy |

### 8. Retry Logic

- Retryable errors: ECONNREFUSED, 503, 429, ETIMEDOUT
- Max retries: 5
- Backoff: exponential (2^n seconds)

### 9. Archive & Rotation

- Move batch to archive/ on success
- Rotation: Move to cold/ after 90 days
- Compression: GZIP on cold archive

## Intake Log Format

Append-only JSON lines (one event per line):

```json
{"timestamp":"2026-06-13T10:30:45Z","event":"batch_created","batchId":"batch-123","attachmentCount":3}
{"timestamp":"2026-06-13T10:30:50Z","event":"batch_classified","batchId":"batch-123","tier":"tier-1"}
{"timestamp":"2026-06-13T10:31:00Z","event":"ingest_completed","batchId":"batch-123","filesUploaded":3}
```

## MCP Tool Integration

### mailbox-intake-status

Returns current batch counts:

```json
{
  "pending": 5,
  "in_progress": 2,
  "completed": 87,
  "failed": 1,
  "total_bytes_archived": 512000000
}
```

### mailbox-intake-classify

Manually reclassify batch:

```json
{
  "batchId": "batch-123",
  "newTier": "tier-2",
  "reason": "Actually a PDF scan, not image"
}
```

### mailbox-intake-trigger-ingest

Force ingest for stuck batch:

```json
{
  "batchId": "batch-123"
}
```

### mailbox-intake-logs

Query intake logs:

```json
{
  "batchId": "batch-123",
  "eventType": "all",
  "limit": 50
}
```

## Monitoring

### Metrics

- Batches pending/in_progress/completed/failed
- Files uploaded (count + total size)
- Average upload time
- Drive quota remaining
- Archival rate (batches/hour)

### Alerts (Slack)

- Batch ready for review
- Validation failures
- Extraction timeout
- Upload failures
- Stuck batches (30+ min in pending)
- Drive quota low

### Logs

- daemon.log: Main daemon events
- BatchProcessor.log: Validation + extraction
- FileWatcher.log: File watching events
- IngestOrchestrator.log: Upload + archival

## Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
```

Test scenarios cover:

- E2E: Happy path flows (50 scenarios)
- Validation: Edge cases (10 scenarios)
- Extraction: Timeouts + failures (5 scenarios)
- Classification: All tiers + mixed (5 scenarios)
- File watching: Debounce + polling (5 scenarios)
- Routing: All upload methods (5 scenarios)
- Failure recovery: Retries + circuit breaker (10 scenarios)
- Concurrency: Race conditions (5 scenarios)

Total: **95 test scenarios** (parametrized)

## Production Readiness

- [x] Deterministic batch IDs (timestamp + hash)
- [x] Idempotent processing (duplicate detection)
- [x] Circuit breaker for API failures
- [x] Exponential backoff retry logic
- [x] Atomic state transitions
- [x] Comprehensive logging
- [x] Graceful shutdown (SIGTERM)
- [x] Auto-recovery on restart
- [x] Drive API resumable upload (large files)
- [x] Validation before any processing
- [x] Manual review flow for ambiguous batches

## Troubleshooting

### Daemon won't start

```bash
# Check config file exists and is valid JSON
cat config.json | jq .

# Check Mailpit is running
curl http://localhost:8025/api/v1/info

# Check staging root exists
ls -la C:\research-intake
```

### Batches stuck in pending/

```bash
# Trigger ingest manually via MCP tool
mailbox-intake-trigger-ingest --batchId batch-123

# Or check manifest for errors
cat C:\research-intake\pending\batch-123\manifest.json

# Check intake log
tail C:\research-intake\pending\batch-123\intake.log
```

### Drive upload fails

```bash
# Verify credentials in config.json
# Verify Drive folder IDs exist and daemon has access
# Check Drive quota: du -h C:\research-intake

# Retry stuck batch
mailbox-intake-trigger-ingest --batchId batch-123
```

### Circuit breaker stuck OPEN

- Mailpit unreachable
- Check Mailpit health: `curl http://localhost:8025/api/v1/info`
- Wait 60s for reset, or restart daemon

## Performance

- Polling: 5000ms interval, 50 msgs max → ~10 msgs/sec capacity
- Extraction: 3 concurrent downloads, 15s timeout → ~12 files/sec
- Upload: 3 concurrent Drive uploads → depends on file size
- Expected throughput: 50-100 batches/hour (depending on file sizes)

## Support

See MAILBOX_INTAKE_DAEMON_SPEC_EXPANDED.md for detailed specification.
