# TorqueQuery Agentic Analytics Subsystem

The `src/agentic/` subsystem turns raw CIC telemetry into governance‑grade analytics:

- **Ingestion:** HTTP endpoints for sessions, requests, context slices, and review events.
- **Queueing:** Optional in‑memory queue + batch writer for high‑throughput inserts.
- **Rule Engine:** Pluggable rules over windowed telemetry.
- **Metrics:** Computation of promptDiscipline, contextHealth, reviewRigor, skillReuse, driftIndex, readinessIndex.
- **Materialization:** Rolling windows persisted to `agentic_metrics` and exposed via `agentic_metrics_latest`.
- **MCP:** Readiness, drift, and rule findings endpoints for CIC and IDEs.

## Layout

```text
src/agentic/
  ingestion/
    sessions.ts
    sessionRequests.ts
    contextSlices.ts
    reviewEvents.ts
  queue.ts
  batchWriter.ts
  context/
    loader.ts
  rules/
    engine.ts
    registry.ts
    types.ts
  metrics/
    computeMetrics.ts
    drift.ts
  jobs/
    materializeMetrics.ts
  mcp/
    getAgenticReadiness.ts
    getDrift.ts
    getRuleFindings.ts
```

## Data Model

Backed by the following tables:

- `agentic_sessions`
- `agentic_session_requests`
- `agentic_context_slices`
- `agentic_review_events`
- `agentic_metrics`
- `agentic_metrics_latest` (view)

## Lifecycle

1. CIC emits telemetry to `/agentic/*`.
2. TorqueQuery enqueues and batches inserts.
3. Metrics job runs over rolling windows.
4. Metrics are materialized into `agentic_metrics`.
5. MCP endpoints expose readiness, drift, and findings.
6. CIC governance consumes these metrics to gate operations.

## Materialization Job

`materializeMetricsForUserWorkspace(userId, workspace)` computes metrics over three rolling windows:

- **24h window**: Last 24 hours of telemetry
- **7d window**: Last 7 days of telemetry
- **30d window**: Last 30 days of telemetry

Each window:

1. Loads bounded `RuleContext` from ingestion tables
2. Runs `RuleEngine.evaluate()` (synchronous, deterministic)
3. Persists metrics to `agentic_metrics` via upsert

**Scheduling:** Job is called externally (cron, scheduler, or on-demand). Not self-scheduled.

**Latency:** ~500–2000ms per window depending on data volume.

**Fallback:** MCP endpoints query `agentic_metrics_latest` materialized view if no recent run exists.

## Extensibility

- Add new rules in `rules/registry.ts`.
- Adjust metric formulas in `metrics/computeMetrics.ts`.
- Add new MCP surfaces in `mcp/`.
