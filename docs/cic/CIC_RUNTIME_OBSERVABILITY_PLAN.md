# CIC RUNTIME OBSERVABILITY PLAN
**Phase:** 27.3 Parallel Track  
**Duration:** 2-3 hours (parallel with adapter testing)  
**Outcome:** Prometheus metrics + Grafana dashboards + alert rules live  

---

## METRICS SCHEMA

### Adapter Metrics (Per Adapter)

**1. Latency (Histogram)**
```
cic_adapter_duration_ms{adapter="BrowserNavigate", status="success"}
cic_adapter_duration_ms{adapter="BrowserScreenshot", status="success"}
cic_adapter_duration_ms{adapter="ModelGenerate", status="success"}
cic_adapter_duration_ms{adapter="AnthropicClient", status="success"}
cic_adapter_duration_ms{adapter="PuppeteerEngine", status="success"}

cic_adapter_duration_ms{adapter="...", status="error"}
```

Buckets: 5ms, 10ms, 50ms, 100ms, 500ms, 1000ms, 5000ms  
Cardinality: 10 total metrics (5 adapters × 2 statuses)

**2. Error Rate (Counter)**
```
cic_adapter_errors_total{adapter="BrowserNavigate", code="INVALID_URL"}
cic_adapter_errors_total{adapter="BrowserNavigate", code="NAVIGATION_FAILED"}
cic_adapter_errors_total{adapter="BrowserScreenshot", code="INVALID_IMAGE_FORMAT"}
cic_adapter_errors_total{adapter="BrowserScreenshot", code="SCREENSHOT_TOO_LARGE"}
cic_adapter_errors_total{adapter="ModelGenerate", code="MODEL_OVERSIZE_OUTPUT"}
cic_adapter_errors_total{adapter="AnthropicClient", code="ANTHROPIC_EMPTY_RESPONSE"}
cic_adapter_errors_total{adapter="PuppeteerEngine", code="PUPPETEER_CRASHED"}
```

Incremented on every error (ok=false).  
Label: error code (uppercase snake_case, as per adapter spec).

**3. Throughput (Counter)**
```
cic_adapter_calls_total{adapter="...", status="success|error"}
```

Incremented on every call.  
Cardinality: 10 total metrics.

**4. Schema Validation (Counter)**
```
cic_adapter_schema_violations_total{adapter="...", field="url|base64|text|..."}
```

Incremented when Zod safeParse fails.  
Used to detect output drift.

---

### Runtime Metrics (Global)

**1. Orchestrator Chain Health**
```
cic_orchestrator_chain_duration_ms{chain="navigate_screenshot_generate"}
cic_orchestrator_chain_success_total{chain="navigate_screenshot_generate", status="success|failure"}
```

Measured end-to-end (start of first adapter → end of last adapter).

**2. Guard Function Performance**
```
cic_guard_duration_ms{guard="validatePng", status="pass|fail"}
cic_guard_duration_ms{guard="sanitizeText", status="pass|fail"}
```

Ensures guards don't bottleneck runtime.

---

## STRUCTURED LOGGING

### Log Format (JSON)
```json
{
  "timestamp": "2026-06-20T14:30:45.123Z",
  "level": "info|warn|error",
  "component": "BrowserNavigateAdapter|ModelGenerateAdapter|Orchestrator",
  "adapter": "BrowserNavigate",
  "action": "call|validate|guard|envelope",
  "status": "success|error",
  "durationMs": 45,
  "errorCode": "INVALID_URL",
  "errorDetails": {"field": "url", "reason": "about:blank rejected"},
  "meta": {
    "adapter": "BrowserNavigate",
    "timestamp": "2026-06-20T14:30:45.123Z",
    "durationMs": 45
  }
}
```

### Logging Points

**Per-Adapter (structured):**
```ts
logger.info({
  component: "BrowserNavigateAdapter",
  adapter: "BrowserNavigate",
  action: "call",
  status: "success",
  durationMs: env.meta.durationMs,
  meta: env.meta,
});
```

