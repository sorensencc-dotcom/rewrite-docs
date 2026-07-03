# Documentation Index

Complete reference for Mailbox Intake Daemon v1.0.0.

---

## Quick Start

**New to this project?** Start here:

1. [README.md](../README.md) — 5-min overview + key concepts
2. [ARCHITECTURE.md](ARCHITECTURE.md) — How it works (diagrams)
3. [DEPLOYMENT.md](DEPLOYMENT.md) — Get it running

---

## Documentation by Role

### Developers (Implementation + Testing)

- **API.md** — All TypeScript interfaces, classes, methods
- **ARCHITECTURE.md** — System design, module dependencies, data flow
- **../REVIEW.md** — Code quality findings (5 BLOCK items to fix)
- **../tests/scenarios.test.ts** — 40 test scenarios (currently placeholders)

### Operations (Deployment + Monitoring)

- **DEPLOYMENT.md** — Full deployment guide + checklist
- **../README.md § Monitoring** — Metrics, alerts, logs
- **../README.md § Troubleshooting** — Common issues + fixes

### Architects (Design + Scaling)

- **ARCHITECTURE.md** — Complete system design
- **ARCHITECTURE.md § Future Extensibility** — Adding features/tiers/nodes
- **../MAILBOX_INTAKE_DAEMON_SPEC_EXPANDED.md** — Detailed specification

---

## File Structure

```
mailbox-intake-daemon/
├── src/
│   ├── index.ts                    Entry point (main)
│   ├── config.ts                   Configuration loader
│   ├── client/MailpitClient.ts    Mailpit API polling
│   ├── processor/BatchProcessor.ts Validation + extraction
│   ├── watcher/FileWatcher.ts     File watching + polling
│   ├── orchestrator/
│   │   ├── IngestOrchestrator.ts  Routing + orchestration
│   │   └── DriveUploader.ts       Google Drive upload
│   └── utils/
│       ├── Logger.ts              Structured logging
│       ├── CircuitBreaker.ts      Failure isolation
│       └── sanitize.ts            Filename validation
│
├── tests/
│   └── scenarios.test.ts           40 test scenarios
│
├── docs/                           Auto-generated docs
│   ├── INDEX.md                    This file
│   ├── API.md                      TypeScript reference
│   ├── ARCHITECTURE.md             System design
│   └── DEPLOYMENT.md               Deployment guide
│
├── README.md                       Setup + troubleshooting
├── REVIEW.md                       Code quality audit
├── IMPLEMENTATION_SUMMARY.md       Deliverables overview
├── config.example.json             Configuration template
├── package.json                    Dependencies
├── tsconfig.json                   TypeScript config
└── jest.config.js                 Test config
```

---

## Core Concepts

### Batch

A single email's attachments, packaged for processing.

**Lifecycle:** Mailpit → pending/ → archive/ or rejected/

**Manifest:** `pending/{batchId}/manifest.json` (JSON document with metadata)

### Tier

Classification of attachment types:

- **Tier 1** — Images (.jpg, .png, .gif, .heic) → Drive tier-1-images
- **Tier 2** — Documents (.pdf, .docx, .xlsx) → Drive tier-2-research
- **Tier 3** — Other (.txt, .log) → Local cold storage

### Polling

Daemon queries Mailpit every 5000ms for unread messages.

### Extraction

Download attachments from Mailpit (3 concurrent, 15s timeout each).

### Classification

Auto-classify by file extension + confidence scoring.

### Ingest

Route batch by tier → upload files → archive or retry.

---

## Key Interfaces

| Interface | Location | Purpose |
|-----------|----------|---------|
| MailpitPoolConfig | API.md | Mailpit connection settings |
| ValidationConfig | API.md | Validation rules (MIME, size, patterns) |
| ClassificationConfig | API.md | Classification patterns (Tier 1/2/3) |
| FileWatcherConfig | API.md | File watcher settings (debounce, polling) |
| RoutingConfig | API.md | Batch routing (tier destinations) |
| DriveConfig | API.md | Google Drive credentials |
| BatchManifest | API.md | Batch metadata (persistent JSON) |
| DaemonConfig | API.md | Full daemon configuration |

---

## APIs & Methods

### MailpitClient

- `connect()` — Verify API reachable
- `startPolling(callback)` — Begin polling loop
- `downloadAttachment(msgId, partId)` → Buffer
- `markMessageRead(msgId)` → void

### BatchProcessor

- `processMessage(msg)` → Batch (validate → extract → classify)

### FileWatcher

- `start(callback)` — Begin watching for manifest.json
- `stop()` — Stop watcher
- `isBatchReady(dir)` → boolean

### IngestOrchestrator

- `triggerIngest(batchDir)` → void (route → upload → archive)

### DriveUploader

- `uploadBatch(dir, manifest, folderId)` → UploadResult

---

## Configurations & Defaults

### Polling

