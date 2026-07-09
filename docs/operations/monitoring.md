---
title: "Observability & Monitoring"
summary: "Real-time metrics and health checks for CIC services."
updated: "2026-07-09"
tags:
  - operations
---
# Observability & Monitoring

Real-time metrics and health checks for CIC services.

## Dashboards

- **Main:** http://localhost:3100/observability
- **Ingestion:** http://localhost:3000/metrics

## Key Metrics

- Ingestion throughput (records/min)
- Extraction accuracy (%)
- API latency (p50, p95, p99)
- Memory usage (MB)

## Alerts

Configured via Datadog (production) / local thresholds (dev)

Referenced by:
- `reference/cic-rl-cross-reference.md`

---

**Dashboards:** Navigate to the observability directory in the project root.