**On Guard Failure:**
```ts
logger.warn({
  component: "BrowserNavigateAdapter",
  adapter: "BrowserNavigate",
  action: "guard",
  status: "error",
  errorCode: "INVALID_URL",
  errorDetails: { url },
});
```

**On Schema Violation:**
```ts
logger.error({
  component: "BrowserNavigateAdapter",
  adapter: "BrowserNavigate",
  action: "validate",
  status: "error",
  errorCode: "INVALID_NAVIGATION_RESULT",
  errorDetails: schemaError,
});
```

---

## PROMETHEUS CONFIGURATION

### Scrape Config (prometheus.yml)
```yaml
scrape_configs:
  - job_name: 'cic-runtime'
    static_configs:
      - targets: ['localhost:3100']
    scrape_interval: 5s
    scrape_timeout: 2s
    metrics_path: '/metrics'
```

### Metrics Endpoint (Express)
```ts
import prometheus from 'prom-client';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Retention Policy
```yaml
global:
  scrape_interval: 5s
  retention: 7d  # Keep 7 days of metrics
```

---

## GRAFANA DASHBOARDS

### Dashboard 1: Adapter Health (Overview)
**File:** `dashboards/adapter-health.json`

Panels:
1. **Adapter Success Rate** (gauges, per adapter)
   - Color: green if >95%, yellow if 90-95%, red if <90%
   
2. **Adapter Latency (p50, p95, p99)** (line chart)
   - BrowserNavigate latency trend
   - BrowserScreenshot latency trend
   - ModelGenerate latency trend
   - AnthropicClient latency trend
   - PuppeteerEngine latency trend

3. **Error Rate by Adapter** (bar chart)
   - Count of errors per adapter (last 1h)

4. **Schema Violations** (heatmap)
   - Violations by adapter + field (last 24h)

5. **Orchestrator Chain Health** (status)
   - navigate → screenshot → generate completion rate

---

### Dashboard 2: Deep Dive (Per-Adapter)
**File:** `dashboards/adapter-details.json`

Variables:
- `adapter` (dropdown: BrowserNavigate, BrowserScreenshot, ModelGenerate, AnthropicClient, PuppeteerEngine)

Panels:
1. **Call Volume** (5m rate)
2. **Latency Distribution** (heatmap)
3. **Error Rate by Code** (pie chart)
4. **Guard Function Performance** (line chart)
5. **Recent Errors** (table with logs)

---

### Dashboard 3: Runtime Health (SLI/SLO)
**File:** `dashboards/runtime-sli.json`

Panels:
1. **Availability SLI** (99.5% target)
   - Success rate >= 99.5%

2. **Latency SLI** (p95 < 500ms target)
   - P95 latency under 500ms

3. **Error Budget Remaining** (gauge)
   - Remaining error budget for month

4. **Crash Incidents** (counter)
   - PuppeteerEngine crashes detected

---

## ALERT RULES (alert.rules.yml)

### Critical Alerts

**1. Adapter Latency Spike**
```yaml
- alert: AdapterLatencySpike
  expr: histogram_quantile(0.95, cic_adapter_duration_ms) > 1000
  for: 2m
  annotations:
    summary: "{{ $labels.adapter }} latency > 1s for 2m"
```

**2. Error Rate Spike**
```yaml
- alert: AdapterErrorSpike
  expr: rate(cic_adapter_errors_total[5m]) > 0.1
  for: 2m
  annotations:
    summary: "{{ $labels.adapter }} error rate > 10% for 2m"
```

**3. Puppeteer Crash**
```yaml
- alert: PuppeteerCrashed
  expr: increase(cic_adapter_errors_total{adapter="PuppeteerEngine", code="PUPPETEER_CRASHED"}[5m]) > 0
  for: 1m
  annotations:
    summary: "PuppeteerEngine crashed in last 5m"
