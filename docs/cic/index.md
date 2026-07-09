---
title: "CIC Documentation Index"
summary: "# CIC Documentation Index"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Documentation Index

Complete reference for CIC (Computational Intelligence Core) phases, components, and implementation.

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential (no code exists) · ⛔ Deprecated

> Full status tables with evidence links: [CIC Roadmap](../roadmaps/cic-roadmap.md) · [Unified Roadmap](../roadmaps/unified-roadmap.md)

## Phases

### Foundation (1–4) — ✅ Done

- [Phase 1: MAAL Core](phases/phase-1-overview.md)
  - [Architecture](phases/phase-1-architecture.md)
  - [File Contract](phases/phase-1-file-contract.md)
  - [Implementation Order](phases/phase-1-implementation-order.md)
  - [Ledger Substrate](phases/phase-1-ledger-substrate.md)
  - [Bridge Orchestrator](phases/phase-1-bridge-orchestrator.md)
  - [Testing](phases/phase-1-testing.md)

- [Phase 2: SPL/RL Foundation](phases/phase-2-overview.md)
  - [Architecture](phases/phase-2-architecture.md)
  - [State Space](phases/phase-2-state-space.md)
  - [Action Space](phases/phase-2-action-space.md)
  - [Reward Function](phases/phase-2-reward-function.md)
  - [Policy Learner](phases/phase-2-policy-learner.md)
  - [Simulation Engine](phases/phase-2-simulation-engine.md)
  - [Training Loop](phases/phase-2-training-loop.md)
  - [Episode Trajectory](phases/phase-2-episode-trajectory.md)
  - [Integration](phases/phase-2-integration.md)
  - [Testing](phases/phase-2-testing.md)

- [Phase 3: SPL Integration](phases/phase-3-completion-log.md)

- [Phase 4: Canary Gates](phases/phase4-spec-locked.md)

### Core Components (5–8)

Phase 5 ✅ · Phase 6 ✅ · Phase 8 📋 (spec locked, no completion log)

- [Phase 5: TorqueQuery](torquequery-executive-summary.md)
  - [Build Summary](torquequery-build-summary.md)
  - [Quickstart](torquequery-quickstart.md)
  - [MCP Reference](torquequery-mcp-reference.md)
  - [Index](torquequery-index.md)

- Phase 6: [Implementation Summary](phases/phase6-implementation-summary.md)

- Phase 8: [Spec](phases/phase-8-spec.md) | [Test Matrices](phases/phase-8-test-matrices.md)

### Optimization & Hardening (A–C) — ✅ Done

- [Phase A: Optimization](phases/phase-a-optimization-summary.md)
- [Phase B: Hardening](phases/phase-b-hardening-summary.md)
- [Phase C: Integration](phases/phase-c-integration-summary.md)

### Advanced Phases (23–30)

- [Phase 23](phases/phase-23-6-memory-explorer-ui.md) ✅ (23.2 Memory Query API 🔄)
- Phase 24: Autonomous Governance ✅ (24.5 Build Governance 📋 — see [roadmap](../roadmaps/cic-roadmap.md))
- [Phase 26: Implementation](../implementation/phase-26/summary.md) — Build ✅ / Runner ⏸ pending
- [Phase 27.3](phases/phase27-3-execution-plan.md) ✅ | [Phase 27.4](phases/phase-27-4-dispatch.md) ✅
- [Phase 28a: SCP Completion](phases/phase-28a-scp-completion.md) ✅ (28b 📋 queued)
- [Phase 30: MVP Spec](phases/phase-30-mvp-spec.md) 📋

### ⛔ Deprecated

Per the [Phase 5c Deprecation Inventory](phases/phase-5c-deprecation-inventory.md):

- Memory-Spine service (dormant; superseded by TorqueQuery)
- Operator-UI clones (5 duplicates; canonical promoted to Console v3)
- `planning-engine/` full-repo clone of `rewrite-mcp/`

### 💡 Potential (proposals only — no code exists)

- [System Index Builder](../reference/system-index-builder.md) — spec only
- Toolforge agents (`toolforge/agents/`) — see [Toolforge reference](../reference/toolforge.md)
- Governance deploy-review module (a deploy-review *skill* exists; no `governance/` module)

## Core Subsystems

### Governance & Memory

- [Governance Framework](governance.md)
- [Memory System](memory-v1-staging-activation.md)
- [Knowledge Integration](kb-integration-summary.md)
- [NotebookLM Adapter Spec](notebooklm-adapter-spec.md)
- [TorqueQuery NotebookLM Spec](torquequery-notebooklm-spec.md)
- [NotebookLM Integration Plan](notebooklm-integration-plan.md)
- [NotebookLM Use Case Library](use-case-library.md)
- [CoWork MCP Integration Spec](../reference/cowork-mcp-integration-spec.md)

### Data Pipeline

- [CodeFlow Harvester](harvester.md)
- [Drift Engine](driftengine.md)
- [Replay Harness](replayharness.md)

### Observability & Determinism

- [Runtime Observability Plan](cic-runtime-observability-plan.md)
- [Prometheus Integration](prometheus-integration-status.md)
- [Sandbox-3 Overview](sandbox-3-overview.md)
  - [Architecture](sandbox-3-architecture.md)
  - [Kubernetes](sandbox-3-k8s.md)
  - [Determinism](sandbox-3-determinism.md)
  - [Routing v3](sandbox-3-routing-v3.md)
  - [Stability v3](sandbox-3-stability-v3.md)
  - [Monitoring](sandbox-3-monitoring.md)
  - [Incident Response](sandbox-3-incident-response.md)

### Token & Cost

- [Token Audit Report](token-audit-report.md)
- [Token Coverage Matrix](token-coverage-matrix.md)
- [Phase Roadmap](token-coverage-matrix-phase-roadmap.md)
- [CIC Token Pack v2.0](cic-token-pack-v2-0-full-list.md)

### Deployment & Operations

- [Canary Gates](canary-gates.md)
- [Phase A Deployment](canary-phase-a-deployment.md)
- [Phase A Prod Deployment Checklist](canary-phase-a-prod-deployment-checklist.md)
- [Phase 5 Canary Rollout Plan](phases/phase-5-canary-rollout-plan.md)

## Research & Testing

- [Research Skill Overview](research-skill/skill.md)
- [Test Results - Iteration 1](research-skill/test-results/iteration-1-grading.md)
- [Test Results - Iteration 2](research-skill/test-results/iteration-2-grading.md)

## Status Reports

- [Execution Status](execution-status.md)
- [P1 Implementation Complete](p1-implementation-complete.md)
- [Phase 2 Status](phases/phase-2-status.md)
- [Sandbox-3 Progress](sandbox-3-progress.md)

## Execution Logs

- [Phase 1 Execution Log](phases/phase-1-execution-log.md)
- [Phase 2 Completion Log](phases/phase-2-completion-log.md)
- [Phase 3 Completion Log](phases/phase-3-completion-log.md)

## Quick Navigation

- **Getting Started**: [Phase 1 Overview](phases/phase-1-overview.md)
- **Architecture**: [Architecture Overview](../architecture/overview.md)
- **API Reference**: [API Overview](../api/overview.md)
- **Operations**: [Running the System](../operations/running.md)
- **Cross-System**: [CIC ↔ RL Integration](../reference/cic-rl-cross-reference.md)
