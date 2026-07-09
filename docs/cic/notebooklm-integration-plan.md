---
title: "NotebookLM Integration Plan"
summary: "Comprehensive master plan linking and coordinating the integration of the NotebookLM Adapter, TorqueQuery Module, Rewrite Labs Workflow, and MCP Architecture"
created: "2026-07-08"
updated: "2026-07-08"
tags:
  - cic
  - torquequery
  - rewrite-labs
  - notebooklm
  - implementation-plan
  - roadmap
---

# NotebookLM Comprehensive Integration Plan

**Status:** Proposed / Under Review  
**Date:** 2026-07-08  
**Location:** `docs/cic/notebooklm-integration-plan.md`  

---

## 1. Overview & System Relationship

This document serves as the **Master Integration Plan** for incorporating NotebookLM as a programmable knowledge substrate across the Content Intelligence Core (CIC), TorqueQuery, and Rewrite Labs. 

We have established four operational specifications that define the layers of this integration:

```
                  ┌──────────────────────────────────────────────┐
                  │          Rewrite Labs Workflow               │
                  │  * Client Knowledge Vaults                   │
                  │  * Redesign/Outreach grounding workflows     │
                  │  [Spec: docs/rewrite-labs/notebooklm-workflow.md]
                  └──────────────────────┬───────────────────────┘
                                         │ (Retrieves Context)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │         TorqueQuery NotebookLM               │
                  │  * Namespace mapping                         │
                  │  * Federated RRF search & fusion             │
                  │  [Spec: docs/cic/torquequery-notebooklm-spec.md]
                  └──────────────────────┬───────────────────────┘
                                         │ (Queries)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │           NotebookLM Adapter                 │
                  │  * Python library wrapper                    │
                  │  * Six Rules safety & exception framework     │
                  │  [Spec: docs/cic/notebooklm-adapter-spec.md] 
                  └──────────────────────┬───────────────────────┘
                                         │ (Communicates via JSON-RPC)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │         NotebookLM MCP Architecture          │
                  │  * Stateless daemon process bounds           │
                  │  * Cookie token isolation / stdio transport  │
                  │  [Spec: docs/reference/notebooklm-mcp-architecture.md]
                  └──────────────────────────────────────────────┘
```

---

## 2. Specification Directory

Below is the directory of all specifications and deliverables written for this integration:

| Component Spec | Focus Area | Key Architectural Deliverable |
| :--- | :--- | :--- |
| 1. **[NotebookLM Adapter Spec](notebooklm-adapter-spec.md)** | Core Client Library | Stateless Python client wrapper mapping raw inputs to standardized `NotebookAnswer` schemas with strict execution timeouts. |
| 2. **[TorqueQuery NotebookLM Spec](torquequery-notebooklm-spec.md)** | Retrieval & Federation | Federated query routing engine incorporating Reciprocal Rank Fusion (RRF) for merging local pgvector results with external corpora. |
| 3. **[Rewrite Labs Workflow Spec](../rewrite-labs/notebooklm-workflow.md)** | Agent Orchestration | Playbooks for Crawler, Redesign, and Outreach agents grounding code generation in client-specific briefs. |
| 4. **[NotebookLM MCP Architecture](../reference/notebooklm-mcp-architecture.md)** | Host & Security Topology | Detailed process boundary definition separating Google authentication cookies from downstream agent environments using stdio channels. |

---

## 3. Rollout Phases & Gates

```
[Phase 1: Security Setup] ==> [Phase 2: Adapter & Mocks] ==> [Phase 3: TorqueQuery Fusion] ==> [Phase 4: Agent Activation]
```

### Phase 1: Security & Auth Provisioning
1. Mount the `notebooklm_mcp` process sidecar.
2. Authenticate the host sidecar session, ensuring the daemon isolates the cookie profile matching the target `authuser` account index (e.g., `authuser=2`). Lock `cookies.json` to local OS permissions (`0600`).
3. Verify that all notebook IDs registered in `cic_notebooks.yaml` are shared and accessible by the authenticated session.
4. **Verification Gate**: Execute `python -m notebooklm_mcp health --check` and assert it returns status `OK` matching the Phase 1 health-check schema.

### Phase 2: Adapter Implementation & Mock Testing
1. Package the Python `NotebookLM Adapter` code.
2. Write schema-validation tests utilizing JSON fixtures representing mock notebook outputs.
3. **Verification Gate**: Run `pytest tests/test_notebooklm_adapter.py`. All tests must pass.

### Phase 3: TorqueQuery Integration & RRF Tuning
1. Update TorqueQuery’s Express router to expose the `/search/federated` endpoint.
2. Wire RRF fusion algorithms and namespace mapping configs (`cic_notebooks.yaml`).
3. **Verification Gate**: Execute a federated search test. Assert RRF top-3 retrieval precision is $\ge 0.85$ against a pre-annotated test evaluation set.

