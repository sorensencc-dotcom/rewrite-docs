---
title: "Unified CIC + Rewrite Labs Systems"
summary: "# Unified CIC + Rewrite Labs Systems"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Unified CIC + Rewrite Labs Systems

Complete documentation for all subsystems across CIC and Rewrite Labs.

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated

> Note: there is no monolithic `cic-os/` codebase. CIC-OS functionality is distributed across `src/` (runtime, lib, resilience), `cic-ingestion/`, `governance/`, `roadmap-runner/`, `services/`, and `toolforge/`. The `cic-os/` directory contains only a personal-knowledge-base stub.

## System Categories

### 🔹 MAAL & Governance — ✅

Core autonomous agent learning framework with deterministic governance. Code: `governance/` (orchestrator, approval-gate, promotion-rollback, audit-policy, `cicState.json`).

- [MAAL Architecture](../cic/phases/phase-1-overview.md)
- [Governance Framework](../cic/GOVERNANCE.md)
- [Memory & State](../cic/phases/phase-1-ledger-substrate.md)

### 🔹 Routing & Federation — ✅

Model routing, fallback chains, and multi-vendor federation. Code: `src/cic-runtime/routing/` (5 routers) + `src/resilience/fallbackChain.ts`.

- [Local-First Routing](../architecture/routing.md)
- [Federation Layer](../api/federation-layer.md)
- [Provider Configuration](../gateway/providers.md)

### 🔹 Ingestion & Extraction — ✅

Data pipeline from crawl → scrape → map → index (stage config: `roadmap-runner/ingestion-config.json`; code: `cic-ingestion/src/harvester/`, `cic-ingestion/src/drift/`).

- [Ingestion Architecture](../architecture/ingestion.md)
- [Vault Extraction (RL)](../rewrite-labs/00-RL-INDEX.md)
- [CodeFlow Harvester](../cic/harvester.md)

### 🔹 Knowledge Systems — ✅

Knowledge graphs, memory governance, and semantic drift. Four distinct drift detectors exist — see the disambiguation table in [Drift Classification](../architecture/drift.md).

- [Knowledge Graph Setup](../reference/knowledge-graph/quick-start.md)
- [Drift Classification](../architecture/drift.md)
- [Memory Governance](../cic/phases/phase-23-6-memory-explorer-ui.md)

### 🔹 Roadmap Runner — Build ✅ / Runner ⏸

Phase execution engine (`roadmap-runner/`): scheduler, Docker runner, success gates, state store. All configured phases currently pending execution.

- [Roadmap Runner Reference](../operations/roadmap-runner.md)
- [CIC Roadmap](../roadmaps/cic-roadmap.md) · [RL Roadmap](../roadmaps/rewrite-labs-roadmap.md)

### 🔹 Cost & Notification — ✅

Cost analytics + Slack/Email digests. Code: `src/lib/notify/CostNotifier.ts`, `src/lib/report/CicCostComputeReport.ts`.

- [Cost Tracking](../operations/cost-tracking.md)

### 🔹 Services — 🔄

Agentic experience layer: Gemini Coach + Antigravity IDE integration (`services/`).

- [Services Reference](../reference/services.md)

### 🔹 Toolforge — ✅ (skills) / 💡 (agents)

Skill platform (`toolforge/skills/`, 10 skills). Agent directories (outreach/delivery/analysis) do not exist yet.

- [Toolforge Reference](../reference/toolforge.md)

### 🔹 Observability & Operations — ✅

Monitoring, tracing, determinism verification, sandbox.

- [Observability Plan](../operations/monitoring.md)
- [Operations Guide](../operations/running.md)

## Phase Roadmaps

- [CIC Roadmap](../roadmaps/cic-roadmap.md) — all phases with status
- [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md) — RL-4.x dual status
- [Unified Roadmap](../roadmaps/unified-roadmap.md) — cross-system alignment
- [Phase 1–4: Foundation](../cic/phases/phase-1-overview.md) ✅
- [Phase 5: TorqueQuery](../cic/phases/phase-5-torquequery-v2-deployment-guide.md) ✅
- [Phase A–C: Hardening](../cic/phases/phase-a-optimization-summary.md) ✅
- [Phase 26: Implementation](../implementation/phase-26/summary.md) — Build ✅ / Runner ⏸

## Integration Points

| System | CIC | RL | Shared |
|--------|-----|----|----|
| Governance | ✓ | ✓ | Memory, State |
| Routing | ✓ | — | Provider mgmt |
| Ingestion | CodeFlow | Vault | Pipeline |
| Knowledge | Graph | Mirror | Extraction |
| Operations | Sandbox-3 | Infra | Monitoring |

## Quick Links

- [CIC Index](../cic/index.md) — all CIC phases & components
- [RL Index](../rewrite-labs/00-RL-INDEX.md) — Rewrite Labs vault system
- [Architecture Overview](../architecture/overview.md)
- [Full API Reference](../api/overview.md)
