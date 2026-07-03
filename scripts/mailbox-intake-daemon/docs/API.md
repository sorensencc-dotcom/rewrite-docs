# Mailbox Intake Daemon — API Reference

Auto-generated from TypeScript interfaces.

---

## MailpitClient

**File:** `src/client/MailpitClient.ts`

### Interface: MailpitPoolConfig

```typescript
interface MailpitPoolConfig {
  baseUrl: string;                    // http://localhost:8025
  timeout_ms: number;                 // Request timeout (30000)
  maxConnections: number;             // Concurrent connections (5)
  maxRetries: number;                 // Retry attempts (3)
  retryBackoffMs: number;             // Backoff delay (500)
  healthCheckIntervalMs: number;      // Health check frequency (30000)
  circuitBreakerThreshold: number;    // Failure threshold (5)
  circuitBreakerResetMs: number;      // Reset timeout (60000)
  pollIntervalMs: number;             // Poll frequency (5000)
  maxMessagesPerPoll: number;         // Max messages per poll (50)
}
```

### Interface: MailpitMessage

```typescript
interface MailpitMessage {
  id: string;                         // Unique message ID
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  cc?: { address: string; name: string }[];
  subject: string;
  text: string;                       // Plain text body
  html?: string;                      // HTML body
  inReplyTo?: string;
  messageId: string;
  date: string;                       // ISO-8601 timestamp
  attachments: MailpitAttachment[];
  read: boolean;
  tags: string[];
}
```

### Interface: MailpitAttachment

```typescript
interface MailpitAttachment {
  partID: string;                     // MIME part ID
  fileName: string;
  mimeType: string;                   // e.g., "image/jpeg"
  size: number;                       // Bytes
}
```

### Class: MailpitClient

```typescript
class MailpitClient {
  constructor(config: MailpitPoolConfig);
  async connect(): Promise<void>;
  async healthCheck(): Promise<boolean>;
  startPolling(onMessages: (messages: MailpitMessage[]) => Promise<void>): PollingHandle;
  async downloadAttachment(messageId: string, partId: string): Promise<Buffer>;
  async markMessageRead(messageId: string): Promise<void>;
}
```

**Methods:**

- `connect()` — Verify Mailpit API is accessible. Throws on failure.
- `healthCheck()` — Check API availability. Returns true if reachable.
- `startPolling(callback)` — Begin polling loop. Calls callback with new unread messages.
- `downloadAttachment()` — Download attachment bytes from Mailpit.
- `markMessageRead()` — Mark message as read in Mailpit.

---

## BatchProcessor

**File:** `src/processor/BatchProcessor.ts`

### Interface: ValidationConfig

```typescript
interface ValidationConfig {
  requireAttachments: boolean;        // Fail if no attachments
  maxAttachments: number;             // Max attachment count (100)
  maxTotalSizeMb: number;             // Max total size (500)
  maxAttachmentSizeMb: number;        // Max per-file size (100)
  blockedMimeTypes: string[];         // e.g., ["application/x-exe"]
  blockedFilePatterns: string[];      // Regex patterns, e.g., ["\\.exe$"]
  stagingRoot: string;                // C:\research-intake
}
```

### Interface: ClassificationConfig

```typescript
interface ClassificationConfig {
  tier1Patterns: string[];            // Image extensions
  tier2Patterns: string[];            // Document extensions
  tier3Patterns: string[];            // Other extensions
}
```