### Phase 4: Rewrite Labs Agent Activation
1. Update `RedesignAgent` and `OutreachAgent` to invoke TorqueQuery's federated endpoints.
2. Enable the **Define Done** and **Failure Mode Self-Recognition** check gates to halt tasks if style sheets deviate from the retrieved client briefs.
3. **Verification Gate**: Run E2E test suite asserting successful halt triggers under style deviations within a latency budget of $\le 200\text{ms}$ from constraint violation detection, with a false-positive rate $\le 0.05\%$.

---

## 4. Phase Gates & Acceptance Criteria

To ensure execution is deterministic, each rollout gate must meet the following quantified criteria:

| Phase | Gate Verification Target | Measurable Metric / Schema | Action on Failure |
| :--- | :--- | :--- | :--- |
| **Phase 1** | CLI Health Check | Returns schema: `{"status": "OK", "timestamp": str, "authenticated_user_index": int, "latency_ms": float}`. | Abort rollout, wipe cookies, prompt operator re-authentication. |
| **Phase 2** | Mock Adapter Tests | 100% pass rate on 24 unit test cases checking schema conformance and error types. | Lock code changes, reject PR, trigger rollback to previous version. |
| **Phase 3** | RRF Federated Search | Top-3 precision $\ge 0.85$ (at least 85% of top-3 results are relevant) on 100 test queries. | Adjust RRF constant $k$ (default 60) and weights; re-test. |
| **Phase 4** | Agent Auto-Halt Gate | Halt execution on validation violation in $\le 200\text{ms}$ with false-positive rate $\le 0.05\%$. | Disable active agent loops, notify operator, trigger Phase 4 rollback. |

---

## 5. Rollback Procedures

If any phase gate fails or production anomalies occur, follow these rollback steps to revert to a stable local-only state:

```
[Anomaly Detected] ──► [Trigger Rollback] ──► [1. Toggle Flag] ──► [2. Unbind Namespaces] ──► [3. Kill Sidecar]
```

### 5.1 Reverting Phase 4 (Agent Layer)
* **Action**: Disable the NotebookLM validation checks in the agent execution policy.
* **Procedure**: Set `enable_notebooklm_validation: false` in the agent config.
* **Verification**: Verify that agents generate output using local context without calling TorqueQuery's federated endpoints.

### 5.2 Reverting Phase 3 (TorqueQuery Layer)
* **Action**: Revert TorqueQuery to local-only retrieval.
* **Procedure**: Modify `torquequery_adapter.yaml` to set `include_notebooklm: false`. This shifts all `/search/federated` queries to standard local pgvector + BM25 searches.
* **Verification**: Execute `curl http://localhost:3000/stats` and confirm `"active_federated_queries": 0` is reported.

### 5.3 Reverting Phase 1 & 2 (Transport / Auth Layer)
* **Action**: Terminate the sidecar daemon and purge session tokens.
* **Procedure**: Run `stop-sidecar.sh` (or `stop-sidecar.ps1`), delete `~/.config/notebooklm_mcp/cookies.json`, and remove the daemon process listener.
* **Verification**: Confirm that `netstat -ano | grep 8080` (or target MCP port) returns no active listeners.

---

## 6. Rate Limiting, Timeout, & Error Recovery

NotebookLM lacks a public API and is subject to Google account rate ceilings. The adapter must defend the caller against timeouts and rate limits.

### 6.1 Quota & Rate-Limiting Strategy
* **Throttling Curve**: Limit queries to a maximum of **10 requests per minute** per Google Account index and **100 requests per day**.
* **Queuing**: Incoming requests exceeding the limit are placed in a FIFO queue with a maximum depth of 10. Subsequent requests are rejected with a `NotebookLMRateLimitError`.
* **Backoff Algorithm**: If the NotebookLM API returns HTTP 429 (Too Many Requests), execute an exponential backoff with jitter:
  $$T = 2^n \times (1 + \text{random}(-0.1, 0.1))$$
  where $n$ is the retry attempt ($n \le 3$).

### 6.2 Fallback & Timeout Cascade
* **Timeout Budget**: Limit the total socket timeout to **15 seconds**.
* **Cascade Behavior**:
  ```
  [Federated Query Started]
             │
             ├──► [Timeout > 15s or HTTP 429/503]
             │               │
             │               ▼ [Drop Federated Leg]
             │        [Return Local results + Header Flag]
             │               │
             │               ▼
             └──────► [Render Results]
  ```
  If a query times out or fails after retries, the federated search leg is dropped. TorqueQuery returns the local pgvector results immediately, flagging the metadata envelope with:
  `"notebooklm_partial_results": true, "notebooklm_error_code": "TIMEOUT"`.
  This prevents a NotebookLM hang from blocking the core CIC agent loop.

---

## 7. cic_notebooks.yaml Lifecycle & Governance

The notebook mapping file (`cic_notebooks.yaml`) acts as the directory for all external knowledge bases. To prevent configuration drift, it is governed by the following lifecycle rules:

