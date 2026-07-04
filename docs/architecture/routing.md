---
title: routing
summary: ""
created: "2026-07-03T19:44:37.628Z"
updated: "2026-07-03T19:44:37.628Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Routing Engine & Policies

The Routing layer manages how requests are mapped to different backend LLM providers (e.g., Ollama, Llamafile, Mock) based on local-first constraints, performance metrics, and active drift scores.

## Routing System Design

```mermaid
graph TD
    A[Unified Chat Request] --> B[Local-First Router]
    B -->|Check config| C{Local-First Enabled?}
    C -->|Yes| D[Filter to Local Backends]
    C -->|No| E[Allow Cloud Backends]
    
    D --> F[Evaluate Drift Penalty]
    F --> G{Is preferred backend drift > threshold?}
    G -->|Yes| H[Select lowest-drift backup provider]
    G -->|No| I[Route to preferred backend]
    
    H & I --> J[Execute Request]
```

---

## ⚙️ 1. Local-First Constraints

When `localFirst` mode is enabled in runtime configuration:
* Cloud backends are completely isolated and bypassed.
* All processing must remain on-device or within local network boundaries.
* The system chooses from registered local backends: `ollama`, `llamafile`, and `mock` (resilience provider).

---

## 📈 2. Drift-Aware Adaptive Routing

The router queries the live `CICState` to obtain the calculated drift scores of all registered providers.
* Each provider starts with a drift score of `0.0`.
* High token usage or latency breaches penalize the provider, increasing its score.
* Providers with drift scores exceeding the `SLA_DRIFT_THRESHOLD` (default: `0.5`) are de-prioritized.
* If a provider reaches critical drift (`>0.8`), routing to it is frozen, and requests fall back to the healthiest available local alternative.

---

## 🛡️ 3. SLA Failover Policies

In the event of a provider failure or latency spike, the router triggers recovery playbooks:
* **Backend Recovery Playbook:** Initiated if the primary provider becomes unresponsive.
* **Routing Stability Playbook:** Freezes routing to a known-stable backend to prevent routing oscillation if backend performance fluctuates.

Playbook toggles and freeze flags live in `governance/cicState.json` (`activePlaybooks`, `routingFrozen`).

---

## 🧩 4. Routing Engine Implementation (`src/cic-runtime/routing/`)

Five router modules implement the v3 routing stack:

| Module | Role |
|--------|------|
| `latency-aware-router.ts` | Escalates when historical p99 hits SLO budget (breach) or 90% of it (danger zone) |
| `stability-router-v3.ts` | Converts drift score into stability penalty (100 at high drift, 50 at medium) |
| `reproducibility-router.ts` | Escalates when historical reproducibility score < 0.9 |
| `model-scoring-v3.ts` | Trust score from drift score + SLO violation rate + repro score (100-point scale with tiered deductions) |
| `tier-escalation-v3.ts` | Combines stability + latency + reproducibility routers into sandbox tier decisions (S1/S2/S3) |

Fallback behavior on provider failure is handled by `src/resilience/fallbackChain.ts` (priority-ordered providers, CLOSED/OPEN/HALF_OPEN circuit states, consecutive-failure threshold).

**Services routing:** Gemini Coach carries its own request-level routing engine (`services/gemini-coach/src/routing/`), consumed by the Antigravity IDE integration — see [Services Reference](../reference/services.md).
