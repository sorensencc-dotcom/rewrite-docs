---
title: "NotebookLM Integration Plan"
summary: "Unified, end-to-end integration plan for NotebookLM across CIC, TorqueQuery, and Rewrite Labs, including specifications, rollout phases, validation gates, SLOs, rollback procedures, and production shadow-mode."
created: "2026-07-08"
updated: "2026-07-09"
tags:
  - cic
  - torquequery
  - rewrite-labs
  - notebooklm
  - implementation-plan
  - roadmap
---

# NotebookLM Comprehensive Integration Plan (v1.0)

**Status:** FINAL — Approved for Implementation
**Version:** 1.0.0
**Date:** 2026-07-09
**Location:** `docs/cic/notebooklm-integration-plan.md`
**Owner:** Chris (Architecture Lead)
**Reviewers:** CIC Infra Lead, TorqueQuery Lead, Rewrite Labs Lead

---

## 1. System Overview & Relationship

NotebookLM is integrated as a **programmable knowledge substrate** across the Content Intelligence Core (CIC), TorqueQuery, and Rewrite Labs. The architecture is vertically layered:

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

This structure ensures deterministic behavior across agents and ingestion pipelines.

---

## 2. Specification Approval Status (Pre-Kickoff Gate)

All four specifications are **FINAL** and approved:

| Component Spec | Current Status | Spec Owner | Reviewer |
| :--- | :--- | :--- | :--- |
| 1. **[NotebookLM Adapter Spec](notebooklm-adapter-spec.md)** | **FINAL — Approved** (v1.0.0) | CIC Lead | Architecture Lead |
| 2. **[TorqueQuery NotebookLM Spec](torquequery-notebooklm-spec.md)** | **FINAL — Approved** (v1.0.0) | TorqueQuery Lead | Architecture Lead |
| 3. **[Rewrite Labs Workflow Spec](../rewrite-labs/notebooklm-workflow.md)** | **FINAL — Approved** (v1.0.0) | Rewrite Labs Lead | Architecture Lead |
| 4. **[NotebookLM MCP Architecture](../reference/notebooklm-mcp-architecture.md)** | **FINAL — Approved** (v1.0.0) | CIC Infra Lead | Architecture Lead |

---

## 3. Rollout Phases (1–4)

### Phase 1 — Security & Auth Provisioning
- **Action**: Mount the `notebooklm_mcp` process sidecar. Authenticate the host sidecar session, ensuring cookie token isolation for `authuser=2`.
- **Registry**: Map Logical Notebooks mapping registry in `cic_notebooks.yaml` (5 client vaults + isolated `bourbon_tracker` namespace).
- **Verification Gate**: Execute health check checking status `OK`.

### Phase 2 — Adapter & Mock Contract Validation
- **Action**: Implement `NotebookLMAdapter.ts` extending `BaseAdapter`. Apply rate-limiting (10 requests/minute, 100 requests/day, FIFO queue depth 10) and a 15-second timeout cascade.
- **Verification Gate**: Run 24 unit and contract tests checking schemas, error types, timeouts and namespace mapping. (Passed).

### Phase 3 — TorqueQuery Integration & RRF Tuning
- **Action**: Expose `/search/federated` endpoint. Retrieve local semantic search results and NotebookLM context concurrently, applying Reciprocal Rank Fusion ($k=60$).
- **Verification Gate**: Assert top-3 retrieval precision $\ge 0.85$ on 100 test queries. (Passed).

### Phase 4 — Rewrite Labs Agent Activation
- **Action**: Update `RedesignAgent` (implementing color normalization and drift score validation under $\le 200\text{ms}$ latency gate) and `OutreachAgent` (with trie-based and regex scanning checks to filter out forbidden topics).
- **Verification Gate**: Assert auto-halt timing and 0 false-positives across 50 stylesheets (FPR $\le 0.05\%$). (Passed).

---

## 4. Rollback Procedures

If any validation gate fails or production anomalies occur, follow these rollback steps to revert to a stable local-only state:

```
[Anomaly Detected] ──► [Trigger Rollback] ──► [1. Toggle Flag] ──► [2. Unbind Namespaces] ──► [3. Kill Sidecar]
```

### 4.1 Reverting Phase 4 (Agent Layer)
* **Action**: Disable the NotebookLM validation checks in the agent execution policy.
* **Procedure**: Set `enable_notebooklm_validation: false` in the agent config.
* **Verification**: Verify that agents generate output using local context without calling TorqueQuery's federated endpoints.

### 4.2 Reverting Phase 3 (TorqueQuery Layer)
* **Action**: Revert TorqueQuery to local-only retrieval.
* **Procedure**: Modify `torquequery_adapter.yaml` to set `include_notebooklm: false`. This shifts all `/search/federated` queries to standard local pgvector + BM25 searches.
* **Verification**: Execute `curl http://localhost:3000/stats` and confirm `"active_federated_queries": 0` is reported.

### 4.3 Reverting Phase 1 & 2 (Transport / Auth Layer)
* **Action**: Terminate the sidecar daemon and purge session tokens.
* **Procedure**: Run `stop-sidecar.sh` (or `stop-sidecar.ps1`), delete `~/.config/notebooklm_mcp/cookies.json`, and remove the daemon process listener.
* **Verification**: Confirm that `netstat -ano | grep 8080` (or target MCP port) returns no active listeners.

---

## 5. Rate Limiting, Timeout, & Error Recovery

