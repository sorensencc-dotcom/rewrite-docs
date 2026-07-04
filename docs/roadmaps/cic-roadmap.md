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
| 1 | MAAL Core | ✅ Done | [Overview](../cic/PHASE-1_OVERVIEW.md), [Execution Log](../cic/PHASE-1-EXECUTION-LOG.md) |
| 2 | SPL/RL Foundation | ✅ Done | [Overview](../cic/PHASE-2_OVERVIEW.md), [Completion Log](../cic/PHASE-2-COMPLETION-LOG.md) |
| 3 | SPL Integration | ✅ Done | [Completion Log](../cic/PHASE-3-COMPLETION-LOG.md) |
| 4 | Canary Gates | ✅ Done | [Spec Locked](../cic/PHASE4-SPEC-LOCKED.md) |

## Core Components (Phases 5–8)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 5 | TorqueQuery | ✅ Done | [Executive Summary](../cic/TORQUEQUERY_EXECUTIVE_SUMMARY.md), [Build Summary](../cic/TORQUEQUERY_BUILD_SUMMARY.md) |
| 6 | Implementation | ✅ Done | [Implementation Summary](../cic/PHASE6-IMPLEMENTATION-SUMMARY.md) |
| 8 | Spec + Test Matrices | 📋 Planned | [Spec](../cic/PHASE_8_SPEC.md), [Test Matrices](../cic/PHASE_8_TEST_MATRICES.md) — spec locked, no completion log |

## Optimization & Hardening (Phases A–C)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| A | Optimization (caching + batching + baselines) | ✅ Done | [Summary](../cic/PHASE_A_OPTIMIZATION_SUMMARY.md) |
| B | Hardening (timeout + retry + orchestrator) | ✅ Done | [Summary](../cic/PHASE_B_HARDENING_SUMMARY.md) |
| C | Integration (hardened adapter + metrics) | ✅ Done | [Summary](../cic/PHASE_C_INTEGRATION_SUMMARY.md) — FallbackChain work deferred to Phase D |

## Advanced Phases (23–30)

| Phase | Title | Status | Evidence |
|-------|-------|--------|----------|
| 23 | Memory Explorer UI (23.6) | ✅ Done | [Phase 23.6](../cic/PHASE-23-6-MEMORY-EXPLORER-UI.md) |
| 23.2 | Memory Query API | 🔄 In Progress | `build-roadmap.json` (in-progress, depends on 24.5) |
| 24 | Autonomous Governance (council voting + evidence vault) | ✅ Done | Referenced as integration target by [Phase 28a](../cic/PHASE-28a-SCP-COMPLETION.md) |
| 24.5 | Build Governance (vault lineage linking) | 📋 Planned | `build-roadmap.json` lists it queued (depends on 28b); [Phase 28a](../cic/PHASE-28a-SCP-COMPLETION.md) documents its integration surface as complete — reconcile at next weekly sync |
| 26 | TorqueQuery — Shared Ingestion & Search Engine | Build: ✅ / Runner: ⏸ pending | [Implementation Summary](../implementation/phase-26/summary.md); `roadmap-runner/phases/PHASE-26.yaml`; zero runs in state-store |
| 27.3 | Execution Plan | ✅ Done | [Execution Plan](../cic/PHASE27_3_EXECUTION_PLAN.md) |
| 27.4 | Dispatch | ✅ Done | [Dispatch](../cic/PHASE_27_4_DISPATCH.md) |
| 28a | SCP Completion | ✅ Done | [SCP Completion](../cic/PHASE-28a-SCP-COMPLETION.md); `build-roadmap.json` (complete) |
| 28b | SCP Follow-on | 📋 Planned | `build-roadmap.json` (queued, depends on 28a) |
| 30 | MVP | 📋 Planned | [MVP Spec](../cic/PHASE-30-MVP-SPEC.md) — spec only |

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

From the [Phase 5c Deprecation Inventory](../cic/PHASE_5C_DEPRECATION_INVENTORY.md):

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
