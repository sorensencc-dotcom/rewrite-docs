---
title: "DASHBOARDS INTEGRATION"
summary: "# Grafana Dashboards Integration Guide"
created: "2026-07-03T19:43:45.962Z"
updated: "2026-07-03T19:43:45.963Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Grafana Dashboards Integration Guide

## Overview

Three pre-configured Grafana dashboard JSON files ready for import:

1. **operations-dashboard.json** — Real-time request latency, throughput, error rates
2. **slo-dashboard.json** — SLO compliance, error budget burn, breach alerts
3. **system-health-dashboard.json** — CPU, memory, disk, queue depth, service connectivity

## Import Steps

### 1. Access Grafana UI
```
http://localhost:3000  (default dev instance)
```

### 2. Import Dashboards
- Go: **Dashboards** → **+ New** → **Import**
- Upload each JSON file from `docs/observability/dashboards/`
- Accept default settings (Prometheus UID auto-detection)
- Click **Import**

### 3. Configure Prometheus Data Source
Grafana will auto-detect if:
- Prometheus is running at `http://localhost:9090`
- Data source UID is `prometheus-uid`

If not auto-detected, manually create:
- **Settings** → **Data Sources** → **Add Data Source**
- Type: Prometheus
- URL: `http://localhost:9090`
- Save & Test

## Dashboard Details

### Operations Dashboard (30min rolling window)
- **Request Latency** — p95, p99 (milliseconds)
- **Throughput** — Requests/sec by method & path
- **5xx Error Rate** — Percentage of failed requests
- **Success Rate** — Percentage of successful requests

**Useful for**: Real-time traffic monitoring, incident investigation, performance debugging

---

### SLO Dashboard (30-day rolling window)
- **Availability SLO Compliance** — Service uptime % (target 99.5%)
- **Latency SLO Compliance** — p95 latency target (target 99.9%)
- **Error Budget Burn Rate** — How fast we're consuming monthly budget
- **Error Budget Remaining** — By 1d, 7d, 30d windows
- **Active SLO Breach Alerts** — Real-time breach detection

**Useful for**: SLO health tracking, capacity planning, breach response

---

### System Health Dashboard (6-hour rolling window)
- **CPU Usage Gauge** — Current %; threshold: yellow 70%, red 85%
- **Memory Usage Gauge** — Current %; threshold: yellow 75%, red 90%
- **Disk Usage Gauge** — Current %; threshold: yellow 80%, red 95%
- **Queue Depth** — Messages by service & queue (indicates backpressure)
- **Service Health** — up/down status by job & instance

**Useful for**: Infrastructure capacity, bottleneck identification, service dependency health

## Prometheus Metrics Required

All dashboards expect these metrics (exported via `alert-rules.yml` + `slo-rules.yml`):

### Request Metrics (http_* prefix)
- `http_request_duration_seconds_bucket` — Request latency histogram
- `http_requests_total` — Total request counter (labeled with status)

### Node Metrics (node_* prefix)
- `node_cpu_usage_percent`
- `node_memory_usage_percent`
- `node_disk_usage_percent`

### Queue Metrics
- `queue_depth` — Message queue length per service

### SLO Metrics (slo_* prefix)
- `slo_availability_compliance`
- `slo_latency_compliance`
- `slo_error_budget_remaining`
- `slo_error_budget_burn_rate`

### Alert Status
- `ALERTS` — Prometheus alert firing status

## Wiring to MetricsServer

MetricsServer (cic-ingestion/MetricsServer.ts) must:

1. **Export http_* metrics** to Prometheus scrape endpoint
2. **Export node_* metrics** (via node-exporter sidecar or instrumentation)
3. **Export queue_* metrics** (from message broker instrumentation)
4. **Calculate slo_* metrics** (via Prometheus recording rules in alert-rules.yml)

### Startup Verification

```bash
# 1. Verify Prometheus targets are green
curl http://localhost:9090/api/v1/targets

# 2. Check metrics are available
curl 'http://localhost:9090/api/v1/query?query=http_requests_total'

# 3. Verify SLO rules loaded
curl 'http://localhost:9090/api/v1/rules'
```

## Customization

Each dashboard is fully editable in Grafana UI:

- **Change time windows**: Click time selector (top-right)
- **Add/remove panels**: Edit mode (pencil icon)
- **Adjust thresholds**: Panel settings → Field Config
- **Change query intervals**: Panel → Query
- **Export updated JSON**: Dashboard settings → JSON Model

## Next Steps

1. Import all three dashboards
2. Wire MetricsServer to export required metrics
3. Run end-to-end test:
   - Generate traffic to services
   - Verify metrics appear in Operations Dashboard
   - Verify SLO compliance in SLO Dashboard
   - Verify service health in System Health Dashboard
4. Set up Slack/PagerDuty integration for alert notifications

## Troubleshooting

### "No data" in panels
- Check Prometheus is scraping targets: `http://localhost:9090/targets`
- Verify metrics exist: Query in Prometheus UI
- Check time range (panels default to last 6h)

### "Prometheus UID mismatch"
- Grafana auto-detects; if not:
  - Edit dashboard JSON: change `"uid": "prometheus-uid"` to actual UID
  - Find UID in **Settings** → **Data Sources** → Prometheus

### SLO metrics not appearing
- Verify `slo-rules.yml` is loaded in Prometheus
- Check recording rule evaluation: `http://localhost:9090/graph`
- SLO rules are evaluated every 30s; wait 60s after startup