```

**4. Orchestrator Chain Failure**
```yaml
- alert: OrchestratorChainFailed
  expr: rate(cic_orchestrator_chain_success_total{status="failure"}[5m]) > 0.05
  for: 2m
  annotations:
    summary: "Orchestrator chain >5% failure rate for 2m"
```

### Warning Alerts

**5. Schema Violation Detected**
```yaml
- alert: SchemaViolation
  expr: increase(cic_adapter_schema_violations_total[5m]) > 0
  for: 1m
  annotations:
    summary: "{{ $labels.adapter }} output schema drifted"
```

**6. Guard Function Slow**
```yaml
- alert: GuardFunctionSlow
  expr: histogram_quantile(0.95, cic_guard_duration_ms) > 100
  for: 2m
  annotations:
    summary: "{{ $labels.guard }} guard >100ms for 2m"
```

---

## SLO / SLI TARGETS

### Availability SLI (Monthly)
- **Target:** 99.5%
- **Budget:** 21.6 minutes of downtime/month
- **Metric:** `cic_adapter_calls_total{status="success"} / cic_adapter_calls_total`

### Latency SLI (Monthly)
- **Target:** P95 latency < 500ms
- **Budget:** 99.5% of calls must complete in <500ms
- **Metric:** `histogram_quantile(0.95, cic_adapter_duration_ms)`

### Error Budget
- **Opening balance:** 21.6 minutes/month
- **Debit:** Every minute of unavailability or latency violation
- **Action:** When budget < 5 minutes, freeze feature deployments

---

## IMPLEMENTATION TIMELINE

### T+0h: Prometheus Setup
- Add metrics exporter to Express app
- Wire adapters to emit metrics on success/error
- Add /metrics endpoint

### T+30m: Structured Logging
- Update adapter log statements (JSON format)
- Test logs flow to stdout
- Confirm Prometheus scrapes first metrics

### T+1h: Grafana Dashboards
- Create 3 dashboard JSON files
- Import to Grafana
- Verify panels render (no 404s on metrics queries)

### T+1.5h: Alert Rules
- Deploy alert.rules.yml to Prometheus
- Test alerts fire on synthetic errors (via test suite)
- Verify Slack/PagerDuty notifications

### T+2h: SLO Documentation
- Document monthly targets
- Configure error budget tracking
- Wire to on-call rotation

---

## VERIFICATION CHECKLIST

**Metrics:**
- [ ] Prometheus scrapes /metrics every 5s
- [ ] All 8 metric types appear in scrape
- [ ] No cardinality explosion (< 1000 series total)
- [ ] Historic data retained (7 days minimum)

**Logging:**
- [ ] All adapter calls log to stdout (JSON)
- [ ] Logs parse without errors
- [ ] Error codes match spec (UPPERCASE_WITH_UNDERSCORES)

**Dashboards:**
- [ ] 3 dashboards render without 404s
- [ ] Adapter health shows real data (not just zeros)
- [ ] Latency panel shows p50/p95/p99 correctly
- [ ] Error rate calculated as rate(errors_total[5m])

**Alerts:**
- [ ] Alert rules syntax valid (amtool check)
- [ ] Test latency spike → alert fires
- [ ] Test error spike → alert fires
- [ ] Test crash marker → alert fires

**SLO:**
- [ ] Error budget tracker in dashboard
- [ ] Monthly reset logic documented
- [ ] On-call escalation configured

---

## ROLLBACK PLAN

If observability breaks:
1. Remove /metrics endpoint from Express
2. Remove structured logging from adapters
3. Keep adapter code intact (no revert)
4. Re-add observability in Phase 28

If alert fires incorrectly:
1. Silence alert in Prometheus UI
2. Adjust threshold
3. Re-enable with correct threshold

---

## NEXT PHASE (Phase 28)

Observability enables:
- **Phase 28.1:** Adaptive adapter tuning (use metrics to optimize latency)
- **Phase 28.2:** Predictive alerting (ML on error trends)
- **Phase 28.3:** Cost tracking (Anthropic API usage from metrics)

