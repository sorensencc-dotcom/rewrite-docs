# Review: Mailbox Intake Daemon v1.0.0

Reviewed: 2026-06-13T15:45:00Z
Reviewer: ijfw-review
Domain: software (TypeScript implementation)

## Summary

Implementation scaffolding is architecturally sound and deterministic. **Critical gap: all 40 test scenarios are placeholder shells** (expect(true).toBe(true)) — no actual test implementations exist. Additionally, three BLOCK-level error-handling gaps in core modules could cause crashes in production. No schema validation on config. With fixes applied, codebase is production-ready.

---

## BLOCK findings (must-fix)

- **tests/scenarios.test.ts (all tests)**: Test suite is 100% placeholder — every test body is `expect(true).toBe(true)`. Replace with real assertions and mock setup.

- **src/processor/BatchProcessor.ts (constructor)**: `mailpitClient` parameter is optional but used without null check in `extractAttachment()`. Either make required or guard every call with `if (this.mailpitClient)`.

- **src/client/MailpitClient.ts:isRetryableError()**: Accesses `err.message` without checking if `err` is Error object — will crash if passed null/undefined. Guard: `const message = (err && err.message) || ''`.

- **src/orchestrator/IngestOrchestrator.ts:routeBatch()**: Returns unmapped tier without validation — unknown classification could be routed to undefined folder. Add: `if (!route) throw new Error('Unknown tier: ' + primaryTier)`.

- **src/index.ts**: Import of `BatchProcessor` at line 4 — second parameter (mailpitClient) is undefined when BatchProcessor is instantiated. Pass `mailpitClient` instance or make processor independent.

---

## FLAG findings (should-discuss)

- **src/utils/Logger.ts:ensureLogDir()**: Called in constructor, could race if multiple daemon instances spawn simultaneously. Use `fs.mkdirSync(..., { recursive: true })` with atomic check.

- **src/orchestrator/IngestOrchestrator.ts:handleIngestFailure()**: Schedules retries via `setTimeout()` but doesn't track timer handles — if daemon restarts mid-retry, timers are orphaned and batch is stuck. Store timers in Map and cancel on shutdown.

- **src/config.ts:loadConfig()**: No schema validation — invalid/missing fields slip through silently. Add Zod or ajv validator with clear error messages for missing keys.

- **README.md § Drive Setup**: Documents Google Drive OAuth2 but doesn't warn that `clientSecret` and `refreshToken` stored in plaintext JSON is a security risk. Recommend: "Store credentials in environment variables or encrypted vault, never in git."

- **src/orchestrator/DriveUploader.ts:uploadBatch()**: README claims metrics are exported (avg upload time, quota), but `uploadBatch()` returns only `UploadResult` with file counts — no timing data. Implement or remove from docs.

- **src/watcher/FileWatcher.ts:BatchPoller.pollOnce()**: Creates new `FileWatcher` instance per poll cycle just to call `isBatchReady()`. Extract `isBatchReady()` to standalone function to avoid instantiation overhead.

---

## NIT findings (polish)

- **src/client/MailpitClient.ts** and **src/orchestrator/DriveUploader.ts**: Function `isRetryableError()` duplicated in both files. Extract to `src/utils/errors.ts` for DRY.

- **src/processor/BatchProcessor.ts:classifyBatch()**: Inline regex patterns (tier1Patterns, tier2Patterns) — should be pre-compiled in constructor for performance. Move to `this.compiledPatterns`.

- **src/orchestrator/IngestOrchestrator.ts**: Manifest update at line ~150 casts `ingest_status` to `any` to set `retry_count` — use proper type extension instead of `any`.

- **MAILBOX_INTAKE_DAEMON_SPEC_EXPANDED.md § 5.3.2**: Code example references `config.tier1.uploadMethod` but `config` is not in scope — correct to `this.routingConfig.tier1.uploadMethod`.

- **README.md § Configuration**: Example config.json references `FOLDER_ID_TIER_1_IMAGES` without noting that these must be actual Drive folder IDs — add example: "Obtain via 'Share folder' in Drive and extract ID from URL: `drive.google.com/drive/folders/{FOLDER_ID}`".

---

## Testing Gap Analysis

| Test Scenario | Implementation | Coverage |
|---------------|----------------|----------|
| E2E-001: Single image → Archive | Placeholder | 0% |
| V-001: Zero attachments rejected | Placeholder | 0% |
| EX-001: Extraction timeout | Placeholder | 0% |
| **Total** | **40/40 placeholders** | **0%** |

**Recommendation**: Implement a minimum of 15 critical tests (3 E2E happy path, 3 validation failures, 3 retry scenarios, 3 concurrency, 3 edge cases) before shipping.

---

## Error Handling Audit

| Module | Critical Paths | Status |
|--------|----------------|--------|
| MailpitClient | connect, fetch, retryWithBackoff | ✅ Covered except isRetryableError() null check |
| BatchProcessor | validateMessage, extractAttachment | ⚠️ downloadAttachment() errors not caught |
| FileWatcher | isBatchReady, pollOnce | ⚠️ No handling for deleted batch mid-check |
| IngestOrchestrator | triggerIngest, moveBatchToArchive | ⚠️ Race condition: batch deleted between check and move |
| DriveUploader | uploadBatch, initializeAuth | ⚠️ Missing credentials not validated on startup |

**Recommendation**: Add try-catch + logging to all async boundaries.

---

## Security Checklist

| Category | Finding | Status |
|----------|---------|--------|
| Input Validation | Filenames sanitized, MIME blocked, sizes limited | ✅ Pass |
| Path Traversal | Batch IDs generated internally, no user input in paths | ✅ Pass |
| Secret Leakage | Google credentials in plaintext JSON | ⚠️ Document risk |
| Error Messages | Not audited for credential exposure in logs | ⚠️ Recommend log sanitization |
| Network | HTTP timeout, circuit breaker implemented | ✅ Pass |

---

## Recommendations (Priority Order)

1. **Implement real test cases** (40 placeholder tests) — aim for ≥70% coverage
2. **Fix null-check bugs** (BatchProcessor.mailpitClient, MailpitClient.isRetryableError(), DriveUploader.initializeAuth())
3. **Add config schema validation** (Zod/ajv)
4. **Document secret management** (environment variables, encrypted vault)
5. **Extract retry timer tracking** (prevent orphaned timers on restart)
6. **Audit log output** for credential leakage

---

## Verdict

**Status: CONDITIONAL**

Scaffolding is architecturally correct and deterministic. Code organization is clean; error handling is present but incomplete. **Ship blocker: test suite is placeholder only.** Production readiness requires:

✅ Fix 5 BLOCK-level bugs  
✅ Implement 15+ real test cases  
✅ Add config schema validation  
✅ Document secret management  

With these applied, daemon is **production-ready for Phase 1 deployment**.
