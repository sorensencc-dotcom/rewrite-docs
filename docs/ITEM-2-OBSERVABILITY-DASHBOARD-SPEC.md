---
title: "ITEM 2 OBSERVABILITY DASHBOARD SPEC"
summary: "# ITEM 2: OBSERVABILITY DASHBOARD SPEC **Date:** 2026-07-02 **Scope:** CIC + RL unified observability platform **Status:** Implementation-ready"
created: "2026-07-03T19:43:45.750Z"
updated: "2026-07-07T14:30:00.000Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
backlinks:
  - docs/index-unified.md (Unified Index & Navigation)
  - docs/reference/configuration-logging.md (Logging sources & standards)
canonical: false
---
# ITEM 2: OBSERVABILITY DASHBOARD SPEC
**Date:** 2026-07-02  
**Scope:** CIC + RL unified observability platform  
**Status:** Implementation-ready

---

## EXECUTIVE SUMMARY

Unified dashboard for monitoring CIC pipeline health, RL generation engine, and integrated system state. Single pane of glass querying Prometheus (CIC metrics), pipeline state logs (RL), and unified SLO tracking.

---

## DASHBOARD ARCHITECTURE

### Data Sources
1. **Prometheus** (CIC adapter metrics)
2. **RL Pipeline State** (JSON logs from ingestion service)
3. **Qdrant Context Store** (vector DB health)
4. **PostgreSQL** (extraction state + metadata)

### Three-Dashboard Pattern

| Dashboard | Audience | Refresh | Primary Metric |
|-----------|----------|---------|-----------------|
| **System Health** | On-call / Dev | 30s | Adapter success rate |
| **Pipeline Deep Dive** | Data ops / Analyst | 60s | Extraction latency + quality |
| **Cost & Usage** | Finance / PM | 300s | API calls + token burn |

---

## DASHBOARD 1: SYSTEM HEALTH (Overview)

**URL:** `/grafana/d/cic-system-health`  
**Refresh:** 30 seconds (real-time)  
**Audience:** On-call engineer, first responder

### Panels (Top to Bottom)

#### Row 1: Status (Red/Yellow/Green)

**Panel 1.1: Adapter Health (5 gauges)**
```
Metric: cic_adapter_calls_total{status="success"} / sum(cic_adapter_calls_total)
Thresholds: 
  - Green: >99%
  - Yellow: 95-99%
  - Red: <95%
Labels: BrowserNavigate, BrowserScreenshot, ModelGenerate, AnthropicClient, PuppeteerEngine
```

**Panel 1.2: Orchestrator Status (single gauge)**
```
Metric: rate(cic_orchestrator_chain_success_total{status="success"}[5m])
Target: >99.5%
Alert if <95% for 2m
```

**Panel 1.3: RL Ingestion Status (single gauge)**
```
Source: RL pipeline state (last ingestion event)
Label: Running / Paused / Failed
Last Update: timestamp
```

---

#### Row 2: Latency Distribution

**Panel 2.1: Adapter Latency (p50, p95, p99)**
```
Type: Multi-line chart
Metrics:
  - histogram_quantile(0.50, cic_adapter_duration_ms{adapter="BrowserNavigate"})
  - histogram_quantile(0.95, cic_adapter_duration_ms{adapter="BrowserNavigate"})
  - histogram_quantile(0.99, cic_adapter_duration_ms{adapter="BrowserNavigate"})
Variables: dropdown to select adapter
Time range: Last 24 hours
Thresholds: 
  - Green zone: <100ms (p95)
  - Yellow zone: 100-500ms (p95)
  - Red zone: >500ms (p95)
```

**Panel 2.2: Orchestrator Chain Latency**
```
Type: Line chart
Metric: cic_orchestrator_chain_duration_ms (bucketed p50, p95, p99)
Label: navigate → screenshot → generate
Time range: Last 24 hours
```

---

#### Row 3: Error Analysis

