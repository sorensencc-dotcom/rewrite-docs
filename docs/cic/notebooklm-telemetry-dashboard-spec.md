---
title: "NotebookLM Telemetry Dashboard Specification (v1.0)"
summary: "**Status:** Proposed"
updated: "2026-07-09"
tags:
  - cic
---
# NotebookLM Telemetry Dashboard Specification (v1.0)

**Status:** Proposed  
**Version:** 1.0.0  
**Date:** 2026-07-09  
**Owner:** Architecture Lead (Chris)  
**Location:** `docs/cic/notebooklm-telemetry-dashboard-spec.md`

---

## 1. System Overview

This specification outlines the telemetry collection framework, database schemas, and operator dashboard panels required to monitor the NotebookLM substrate during Phase 6 (Shadow-Mode) and Phase 7 (Production). 

```
                                  ┌───────────────────────────────┐
                                  │      Rewrite Labs Agents /    │
                                  │       TorqueQuery Server      │
                                  └───────────────┬───────────────┘
                                                  │ (Emits JSON Logs)
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │     Vector Store / SQLite /   │
                                  │      tq-telemetry-db          │
                                  └───────────────┬───────────────┘
                                                  │ (Reads)
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Operator Web Console UI     │
                                  │ * Latency, Drift, and Alerts  │
                                  └───────────────────────────────┘
```

The system ensures real-time visibility into federated search latencies, auth expires, validation auto-halts, and token drift score statistics.

---

## 2. Telemetry Database Schema

All events are stored locally in a sqlite database or equivalent logging backend (`tq-telemetry-db`).

### 2.1 Event Schema: `notebooklm_query_events`
```sql
CREATE TABLE notebooklm_query_events (
    event_id VARCHAR(36) PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    query_hash VARCHAR(64) NOT NULL,
    target_namespace VARCHAR(50) NOT NULL,
    notebook_uuid VARCHAR(36) NOT NULL,
    latency_ms INTEGER NOT NULL,
    mcp_status_code INTEGER NOT NULL,
    partial_results BOOLEAN NOT NULL DEFAULT 0,
    error_code VARCHAR(50),
    rrf_score_max REAL,
    shadow_mode BOOLEAN NOT NULL DEFAULT 1
);
```

### 2.2 Event Schema: `agent_validation_events`
```sql
CREATE TABLE agent_validation_events (
    validation_id VARCHAR(36) PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    agent_name VARCHAR(50) NOT NULL, -- 'RedesignAgent' | 'OutreachAgent'
    session_id VARCHAR(50) NOT NULL,
    validation_latency_ms INTEGER NOT NULL,
    drift_score REAL,
    halt_triggered BOOLEAN NOT NULL DEFAULT 0,
    mismatched_tokens JSON, -- Key-value map of expected vs found values
    forbidden_topic_hit VARCHAR(50), -- 'pricing' | 'competitor' | 'jargon'
    forbidden_topic_phrase VARCHAR(256),
    shadow_mode BOOLEAN NOT NULL DEFAULT 1
);
```

---

## 3. Real-Time Telemetry SLO Alerts

Alarms are generated and sent to target hooks when telemetry metrics violate target boundaries:

| Metric Indicator | Threshold Limit | Alert Priority | Action Sequence |
| :--- | :--- | :--- | :--- |
| `NotebookLMAuthError` | Count $\gt 0$ | **CRITICAL (SEV-1)** | Ping page alerts immediately to trigger operator cookie re-auth |
| Federated Latency | p95 $\gt 1500\text{ms}$ | **HIGH (SEV-2)** | Flag performance degradation; check MCP host memory |
| Timeout Rate | $\gt 1.0\%$ (hourly) | **HIGH (SEV-2)** | Trigger fallback audit; verify google account limit status |
| Namespace Bleed | Count $\gt 0$ | **CRITICAL (SEV-1)** | Stop TorqueQuery `/search/federated`; trigger instant rollback |

---

## 4. UI Dashboard Mockup

The Operator Web UI includes three core monitoring components:

### 4.1 System Status & SLO Banner
```
========================================================================
[System: GREEN ]  MCP Daemon: RUNNING | Shadow Mode: ACTIVE (Phase 6)
------------------------------------------------------------------------
p95 Latency: 1320ms (SLO <= 1500ms)      Timeout Rate: 0.4% (SLO <= 1.0%)
Auto-Halt: 162ms (SLO <= 200ms)          Drift FPR: 0.00% (SLO <= 0.05%)
========================================================================
```

### 4.2 Real-Time Stream Log View
Displays the last 5 events with filter settings (All / Faults / Halts):
```
[2026-07-09T01:42:00Z] RedesignAgent (session-103) - Validation Completed in 5ms. Drift: 0.00 (Ok)
[2026-07-09T01:42:15Z] TorqueQuery - POST /search/federated - 200 OK (1120ms). Namespace: client_briefs
[2026-07-09T01:43:01Z] OutreachAgent (session-104) - WARNING: Forbidden competitor name detected: "AcmeCorp". Shadow Halt (No-op).
[2026-07-09T01:43:30Z] RedesignAgent (session-105) - WARNING: Drift score 0.50 exceeded limit. Shadow Halt (No-op).
```

---

## 5. Telemetry Ingestion Integration API

TorqueQuery exposes a private logging hook at `/telemetry/events` which agents invoke post-validation:

```typescript
export interface LogTelemetryInput {
  agentName: string;
  sessionId: string;
  validationLatencyMs: number;
  driftScore?: number;
  haltTriggered: boolean;
  mismatchedTokens?: Record<string, { expected: string; found: string }>;
  forbiddenTopicHit?: string;
  forbiddenTopicPhrase?: string;
  shadowMode: boolean;
}

export async function sendTelemetryEvent(input: LogTelemetryInput): Promise<void> {
  try {
    await fetch('http://localhost:8000/telemetry/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  } catch (err) {
    console.error('[Telemetry] Failed to ingest validation event', err);
  }
}
```

---

## See Also

* [NotebookLM Integration Plan v1.0](notebooklm-integration-plan.md) - Baseline plan and rollout gates
* [Unified Reference Index](../index-unified.md) - System maps and reference points