```json
{
  "mailpit": {
    "baseUrl": "http://localhost:8025",
    "pollIntervalMs": 5000,
    "maxMessagesPerPoll": 50
  }
}
```

### Validation

```json
{
  "validation": {
    "requireAttachments": true,
    "maxAttachments": 100,
    "maxTotalSizeMb": 500,
    "maxAttachmentSizeMb": 100
  }
}
```

### Classification

```json
{
  "classification": {
    "tier1Patterns": ["\\.jpg$", "\\.png$", "\\.gif$"],
    "tier2Patterns": ["\\.pdf$", "\\.docx$", "\\.xlsx$"],
    "tier3Patterns": ["\\.txt$", "\\.log$"]
  }
}
```

See `config.example.json` for full configuration.

---

## Error Handling

| Error Type | Cause | Handling |
|-----------|-------|----------|
| MailpitConnectionError | API unreachable | Circuit breaker → retry |
| ValidationError | Invalid attachment | Move to rejected/ |
| ExtractionTimeoutError | Download timeout | Mark failed, continue |
| UploadError | Drive/network failure | Retry with exponential backoff |
| ConfigError | Invalid config | Exit with error message |

---

## Logging

### Log Locations

- **Daemon:** `logs/daemon.log` (all main events)
- **Components:** `logs/{Component}.log` (MailpitClient, BatchProcessor, etc.)
- **Batches:** `pending/{batchId}/intake.log` (append-only JSON lines)

### Log Format

```json
{"timestamp":"2026-06-13T10:30:45Z","level":"INFO","component":"MailpitClient","message":"Connected to Mailpit API"}
```

---

## Monitoring & Alerts

### Key Metrics

- Batches pending/in_progress/completed/failed
- Files uploaded (count + size)
- Average upload time
- Drive quota remaining
- Archival rate (batches/hour)

### Alert Conditions

- Mailpit API unreachable (circuit breaker opens)
- Batch stuck >30 minutes
- Validation failures (Slack alert)
- Drive quota low
- High error rate

See `README.md § Monitoring` for details.

---

## Deployment Paths

### Development

```bash
npm install
npm run dev
```

### Production (Windows Task Scheduler)

```bash
npm install && npm run build
# Register in Task Scheduler
# See DEPLOYMENT.md
```

### Production (Windows Service)

```bash
npm install && npm run build
# Install with NSSM
# See DEPLOYMENT.md
```

---

## Testing

### Run Tests

```bash
npm test
```

### Test Coverage

- 40 scenario skeletons (currently placeholders)
- Fix required: implement real assertions + mocks

### Expected Coverage

Target: 70%+ across all modules

---

## CI/CD Integration (Future)

```yaml
# .github/workflows/daemon.yml
- npm install
- npm run build
- npm test
- Deploy to production
```

---

## Troubleshooting Index

| Issue | Resolution | More Info |
|-------|-----------|-----------|
| Daemon won't start | Check config.json, Mailpit API | DEPLOYMENT.md |
| Batches stuck in pending/ | Check manifest, trigger manually | README.md |
| Drive upload fails | Verify credentials, quota, permissions | DEPLOYMENT.md |
| Circuit breaker stuck OPEN | Wait 60s or restart daemon | ARCHITECTURE.md |
| High error rate | Check logs, verify config | README.md § Monitoring |

---

## Performance Tuning

See DEPLOYMENT.md § Performance Tuning for:
- Polling interval
- Message batch size
- Concurrent uploads
- File debounce delay

---

## Security

### Credentials

- Google OAuth2: store in environment variables (not JSON)
- API keys: never commit to git
- Logs: sanitize to remove secrets

### Permissions

- Staging directory: restricted to daemon user
- Drive: use service account with minimal scope
- Logs: readable by operations team only

---

## Scaling & Extensions

See ARCHITECTURE.md § Future Extensibility for:

- Adding new upload methods (SFTP, S3, etc.)
- Adding new classification tiers
- Distributed processing (multi-node)
- ML-based classification

---

## Support & Links

- **Bug reports:** See REVIEW.md (findings) or GitHub issues
- **Feature requests:** Add to ARCHITECTURE.md § Future Extensibility
- **Questions:** Check FAQ in README.md
- **Examples:** See `config.example.json`, `tests/scenarios.test.ts`

---

## Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| README.md | 1.0.0 | 2026-06-13 |
| API.md | 1.0.0 | 2026-06-13 |
| ARCHITECTURE.md | 1.0.0 | 2026-06-13 |
| DEPLOYMENT.md | 1.0.0 | 2026-06-13 |
| REVIEW.md | 1.0.0 | 2026-06-13 |
| IMPLEMENTATION_SUMMARY.md | 1.0.0 | 2026-06-13 |

---

**Generated:** 2026-06-13  
**Project:** Mailbox Intake Daemon v1.0.0  
**Status:** Production-ready (pending REVIEW.md fixes)