**Panel 3.1: Error Rate by Adapter (5-minute window)**
```
Type: Bar chart
Metric: rate(cic_adapter_errors_total[5m]) by (adapter)
Sorted: Descending
Colors: Orange for warnings, Red for critical
Show counts + rate
```

**Panel 3.2: Error Codes (Pie chart)**
```
Type: Pie/Donut
Metric: cic_adapter_errors_total by (code)
Top 10 error codes
Drill-down: Click code → filter logs
```

**Panel 3.3: Schema Violations (Heatmap)**
```
Type: Heatmap
Metric: cic_adapter_schema_violations_total by (adapter, field)
Time range: Last 24 hours
Color intensity: Violation count
Hover: Shows adapter + field + count
```

---

#### Row 4: RL Pipeline State

**Panel 4.1: Ingestion Queue Depth**
```
Type: Gauge
Source: RL pipeline state JSON
Label: "Pending chunks" or "Queue empty"
Thresholds:
  - Green: 0-100
  - Yellow: 100-500
  - Red: >500
```

**Panel 4.2: Last 10 Ingestions (Table)**
```
Columns:
  - Timestamp (DESC)
  - Status (✓ / ✗)
  - Source (Drive folder)
  - Chunks processed
  - Duration (ms)
  - Token usage
  - Error (if any)
Row click: Expand to see logs
```

---

#### Row 5: SLO Tracking

**Panel 5.1: Monthly Error Budget (Gauge)**
```
Target: 99.5% uptime (21.6 min/month)
Metric: Budget remaining (minutes)
Thresholds:
  - Green: >10 minutes
  - Yellow: 5-10 minutes
  - Red: <5 minutes (freeze deployments)
Reset: 1st of month UTC
```

**Panel 5.2: Cumulative Availability (Counter)**
```
Type: Stat
Metric: Sum(cic_adapter_calls_total{status="success"}) / Sum(cic_adapter_calls_total)
Format: 99.87%
Period: Month-to-date
```

---

## DASHBOARD 2: PIPELINE DEEP DIVE (Per-Component)

**URL:** `/grafana/d/cic-pipeline-dive`  
**Refresh:** 60 seconds  
**Audience:** Data ops, platform engineer

### Variables (Top Row)
- **Adapter:** Dropdown (BrowserNavigate, BrowserScreenshot, etc.)
- **Time Range:** Picker (default: last 6 hours)
- **Component:** Dropdown (CodeFlow, Extractor, Qdrant, etc.)

### Panels

#### Row 1: Throughput & Latency

**Panel 1.1: Call Volume (5-minute rate)**
```
Type: Line chart
Metric: rate(cic_adapter_calls_total{adapter="${Adapter}"}[5m])
Split: status="success" vs status="error"
Colors: Green / Red
Show rate + count
```

**Panel 1.2: Latency Heatmap**
```
Type: Heatmap
Metric: cic_adapter_duration_ms{adapter="${Adapter}"}
Buckets: 5ms, 10ms, 50ms, 100ms, 500ms, 1000ms, 5000ms
Time range: Last 6 hours
Color intensity: Request count per bucket
```

---

#### Row 2: Error Deep Dive

**Panel 2.1: Error Rate by Code (last 6h)**
```
Type: Pie chart
Metric: cic_adapter_errors_total{adapter="${Adapter}"} by (code)
Drill-down: Click code → Show logs for that code
```

**Panel 2.2: Recent Error Logs (Table)**
```
Columns:
  - Timestamp (DESC)
  - Error Code
  - Message / Details
  - Adapter
  - Duration (ms)
  - Stack trace (if available)
Rows: Last 50 errors
Filters: Time range, severity
Row click: Expand full error context
```

---

#### Row 3: Guard Function Performance

**Panel 3.1: Guard Function Latency**
```
Type: Line chart
Metrics:
  - histogram_quantile(0.50, cic_guard_duration_ms{guard="validatePng"})
  - histogram_quantile(0.95, cic_guard_duration_ms{guard="validatePng"})
Time range: Last 6 hours
Target: All guards <100ms
```

