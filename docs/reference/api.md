> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Platform Engineering · **Review Cycle:** Quarterly

# API Reference

Unified API surface for CIC and Rewrite Labs agents. This document covers the Agents API,
routing contracts, drift detector interfaces, and deterministic stack invariants.

For the full OpenAPI spec, see `reference/agents-api.md`.

---

## Agents API

**Base URL:** `http://localhost:3118`  
**Source:** `src/server/agentsAPI.ts`  
**Start:** `npm run agents-api:dev`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents` | List all agents with status and metrics |
| `GET` | `/api/agents/{id}` | Full agent detail (config, system, metrics) |
| `GET` | `/api/agents/{id}/logs?limit=N` | Execution logs with level, skill, correlationId |
| `GET` | `/api/agents/{id}/executions?limit=N` | Past skill invocations with duration, cost, status |
| `POST` | `/api/agents/{id}/invoke` | Invoke a skill on an agent |
| `POST` | `/api/agents/{id}/pause` | Pause agent (status → offline) |
| `POST` | `/api/agents/{id}/restart` | Restart agent (status → starting) |
| `POST` | `/api/agents/{id}/snapshot` | Snapshot single agent |
| `POST` | `/api/agents/snapshot` | Snapshot all agents |

### Agent Status Values

| Status | Meaning |
|---|---|
| `healthy` | Operating normally |
| `degraded` | Partial functionality; errors detected |
| `offline` | Not executing; paused or down |
| `starting` | Initializing after restart |

### Response Schemas

**AgentListItem**
```typescript
interface AgentListItem {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "offline" | "starting";
  heartbeat: string;                // ISO 8601
  metrics: {
    executions24h: number;
    errors24h: number;
    cost24h: number;                // USD
    latencyP95: number;             // milliseconds
  };
  skills: string[];
}
```

**ExecutionRecord**
```typescript
interface ExecutionRecord {
  id: string;
  skill: string;
  durationMs: number;
  costUsd: number;
  status: "success" | "error";
  startedAt: string;               // ISO 8601
}
```

**LogEvent**
```typescript
interface LogEvent {
  ts: string;                      // ISO 8601
  level: "info" | "warn" | "error";
  message: string;
  skill?: string;
  correlationId?: string;
}
```

### Error Handling

All endpoints return `404` with `{ "error": "Agent not found" }` for unknown agent IDs.
Frontend hooks auto-degrade to mock data when the API is unreachable.

---

## CIC MCP Server

**Base URL:** `http://localhost:3100`  
**Health:** `GET /health`  
**Protocol:** MCP (Model Context Protocol) over HTTP

Key routes:

| Path | Description |
|---|---|
| `GET /health` | Liveness check |
| `GET /metrics` | Prometheus-compatible metrics |
| `POST /mcp` | MCP tool dispatch |

---

## Routing Contract

The Local-First Router exposes its decision logic via `governance/cicState.json`.

**Provider entry schema:**
```json
{
  "providerId": "ollama",
  "driftScore": 0.12,
  "status": "CLOSED",
  "lastSlaBreachAt": null,
  "activePlaybooks": []
}
```

**Routing decision thresholds:**

| Drift Score | Routing Behavior |
|---|---|
| `< 0.5` | Normal routing to preferred backend |
| `0.5 – 0.8` | De-prioritized; next provider tried first |
| `> 0.8` | Routing frozen; lowest-drift fallback selected |

See [Routing Engine](../architecture/routing.md) for SLA failover playbook details.

---

## Drift Detector API

**Library:** `cic-ingestion/src/drift/driftEngine.ts`  
**Invocation:** Wired into the ingestion daemon; also available as a library import.

**Drift event schema (audit trail):**
```json
{
  "event_type": "drift_penalty | drift_decay | drift_spike",
  "provider": "ollama",
  "previous_score": 0.30,
  "new_score": 0.60,
  "delta": 0.30,
  "trigger": "latency_breach",
  "timestamp": "2026-07-09T15:36:00Z"
}
```

**Penalty table:**

| Drift Magnitude | Penalty Applied |
|---|---|
| `< 0.2` | None |
| `0.2 – 0.4` | +0.1 |
| `0.4 – 0.6` | +0.3 |
| `≥ 0.6` | +0.5 |

Scores are capped at `1.0`. Decay cycle: −5% of current score every 30 seconds.

See [Drift Detection](../architecture/drift.md) for the full classification model.

---

## Seal & Verify CLI

**Binary:** `cic-cli`  
**Source:** `cic-cli.ts`

```bash
# Seal current phase
cic-cli seal --phase=27

# Verify sealed phase
cic-cli verify --phase=27

# Output: { "expected": "abc123...", "actual": "abc123...", "passed": true }
```

**Seal report schema:**
```json
{
  "phase": 27,
  "timestamp": "2026-07-09T20:00:00Z",
  "layers": {
    "access":     { "seal": "sha256-hash", "verify": true },
    "federation": { "seal": "sha256-hash", "verify": true },
    "snapshot":   { "seal": "sha256-hash", "verify": true }
  },
  "systemSeal": "sha256-of-all-layers",
  "passed": true
}
```

See [Sealing & Verification](../operations/sealing.md) for the full sealing workflow.

---

## Audit Log Schema

Every CIC session emits structured audit events to the immutable audit log:

```json
{
  "session_id": "ses_abc123",
  "event_type": "tool_call | safety_block | gate_approved | gate_expired | seal_complete | routing_decision",
  "timestamp": "2026-07-09T15:36:00Z",
  "tool_name": "search_web",
  "result_summary": "5 results returned",
  "skill_context": "researcher",
  "safety_outcome": "PASS | BLOCK",
  "duration_ms": 342
}
```

Retention: 90 days. Export: operator-only. See [CIC System §2.7](../architecture/CIC_SYSTEM.md).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AGENTS_API_PORT` | `3118` | Agents API server port |
| `MCP_PORT` | `3100` | MCP server port |
| `SESSION_IDLE_TIMEOUT_MIN` | `30` | Minutes before idle session hibernates |
| `SESSION_MAX_DURATION_HR` | `24` | Hours before hibernated session terminates |
| `AUDIT_LOG_RETENTION_DAYS` | `90` | Audit log retention period |
| `MAX_TOOL_CALLS_PER_SESSION` | `200` | Hard cap on tool calls per session |
| `CONFIRMATION_GATE_TIMEOUT_MIN` | `15` | Minutes before a pending gate expires |
| `SAFETY_EVAL_MODE` | `enforcing` | `enforcing` (blocks) or `monitoring` (dev only) |
| `SLA_DRIFT_THRESHOLD` | `0.5` | Drift score above which providers are de-prioritized |

> [!CAUTION]
> `SAFETY_EVAL_MODE=monitoring` must never be set in production deployments.