### Interface: ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];                   // Validation failures
  warnings: string[];                 // Non-blocking issues
}
```

### Interface: ExtractedAttachment

```typescript
interface ExtractedAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;                       // Local file path
  extractedAt: string;                // ISO-8601
  extractionStatus: 'success' | 'failed' | 'timeout';
  tier?: string;                      // Classification tier
  confidence?: number;                // 0.0-1.0
}
```

### Interface: BatchManifest

```typescript
interface BatchManifest {
  batch_id: string;                   // Unique ID
  sender: string;                     // Email address
  recipient: string;
  subject: string;
  body?: string;
  message_date: string;               // ISO-8601
  created_at: string;
  attachments: ExtractedAttachment[];
  validation: ValidationResult;
  classification: {
    primary_tier: string;             // 'tier-1', 'tier-2', 'tier-3'
    confidence: number;               // 0.0-1.0
    reasoning: string;
    flagged: boolean;
    requires_manual_review: boolean;
  };
  ingest_status: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    started_at?: string;
    completed_at?: string;
    error?: string;
  };
}
```

### Class: BatchProcessor

```typescript
class BatchProcessor {
  constructor(
    validationConfig: ValidationConfig,
    classificationConfig: ClassificationConfig,
    mailpitClient?: MailpitClient
  );
  async processMessage(msg: MailpitMessage): Promise<Batch>;
}
```

**Methods:**

- `processMessage(msg)` — Full pipeline: validate → extract → classify → manifest. Returns Batch with manifest.

---

## FileWatcher

**File:** `src/watcher/FileWatcher.ts`

### Interface: FileWatcherConfig

```typescript
interface FileWatcherConfig {
  watchDir: string;                   // C:\research-intake
  debounceMs: number;                 // 500
  enablePolling: boolean;             // Fallback polling
  pollingIntervalMs: number;          // 5000
  ignorePatterns: string[];           // Glob patterns
}
```

### Class: FileWatcher

```typescript
class FileWatcher {
  constructor(config: FileWatcherConfig);
  async start(onBatchReady: (batchDir: string) => Promise<void>): Promise<void>;
  async stop(): Promise<void>;
  async isBatchReady(batchDir: string): Promise<boolean>;
}
```

**Methods:**

- `start(callback)` — Begin watching for manifest.json. Calls callback when batch is ready.
- `stop()` — Stop watcher and polling.
- `isBatchReady(dir)` — Check if batch has valid manifest + intake log + extracted files.

---

## IngestOrchestrator

**File:** `src/orchestrator/IngestOrchestrator.ts`

### Interface: RoutingConfig

```typescript
interface RoutingConfig {
  tier1: TierRoute;                   // Tier 1 routing
  tier2: TierRoute;                   // Tier 2 routing
  tier3: TierRoute;                   // Tier 3 routing
  unmappedTier: TierRoute;            // Default for unknown
}
```

### Interface: TierRoute

```typescript
interface TierRoute {
  tier: 'tier-1-images' | 'tier-2-research' | 'tier-3-local';
  destination: string;                // Folder ID or local path
  uploadMethod: 'drive-api' | 'rclone' | 'local-copy';
  maxRetries: number;                 // 1-5
}
```

### Interface: DriveConfig

```typescript
interface DriveConfig {
  clientId: string;                   // Google OAuth2 client ID
  clientSecret: string;               // Client secret
  refreshToken: string;               // Refresh token
  maxConcurrentUploads: number;       // 1-10
  chunkSizeMb: number;                // 100
  timeoutMs: number;                  // 300000
}
```

### Interface: UploadResult

```typescript
interface UploadResult {
  batchId: string;
  totalFiles: number;
  successCount: number;
  failureCount: number;
  allSucceeded: boolean;
  completedAt: string;                // ISO-8601
}
```

### Class: IngestOrchestrator

```typescript
class IngestOrchestrator {
  constructor(routingConfig: RoutingConfig, driveConfig: DriveConfig);
  async triggerIngest(batchDir: string): Promise<void>;
}
```

**Methods:**

- `triggerIngest(batchDir)` — Route batch → upload files → archive or retry on failure.

---

## DriveUploader

**File:** `src/orchestrator/DriveUploader.ts`

### Class: DriveUploader

```typescript
class DriveUploader {
  constructor(config: DriveConfig);
  async uploadBatch(
    batchDir: string,
    manifest: BatchManifest,
    folderId: string
  ): Promise<UploadResult>;
}
```

**Methods:**

- `uploadBatch(dir, manifest, folderId)` — Upload all extracted attachments to Drive folder. Returns upload result with file counts.

---

## Logger

**File:** `src/utils/Logger.ts`

### Class: Logger

```typescript
class Logger {
  constructor(component: string, logDir?: string);
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}
```

**Methods:**

- Emit structured JSON log entries to console + file
- Output: `logs/{component}.log`

---

## CircuitBreaker

**File:** `src/utils/CircuitBreaker.ts`

### Enum: CircuitState

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failures exceeded, reject calls
  HALF_OPEN = 'HALF_OPEN' // Testing recovery
}
```