**Panel 3.2: Guard Function Pass Rate**
```
Type: Stat
Metric: rate(cic_guard_duration_ms{status="pass"}[5m]) / rate(cic_guard_duration_ms[5m])
Format: Percentage
Target: >99%
```

---

#### Row 4: Component-Specific Metrics

**Panel 4.1: CodeFlow Analyzer**
```
Type: Table
Columns:
  - Repo
  - Files scanned
  - Edges found
  - Security issues
  - Patterns
  - Duration (ms)
Filter by time range
```

**Panel 4.2: Qdrant Context Store**
```
Type: Stat cards
- Documents indexed
- Vectors stored
- Query latency (p95)
- Storage used (MB)
Status: Connected / Degraded / Disconnected
```

**Panel 4.3: PostgreSQL Extraction State**
```
Type: Table
Columns:
  - Repo ID
  - Extracted nodes
  - Last extraction (timestamp)
  - State (Complete / In Progress / Failed)
  - Duration (total)
Filter: Repo, status
```

---

## DASHBOARD 3: COST & USAGE (Finance Track)

**URL:** `/grafana/d/cic-cost-usage`  
**Refresh:** 5 minutes  
**Audience:** Finance, PM, cost optimization

### Panels

#### Row 1: Token Burn

**Panel 1.1: API Usage (Anthropic)**
```
Type: Gauge + sparkline
Metric: Sum(cic_anthropic_tokens_total) per day
Current: Today's burn
Target: Budget allocation
Show: 30-day trend (sparkline)
```

**Panel 1.2: Token Breakdown**
```
Type: Pie chart
Slices:
  - Input tokens (prompt)
  - Output tokens (completion)
  - Cached tokens (reuse)
Percentages
```

---

#### Row 2: Cost Projection

**Panel 2.1: Month-to-Date Spend**
```
Type: Stat
Formula: (tokens_to_date / tokens_budgeted) * 100
Display: $X.XX / $Budget
Color: Green if <85%, Yellow if 85-95%, Red if >95%
```

**Panel 2.2: Projected Month-End**
```
Type: Gauge + annotation
Calculation: (tokens_to_date / days_to_date) * 30
Days remaining: Calculate
Projected: $X.XX (vs budget)
```

---

#### Row 3: Cost per Component

**Panel 3.1: Cost by Adapter**
```
Type: Bar chart
Metric: (cic_adapter_calls_total * avg_tokens_per_call) by (adapter)
Sorted: Descending (most expensive first)
Show: %, absolute tokens, estimated $
```

**Panel 3.2: Cost Efficiency (MIPS)**
```
Type: Table
Columns:
  - Adapter
  - Calls
  - Avg tokens per call
  - Cost per call
  - Efficiency trend (↑/↓)
Sortable by efficiency
```

---

## ALERT RULES (Alert.rules.yml)

### Critical Alerts

```yaml
- alert: SystemHealthCritical
  expr: (rate(cic_adapter_calls_total{status="success"}[5m]) / ignoring(status) group_left sum(rate(cic_adapter_calls_total[5m]))) < 0.95
  for: 2m
  annotations:
    summary: "Adapter success rate <95% for 2m"
    runbook: "Check Adapter Health dashboard, review error logs"

- alert: OrchestratorChainFailure
  expr: rate(cic_orchestrator_chain_success_total{status="failure"}[5m]) > 0.05
  for: 2m
  annotations:
    summary: "Orchestrator chain >5% failure rate"
    runbook: "Check Pipeline Deep Dive dashboard"

- alert: LatencySpikeDetected
  expr: histogram_quantile(0.95, cic_adapter_duration_ms) > 1000
  for: 2m
  annotations:
    summary: "Adapter p95 latency >1s"
    runbook: "Profile adapter, check for downstream bottlenecks"

- alert: CostBudgetExceeded
  expr: (sum(cic_anthropic_tokens_total) / 1000000) * 0.002 > (DAY_OF_MONTH / 30) * MONTHLY_BUDGET
  for: 5m
  annotations:
    summary: "Token burn exceeds budget pace"
    runbook: "Review cost/usage dashboard, optimize high-cost adapters"
```

