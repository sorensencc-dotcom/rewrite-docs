---
title: "Configuration & Logging Standards"
description: "Unified configuration management and logging patterns across CIC and Rewrite Labs"
created: "2026-07-07"
tags:
  - config
  - logging
  - standards
  - observability
canonical: true
backlinks:
  - docs/item-2-observability-dashboard-spec.md (Logging Standards, Metrics Export)
  - docs/meta/00-index.md (Environment reference)
  - docs/item-5-skill-generator.md (Config validation patterns)
---

# Configuration & Logging Standards

Unified approach to managing configuration and emitting observability signals across the CIC pipeline and Rewrite Labs system.

---

## CONFIGURATION PRINCIPLES

### 1. Environment Variable Management

**Required Variables (from CIC_ENV_REFERENCE.md):**
- `ANTHROPIC_API_KEY` — Anthropic API authentication (required, string, non-empty)
- `QDRANT_URL` — Vector database connection string (required, format: `http://host:port`)
- `PORT` — Service listen port (optional, number, default: 4000, range: 1024-65535)
- `POSTGRES_URL` — Database connection (required, URI format)
- `LOG_LEVEL` — Verbosity control (optional, enum: debug|info|warn|error, default: info)

**Validation Rules:**
- All required vars must be non-empty before service startup
- PORT must be within 1024-65535 (non-privileged range)
- QDRANT_URL must be valid HTTP(S) URL
- POSTGRES_URL must be parseable database URI
- LOG_LEVEL must match enum if present

**Default Values:**
```
PORT=4000
LOG_LEVEL=info
QDRANT_TIMEOUT=30000  # ms
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=20
CACHE_TTL_MINUTES=60
```

### 2. Configuration Layers

**Layer 1: Environment (.env file)**
- System-level settings: database URLs, API keys, ports
- Sourced at startup via `dotenv` or direct process.env
- Validation happens during initialization

**Layer 2: Vault (cic-ref/)**
- Canonical reference for all config options
- Includes: defaults, validation rules, descriptions
- Source of truth for required vars and constraints

**Layer 3: Application Defaults**
- Fallback values in code (process.env.PORT || 4000)
- Used when env var not provided but optional

**Layer 4: Runtime Overrides**
- CLI flags or API parameters override env vars
- Temporary configuration for testing/debugging

---

## LOGGING STANDARDS

### 1. Log Levels

**DEBUG (level 0)**
- Detailed diagnostic information
- Used: Variable assignments, function entry/exit, loop iterations
- Example: `logger.debug('Extracted 5 concepts from doc', {docId, concepts})`

**INFO (level 1)**
- General informational messages
- Used: Process milestones, initialization complete, service ready
- Example: `logger.info('Adapter initialized', {adapter: 'BrowserNavigate', port})`

**WARN (level 2)**
- Warning conditions that don't prevent operation
- Used: Deprecated config, fallback to default, performance degradation
- Example: `logger.warn('Cache miss, using live query', {query, duration: 1200})`

**ERROR (level 3)**
- Error conditions that require attention
- Used: Failed adapter call, validation error, timeout
- Example: `logger.error('Adapter failed', {error: e.message, adapter, duration})`

### 2. Structured Logging Format

**JSON Output (default in production):**
```json
{
  "timestamp": "2026-07-07T14:23:45.123Z",
  "level": "INFO",
  "logger": "CICAdapter",
  "message": "Adapter success",
  "adapter": "BrowserNavigate",
  "duration_ms": 145,
  "status": "success",
  "context": {
    "requestId": "req-12345",
    "userId": "user-67890"
  },
  "tags": ["performance", "adapter"]
}
```

**Text Output (development):**
```
[2026-07-07 14:23:45] INFO  [CICAdapter] Adapter success
  adapter: BrowserNavigate
  duration_ms: 145
  status: success
```

### 3. Log Fields (Always Include)

**Mandatory:**
- `timestamp` — ISO 8601 UTC
- `level` — DEBUG|INFO|WARN|ERROR
- `logger` — Component name (e.g., CICAdapter, Orchestrator)
- `message` — Human-readable summary
- `context.requestId` — Trace ID for correlation

**Conditional (if applicable):**
- `adapter` — For adapter logs
- `phase` — For phase-related operations
- `duration_ms` — For latency tracking
- `error` — Error message (if level=ERROR)
- `stack_trace` — Full stack (if level=ERROR and debug=true)

### 4. Metrics vs Logs

**Use Metrics For:**
- Rates (requests/sec, errors/sec)
- Distributions (latency p50, p95, p99)
- Gauges (queue depth, active connections)
- Counters (total calls, total errors, total tokens)

**Use Logs For:**
- Specific error details (stack trace, context)
- Operational events (deployment, config reload)
- Business logic (phase transition, skill invocation)
- Audit trail (who changed what, when)

---

## LOGGING INTEGRATION (Observability Dashboard)

### Prometheus Metrics Export

**Metrics to emit (5-minute bucketed):**