### Class: CircuitBreaker

```typescript
class CircuitBreaker {
  constructor(failureThreshold: number, resetTimeoutMs: number);
  recordSuccess(): void;
  recordFailure(): void;
  isOpen(): boolean;
}
```

**Methods:**

- `recordSuccess()` — Count success in HALF_OPEN state. Reset if 2+ successes.
- `recordFailure()` — Increment failure count. Open if threshold exceeded.
- `isOpen()` — Check circuit state. Transition to HALF_OPEN after reset timeout.

---

## Configuration

**File:** `src/config.ts`

### Interface: DaemonConfig

```typescript
interface DaemonConfig {
  mailpit: MailpitPoolConfig;
  validation: ValidationConfig;
  classification: ClassificationConfig;
  watcher: FileWatcherConfig;
  routing: RoutingConfig;
  drive: DriveConfig;
  monitoring: {
    checkStuckIntervalMinutes: number;
    stuckThresholdMinutes: number;
    archiveRotationDays: number;
  };
}
```

### Function: loadConfig()

```typescript
function loadConfig(): DaemonConfig
```

Loads configuration from `config.json` or path in `CONFIG_PATH` env var. Throws if file not found.

---

## Entry Point

**File:** `src/index.ts`

Initializes daemon:

1. Load config
2. Create MailpitClient → health check
3. Create BatchProcessor
4. Create FileWatcher
5. Create IngestOrchestrator
6. Start polling + watching
7. Handle SIGTERM gracefully

---

## Type Exports

```typescript
// Batch & Manifest
type Batch = { batchId: string; batchDir: string; manifest: BatchManifest };
type PollingHandle = { stop: () => void };

// Upload
type UploadResult = { ... };

// Configuration
type DaemonConfig = { ... };
type MailpitPoolConfig = { ... };
type ValidationConfig = { ... };
type ClassificationConfig = { ... };
type FileWatcherConfig = { ... };
type RoutingConfig = { ... };
type DriveConfig = { ... };
```

---

## Error Types

| Error | Thrown By | Handling |
|-------|-----------|----------|
| MailpitConnectionError | MailpitClient.connect() | Circuit breaker → retry |
| ValidationError | BatchProcessor.validateMessage() | Move to rejected/ |
| ExtractionTimeoutError | BatchProcessor.extractAttachmentWithTimeout() | Mark failed, continue |
| TimeoutError | MailpitClient.fetch() | Retry with backoff |
| Error (generic) | Any async operation | Log + Slack alert |

---

## Integration Example

```typescript
const config = loadConfig();
const client = new MailpitClient(config.mailpit);
const processor = new BatchProcessor(config.validation, config.classification, client);
const watcher = new FileWatcher(config.watcher);
const orchestrator = new IngestOrchestrator(config.routing, config.drive);

await client.connect();
await watcher.start(async (batchDir) => {
  try {
    await orchestrator.triggerIngest(batchDir);
  } catch (err) {
    logger.error(`Ingest failed: ${err.message}`);
  }
});

client.startPolling(async (messages) => {
  for (const msg of messages) {
    const batch = await processor.processMessage(msg);
    // Batch is ready in pending/, watcher will pick it up
  }
});
```
