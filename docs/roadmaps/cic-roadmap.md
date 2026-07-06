---
title: "CIC Roadmap"
summary: "# CIC Roadmap"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Roadmap

Canonical status roadmap for all CIC phases. Compiled from `docs/cic/index.md`, `build-roadmap.json`, `.planning/ROADMAP.md`, and per-phase completion documents.

**Last updated:** 2026-07-03

## Status Legend

| Marker | Meaning |
|--------|---------|
| ✅ Done | Implemented and verified in repo (completion doc or passing verification exists) |
| 🔄 In Progress | Active work, partial artifacts in repo |
| 📋 Planned | Committed next step; referenced in a roadmap/plan file |
| 💡 Potential | Idea/candidate only — no code or files exist yet |
| ⛔ Deprecated | Superseded or removed; kept for historical reference |

Runner-managed phases carry a dual status: **Build** (engineering work, per completion docs) and **Runner** (execution recorded in `roadmap-runner/state-store.json`). A phase can be build-complete while the runner has never executed it.

## Foundation (Phases 1–4)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 1 | MAAL Core | ✅ Done | [Overview](../cic/phases/phase-1-overview.md), [Execution Log](../cic/phases/phase-1-execution-log.md) |
| 2 | SPL/RL Foundation | ✅ Done | [Overview](../cic/phases/phase-2-overview.md), [Completion Log](../cic/phases/phase-2-completion.md) |
| 3 | SPL Integration | ✅ Done | [Completion Log](../cic/phases/phase-3-completion-log.md) |
| 4 | Canary Gates | ✅ Done | [Spec Locked](../cic/phases/phase4-spec-locked.md) |

## Core Components (Phases 5–8)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 5 | TorqueQuery | ✅ Done | [Executive Summary](../cic/phases/phase-5-torquequery-v2-deployment-guide.md), [Build Summary](../cic/phases/phase-5-torquequery-v2-deployment-guide.md) |
| 6 | Implementation | ✅ Done | [Implementation Summary](../cic/phases/phase6-implementation-summary.md) |
| 8 | Cost Optimization + Dynamic Model Selection | 📋 Spec Finalized ✅ | [Spec](../cic/phases/phase-8-spec.md), [Test Matrices](../cic/phases/phase-8-test-matrices.md), [Runner Config](../../roadmap-runner/phases/PHASE-8.yaml), [Test JSON](../../phase-8/test-matrices.json) — spec locked 2026-06-23, finalized 2026-07-04 |

## Optimization & Hardening (Phases A–C)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| A | Optimization (caching + batching + baselines) | ✅ Done | [Summary](../cic/phases/phase-a-optimization-summary.md) |
| B | Hardening (timeout + retry + orchestrator) | ✅ Done | [Summary](../cic/phases/phase-b-hardening-summary.md) |
| C | Integration (hardened adapter + metrics) | ✅ Done | [Summary](../cic/phases/phase-c-integration-summary.md) — FallbackChain work deferred to Phase D |

## Advanced Phases (23–30)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 23 | Memory Explorer UI (23.6) | ✅ Done | [Phase 23.6](../cic/phases/phase-23-6-memory-explorer-ui.md) |
| 23.2 | Memory Query API | 🔄 In Progress | `build-roadmap.json` (in-progress, depends on 24.5) |
| 24 | Autonomous Governance (council voting + evidence vault) | ✅ Done | Referenced as integration target by [Phase 28a](../cic/phases/phase-28a-scp-completion.md) |
| 24.5 | AG-Trace Example (RPI→CIC execution trace) | 📋 Planned | [CIC_MASTER_ROADMAP.md](../reference/CIC_MASTER_ROADMAP.md#24-5--full-rpicic-execution-trace-ag-trace); phase-28a-scp-completion.md documents a different "governance integration" (not yet built, different deliverable). Phase 23.2 blocked on this. |
| 26 | TorqueQuery — Shared Ingestion & Search Engine | Build: ✅ / Runner: ⏸ pending | [Implementation Summary](../implementation/phase-26/summary.md); `roadmap-runner/phases/PHASE-26.yaml`; zero runs in state-store |
| 27.3 | Execution Plan | ✅ Done | [Execution Plan](../cic/phases/phase27-3-execution-plan.md) |
| 27.4 | Dispatch | ✅ Done | [Dispatch](../cic/phases/phase-27-4-dispatch.md) |
| 28a | SCP Completion | ✅ Done | [SCP Completion](../cic/phases/phase-28a-scp-completion.md); `build-roadmap.json` (complete) |
| 28b | SCP Follow-on | 📋 Planned | `build-roadmap.json` (queued, depends on 28a) |
| 30 | MVP | 📋 Planned | [MVP Spec](../cic/phases/phase-30-mvp-spec.md) — spec only |

## Infrastructure Track (Phase 0.9 — TheFoundry)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 0.9 | TheFoundry — Deterministic Build Environment | Build: ✅ / Runner: ⏸ pending | `roadmap-runner/phases/PHASE-0.9.yaml`; [Deploy Summary](../reference/DEPLOY_SUMMARY.md) |
| 0.9 M2 | CI Integration | ✅ Done | `build-roadmap.json` (complete) |
| 0.9 M3 | Deployment | 🔄 In Progress | `build-roadmap.json` (in-progress) |
| 0.9.1 | Follow-on | 📋 Planned | `build-roadmap.json` (queued) |

## Runtime Milestones (`.planning/ROADMAP.md`)

| Milestone | Title | Status |
|-----------|-------|--------|
| v0.8.0 | Deploy → Heal → Optimize | ✅ Done (shipped 2026-06-23) |
| v0.9.0 | Adaptive Memory + Semantic Caching (Phase 9) | 📋 Planned (next; est. 20–40% cost reduction) |

## Queued Placeholder Phases (31–50)

`build-roadmap.json` queues Phases 31–50 as a sequential dependency chain with no specs yet. All 📋 Planned (placeholder). Do not treat as scoped work until a spec document exists in `docs/cic/`.

## ⛔ Deprecated

From the [Phase 5c Deprecation Inventory](../cic/phases/phase-5c-deprecation-inventory.md):

- **Memory-Spine service** (`castironforge/services/memory-spine/`) — dormant MCP server, never wired to runtime; superseded by TorqueQuery (port 3110).
- **Operator-UI clones** (5 duplicates across 6 locations) — canonical promoted to Console v3 (`rewrite-mcp/apps/operator-ui/`); duplicates slated for deletion.
- **`planning-engine/` full-repo clone** of `rewrite-mcp/` — largest source of console drift; consolidation target.

## 💡 Potential (no code exists — proposals only)

- **System Index Builder** — see [spec](../reference/system-index-builder.md). Not implemented.
- **Toolforge agents** (`toolforge/agents/` outreach/delivery/analysis) — directory does not exist; see [Toolforge reference](../reference/toolforge.md).
- **Governance deploy-review directory** — a deploy-review *skill* exists in the skills catalog, but no `governance/deploy-review/` module exists.

## Related

- [Rewrite Labs Roadmap](rewrite-labs-roadmap.md)
- [Unified Roadmap](unified-roadmap.md)
- [CIC Documentation Index](../cic/index.md)
- [Roadmap Runner](../operations/roadmap-runner.md)