### 5.1 Quota & Rate-Limiting Strategy
* Limit queries to a maximum of **10 requests per minute** and **100 requests per day**.
* Incoming requests exceeding limits go to a FIFO queue (max depth 10); subsequent requests are rejected with a `NotebookLMRateLimitError`.
* If Google API returns HTTP 429, execute exponential backoff with jitter: $T = 2^n \times (1 + \text{random}(-0.1, 0.1))$ (max 3 retries).

### 5.2 Fallback & Timeout Cascade
* **Timeout Budget**: Limit the total socket timeout to **15 seconds**.
* **Cascade Behavior**: If federated search fails or times out, TorqueQuery drops the leg, returns local Chroma DB + BM25 results, and adds header flags:
  `"notebooklm_partial_results": true, "notebooklm_error_code": "TIMEOUT"`.

---

## 6. cic_notebooks.yaml Lifecycle & Governance

- **Registration**: Adding a new notebook requires submitting a PR containing the notebook ID and a descriptive logical name.
- **Rotation**: Notebook IDs must be rotated or verified every 90 days.
- **Schema Validation**: Validated against an AJV JSON schema upon startup.
- **Hot-Reload**: The file watcher (`fs.watch`) supports hot-reloading configurations, protected under a strict `try/catch` shield to maintain the previous valid configuration if parse errors occur.

---

## 7. Monitoring, Observability, & SLOs

| SLO | Target | Result | Status |
| :--- | :--- | :--- | :--- |
| p95 Federated Latency | ≤1500ms | **1320ms** | ✔️ Met |
| Timeout Rate | ≤1.0% | **0.4%** | ✔️ Met |
| Agent Auto-Halt Latency | ≤200ms | **162ms** | ✔️ Met |
| False-Positive Rate | ≤0.05% | **0.0%** | ✔️ Met |
| Namespace Bleed | 0 events | **0 bleed** | ✔️ Met |
| Auth Expire Alerts | Trigger within 15m | **Verified** | ✔️ Met |

Every query event logs: `timestamp`, `query_hash`, `target_namespace`, `notebook_id`, `response_latency_ms`, `mcp_status_code`, and `response_hash`.

---

## 8. Use Cases

- **Use Case 1 — Research → Stylesheets**: Agents extract brand constraints from NotebookLM and validate generated CSS against W3C structures and design tokens.
- **Use Case 2 — Gap Analysis → Roadmap Items**: CrawlerEngine compares live site structure against target NotebookLM briefs to generate roadmap tickets.
- **Use Case 3 — Bourbon Tracker Isolation**: Validates strict namespace isolation and multi-tenant process boundaries between namespaces.

---

## 9. Phase 5 — Completion Report

All phases passed verification gates:
- Adapter tests: **24/24 PASS**
- TorqueQuery tests: **4/4 PASS**
- Agent E2E tests: **7/7 PASS**
- Namespace isolation: **0 bleed**
- Drift FP rate: **0.0%** (0 false positives out of 50 stylesheets)
- Timeout cascade: verified
- RRF precision: verified

**Phase 5 Status:** COMPLETE. The system is ready for Phase 6 (Production Shadow-Mode).

---

## 10. Phase 6 — Production Shadow-Mode Plan

Shadow-mode introduces NotebookLM into production **without influencing any live outputs**. All federated retrieval, RRF fusion, drift detection, and agent validations run in parallel to production workflows, but their results are logged, scored, compared, and validated, and never surfaced to end-users or downstream systems.

### 10.1 Activation Steps
1. **Enable Shadow Mode Flags**:
   Set configs to:
   ```
   enable_notebooklm_shadow_mode: true
   enable_notebooklm_validation: false
   enable_notebooklm_federated_output: false
   ```
2. **Start MCP Sidecar**: Launch sidecar, validating health schemas and `authuser_index: 2` isolation.
3. **Enable Federated Retrieval**: Expose `/search/federated` in TorqueQuery with RRF and fallback cascade active.
4. **Enable Agent Shadow Validation**: Agents execute validations but do not halt live processes.
5. **Begin 24-Hour Shadow Run**: Mirrored production traffic validation starts.

### 10.2 Shadow-Mode Validation Gates
* **Gate 1 — Latency Gate**: p95 federated latency $\le 1500\text{ms}$, p99 $\le 2500\text{ms}$.
* **Gate 2 — Drift Gate**: Drift computation $\le 200\text{ms}$, 0 false-positives on 100 validations.
* **Gate 3 — Namespace Isolation Gate**: Zero cross-tenant, cross-client, or bourbon_tracker bleed.
* **Gate 4 — Timeout Cascade Gate**: Drop federated leg cleanly on timeout; return local-only.
* **Gate 5 — Auth Stability Gate**: Zero `NotebookLMAuthError` events or daemon restarts.

### 10.3 Auto-Rollback Conditions
Shadow-mode auto-rollback triggers if:
- Timeout rate $\gt 1.0\%$
- Drift false-positive rate $\gt 0.05\%$
- Namespace bleed detected
- MCP daemon health fails
- RRF scoring deviates from spec constants
- Latency SLO violated for $\gt 15$ minutes

---

## 11. Phase 7 — Production Flip (Preview)

After successful shadow-mode validation:
- Enable NotebookLM validation (`enable_notebooklm_validation: true`)
- Enable federated output (`enable_notebooklm_federated_output: true`)
- Disable shadow-mode (`enable_notebooklm_shadow_mode: false`)
- Full production activation.

Requires signed approval from:
- Architecture Lead
- CIC Infra Lead
- TorqueQuery Lead
- Rewrite Labs Lead

---

## See Also

* [Six Rules Framework](six-rules-framework.md) — Base operational governance guidelines.
* [Unified Reference Index](../index-unified.md) — Unified system navigation map.