### 7.1 Registration & Rotation Workflow
* **Registration**: Adding a new notebook requires submitting a PR containing the notebook ID and a descriptive logical name.
* **Rotation**: Notebook IDs must be rotated or verified every 90 days. A cron utility checks if the registered notebooks are still active.

### 7.2 Schema Validation Rules
* Upon server start, the configuration is validated against an AJV JSON schema:
```json
{
  "type": "object",
  "properties": {
    "notebook_mappings": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
        "pattern": "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
      }
    }
  },
  "required": ["notebook_mappings"]
}
```
* Invalid UUIDs block startup, preventing connection errors.

### 7.3 Hot-Reload vs. Restart
* The `cic_notebooks.yaml` file supports **hot-reloading**.
* A file watcher (`fs.watch` in Node, `watchdog` in Python) intercepts changes to the file, runs validation, and updates the in-memory routing map without requiring a server restart.
* **Try/Catch Shielding**: The watcher implementation must run parsing and schema validation inside a strict `try/catch` block. If validation fails (due to syntax errors or schema violations), the reload operation must abort immediately, log a warning to `stderr`, and maintain the previous valid in-memory configuration map without modifications.

### 7.4 Access Control
* The mapping configuration file is read-only for agent roles. 
* Modification rights are restricted to the CI/CD pipeline deployment key and administrators.

---

## 8. Monitoring, Observability, & SLOs

We establish precise Service Level Objectives (SLOs) to monitor the integration's health:

### 8.1 Service Level Objectives (SLOs)
* **p95 Query Latency**: $\le 1500\text{ms}$ for federated search operations under normal load.
* **Timeout Rate**: $\le 1.0\%$ of total federated requests over a 24-hour window.
* **Auth Expire Alert**: If the MCP sidecar returns `NotebookLMAuthError` (code `-32001`), fire a high-priority slack/pager alarm to trigger manual cookie renewal within 15 minutes.

### 8.2 Telemetry & Logging Targets
Every query event must be recorded in the TorqueQuery audit log containing:
* `timestamp` (ISO 8601 format)
* `query_hash` (SHA-256 of the normalized query text)
* `target_namespace`
* `notebook_id`
* `response_latency_ms`
* `mcp_status_code`
* `response_hash`

---

## 9. Testing & Integration Use Cases

These operational use cases serve as benchmarks to validate the end-to-end integration and boundaries of the NotebookLM subsystem.

### Use Case 1: Ingestion to Research & Treatment Documents
* **Objective**: Feed raw client materials from a NotebookLM notebook into final research reports and styling variable stylesheets.
* **Flow**:
  1. The operator uploads discovery transcripts, brand books, and briefs to the client's vault.
  2. The research agent issues standard questions via `query_notebook` to extract colors, typography, and constraints.
  3. The agent compiles the extracted requirements into `docs/cic/research-skill/` or translates them to active CSS stylesheets.
  4. **Validation Gate**: The *Define Done* pipeline checks generated style codes against the raw notebook answer chunks, raising an alert if any color or font deviates from the brief.

### Use Case 2: Rewrite Labs Gap Analysis to Roadmap Items
* **Objective**: Automate the creation of development roadmaps by comparing crawled site structures against target notebook briefs.
* **Flow**:
  1. `CrawlerEngine` executes a full crawl of the client's current live website.
  2. The research agent queries the NotebookLM brief for target specifications (e.g., `"Does the client require a SaaSPricingGate page?"`).
  3. The agent matches crawled URLs/routes against requirements, identifying gaps.
  4. Discovered gaps are packaged as new roadmap items (e.g. `roadmaps/tickets/batch-6/`) with built-in validation criteria, and added to the master execution backlog.

### Use Case 3: Isolated Subtopic Research (e.g., Bourbon Tracker)
* **Objective**: Verify strict process boundary isolation and multi-tenant namespace mapping using a completely unrelated research workflow.
* **Flow**:
  1. An operator sets up a custom notebook for personal bourbon tracking (`nb_bourbon_999`).
  2. Add the subtopic mapping to `cic_notebooks.yaml`:
     ```yaml
     notebook_mappings:
       bourbon_tracker: "482b69ee-6796-4990-bc9b-4425b11becd1"
     ```
  3. Weekly Gemini research digests on distillery statistics, pricing, and ratings are uploaded to the tracker.
  4. The system executes queries targeting the `bourbon_tracker` namespace (e.g., `"Which expressions scored above 95 in recent reviews?"`).
  5. **Validation Gate (Latency)**: Latency for non-federated bourbon queries must be $\le 2500\text{ms}$ at p95.
  6. **Validation Gate (Strict Isolation)**: Asserts that queries targeting the `bourbon_tracker` namespace return exactly **zero (0) hits** from client-related notebooks (`notebook_01` through `notebook_05`), and vice-versa, proving zero cross-talk bleed across tenants.

---

## See Also

* [Six Rules Framework](six-rules-framework.md) — Base operational governance guidelines.
* [Unified Reference Index](../index-unified.md) — Unified system navigation map.