```
cic_adapter_calls_total{adapter, status}           # Counter
cic_adapter_duration_ms{adapter, quantile}          # Histogram
cic_adapter_errors_total{adapter, code}             # Counter
cic_adapter_schema_violations_total{adapter, field} # Counter
cic_orchestrator_chain_success_total{status}        # Counter
cic_orchestrator_chain_duration_ms                  # Histogram
cic_guard_duration_ms{guard}                        # Histogram
cic_anthropic_tokens_total                          # Counter
rl_ingestion_queue_depth                            # Gauge
```

**Prometheus Scrape Config:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'cic'
    static_configs:
      - targets: ['localhost:3100']
    metrics_path: '/metrics'
    scrape_interval: 30s  # Fast scrape for real-time dashboards
```

### Pipeline State Logging (RL Ingestion)

**JSON Event Format:**
```json
{
  "timestamp": "2026-07-07T14:23:45.123Z",
  "event_type": "ingestion_complete",
  "status": "success",
  "source": "/drive/folder/document.md",
  "chunks_processed": 5,
  "tokens_used": {
    "input": 2150,
    "output": 340,
    "cached": 0
  },
  "duration_ms": 1230,
  "error": null,
  "queue_depth_after": 12
}
```

**Emit to stdout (captured by logging service):**
```
2026-07-07T14:23:45.123Z | PIPELINE | ingestion_complete | source=/drive/folder/document.md | chunks=5 | tokens=2490 | duration_ms=1230
```

---

## LOGGING INFRASTRUCTURE

### Phase 1: Metrics Export (T+0h)
- Wire Prometheus client to adapters
- Emit all 8 metric types (latency, error, throughput, schema)
- Add `/metrics` endpoint to Express app
- Verify Prometheus scrapes successfully

### Phase 2: RL State Logging (T+1h)
- Emit JSON pipeline state events to stdout
- Format: `{timestamp, status, queue_depth, tokens_used, source}`
- Capture in centralized logging (Loki or similar)
- Wire to Grafana as data source

### Phase 3: Dashboard Integration (T+2h)
- Create Grafana dashboards (System Health, Pipeline Deep Dive, Cost & Usage)
- Test all panels render correctly
- Verify drill-downs work
- Configure alerts

---

## VALIDATION & ERROR HANDLING

### Configuration Validation (skill: cic-env-validator)

```typescript
// Pseudocode: validation logic
const required = ['ANTHROPIC_API_KEY', 'QDRANT_URL', 'POSTGRES_URL'];
const optional = { PORT: 4000, LOG_LEVEL: 'info' };
const constraints = {
  PORT: (val) => 1024 <= val && val <= 65535,
  QDRANT_URL: (val) => isValidUrl(val) && val.startsWith('http'),
  LOG_LEVEL: (val) => ['debug', 'info', 'warn', 'error'].includes(val)
};

const report = validate(process.env, required, optional, constraints);
if (!report.valid) {
  logger.error('Config validation failed', report);
  process.exit(1);
}
```

### Logging Errors

**Critical (triggers alert + page on-call):**
- Adapter success rate <95% for 2m
- Orchestrator chain failure rate >5%
- Adapter p95 latency >1s
- Token burn exceeds budget pace

**Warning (logged, no page):**
- Schema violation detected (output format drifted)
- Queue depth increasing (backlog building)
- Cache miss on repeated query

---

## SCHEMA VALIDATION

### Adapter Output Schema (cic_adapter_schema_violations metric)

**Example: BrowserNavigate adapter**
```json
{
  "type": "object",
  "properties": {
    "url": { "type": "string" },
    "title": { "type": "string" },
    "screenshot": { "type": "string", "format": "base64" },
    "viewport": { "type": "object" },
    "timestamp": { "type": "string", "format": "iso8601" }
  },
  "required": ["url", "title", "screenshot", "timestamp"]
}
```

**Validation:**
- Every adapter output validated against schema
- Violations incremented: `cic_adapter_schema_violations_total{adapter, field}`
- Panel 3.3 (Schema Violations Heatmap) shows trend

---

## CROSS-REFERENCES

**Related Documentation:**
- Environment Variables: See `cic-ref/CIC_ENV_REFERENCE.md`
- Observability Plan: See `docs/item-2-observability-dashboard-spec.md`
- Skill Generator: See `docs/item-5-skill-generator.md` (Config validation patterns)
- Token Pack: See `cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md`

**Runbook Skills:**
- `cic-env-validator` — Validate all required vars before startup
- `cic-observability-guide` — Set up Prometheus + Grafana

---

## SUCCESS CRITERIA

✅ All adapters emit metrics to Prometheus  
✅ Log format consistent (JSON in prod, text in dev)  
✅ Configuration validated at startup (no silent failures)  
✅ Logging infrastructure captures all events  
✅ Dashboards render real data (not zeros)  
✅ Alerts fire within 2 minutes of threshold breach  
✅ On-call can identify root cause in <5 minutes  

---

**Last Updated:** 2026-07-07  
**Extracted From:** Observability Dashboard Spec + Skill Generator + CIC Environment Reference  
**Maintainer:** Platform Team
