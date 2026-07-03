# Shared Module — Phase 27 Integration

Shared utilities and webhook infrastructure for Phase 27 CIC Integration services.

## Components

### WebhookListener

Centralized SLO violation and event handling for all services.

**Export:** `createWebhookRouter()`

**Usage:**

```typescript
import { createWebhookRouter } from '@shared/webhook-listener';
import express from 'express';

const app = express();
const webhookRouter = createWebhookRouter();

app.use('/webhooks', webhookRouter);
```

**Routes:**

- `POST /webhooks/slo/violation` — Handle SLO violations with severity-based routing
- `POST /webhooks/events/slo-violation` — Handle SLO events (drift, hydration failures, etc.)

**Event Types:**

- `VERTICAL_DRIFT` — Score dropped > 30%
- `SPA_HYDRATION_FAILURE` — SPA hydration errors detected
- `CONFIDENCE_DROP` — Confidence score < threshold
- `TIMEOUT` — Adapter execution timeout
- `SCHEMA_MISMATCH` — Output schema changed

**Severity Levels:**

- `CRITICAL` — Oncall notification + Slack alert
- `HIGH` — Slack alert
- `MEDIUM` — Log only
- `LOW` — Debug log

### Logger

Structured logging utility with level-based output.

**Usage:**

```typescript
import { Logger } from '@shared';

const logger = new Logger('MyService');

logger.info('Operation started', { key: 'value' });
logger.warn('Slow operation', { duration: 5000 });
logger.error('Operation failed', { error: 'message' });
logger.debug('Debug info', { details: {} });
```

## Configuration

### Environment Variables

```bash
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

### Integration Points

1. **TorqueQuery** — Mounts webhook router at `/webhooks`
2. **Chat-Agent** — Mounts webhook router at `/webhooks`
3. **CIC Ingestion** — Emits SLO events to webhook endpoints

## Files

```
shared/
├── webhook-listener.ts   # Webhook router + event handlers
├── utils/
│   └── logger.ts        # Structured logger
├── index.ts             # Module exports
└── README.md
```

## Status

✅ Phase 27 Step 3.1 complete. Ready for service integration.