### Warning Alerts

```yaml
- alert: SchemaViolationDetected
  expr: increase(cic_adapter_schema_violations_total[5m]) > 0
  for: 1m
  annotations:
    summary: "Adapter output schema drifted"
    runbook: "Check adapter output format, update schema"

- alert: QueueDepthIncreasing
  expr: rate(rl_ingestion_queue_depth[10m]) > 0
  for: 5m
  annotations:
    summary: "RL ingestion queue backlog building"
    runbook: "Check ingestion service status, scale if needed"
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Metrics Export (T+0h)
- [ ] Wire Prometheus client to CIC adapters
- [ ] Emit all 8 metric types (latency, error, throughput, schema)
- [ ] Add /metrics endpoint to Express app
- [ ] Verify Prometheus scrapes successfully

### Phase 2: RL State Logging (T+1h)
- [ ] Emit JSON pipeline state events to stdout
- [ ] Format: `{timestamp, status, queue_depth, tokens_used, source}`
- [ ] Capture in centralized logging (Loki or similar)
- [ ] Wire to Grafana as data source

### Phase 3: Dashboard Creation (T+2h)
- [ ] Create 3 dashboard JSON files
- [ ] Import to Grafana
- [ ] Verify all panels render (no 404s)
- [ ] Test drill-downs, variables, drill-throughs

### Phase 4: Alert Configuration (T+3h)
- [ ] Create alert.rules.yml
- [ ] Deploy to Prometheus
- [ ] Test critical alerts (synthetic errors)
- [ ] Configure Slack notification channel

### Phase 5: Documentation & Training (T+4h)
- [ ] Write runbook for each alert
- [ ] Create "how to interpret" guide for each dashboard
- [ ] Link to playbooks in alert annotations
- [ ] Schedule team walkthrough

---

## QUERIES (Copy-Paste Ready)

### System Health — Adapter Success Rate
```promql
(sum(rate(cic_adapter_calls_total{status="success"}[5m])) by (adapter)) 
/ 
(sum(rate(cic_adapter_calls_total[5m])) by (adapter))
```

### Latency — P95 by Adapter
```promql
histogram_quantile(0.95, cic_adapter_duration_ms)
```

### Error Budget Remaining (Minutes)
```promql
(21.6 * 60) - (sum(increase(cic_adapter_errors_total[30d])) * 1)
```

### Token Burn (Daily Average)
```promql
sum(increase(cic_anthropic_tokens_total[1d])) / 1000000
```

---

## GRAFANA VARIABLES

```json
{
  "variables": [
    {
      "name": "Adapter",
      "type": "query",
      "query": "label_values(cic_adapter_duration_ms, adapter)",
      "multi": false,
      "includeAll": true
    },
    {
      "name": "TimeRange",
      "type": "interval",
      "options": ["5m", "1h", "6h", "24h", "7d"]
    }
  ]
}
```

---

## SUCCESS CRITERIA

✅ All 3 dashboards render without 404s  
✅ Adapter health shows real data (not zeros)  
✅ Latency percentiles calculated correctly  
✅ Error codes appear in drill-down table  
✅ Cost projection within 10% of actual  
✅ All alerts fire on synthetic errors within 2 minutes  
✅ On-call can identify root cause in <5 minutes  
✅ Monthly error budget resets on 1st UTC  

---

## NEXT STEPS

1. **Approve dashboard layout** — Review panel organization
2. **Confirm alert thresholds** — Adjust for your SLO
3. **Implement Phase 1** — Add Prometheus metrics to adapters
4. **Schedule integration test** — End-to-end alert validation

