---
title: Batch 3 Ticket Index
summary: "Concrete coding-ready tickets, Tracks 20-29. Deep architecture batch. No UI tasks."
created: "2026-07-03"
tags:
  - cic
  - rewrite-labs
  - roadmap
  - tickets
---

# Batch 3 — Concrete Tickets (Deep Architecture)

Pure implementation tickets. No UI triggers, no Copilot Tasks. Each ticket is self-contained and can be executed in an independent Claude session (parallel windows), sandbox, or Docker.

## Coverage

TorqueQuery expansion (Phase 26+), CIC ingestion hardening (Phase 3+), RL-5.x scaffolding, governance automation (Phase 24+), runner orchestration (CIC + RL), world-corpus ingestion backbone, CIC ↔ RL fusion layer (Phase 29), CIC evolution layer (Phase 10), knowledge distillation engine (Phase 28).

## Ticket Table

| Track | Ticket | File | Status |
|-------|--------|------|--------|
| 20 | TQ-SHARED-INGESTION-V2 | [tq-shared-ingestion-v2.md](tq-shared-ingestion-v2.md) | Open |
| 20 | TQ-SEARCH-ENGINE-V2 | [tq-search-engine-v2.md](tq-search-engine-v2.md) | Open |
| 21 | CIC-INGESTION-HARDENING-V3 | [cic-ingestion-hardening-v3.md](cic-ingestion-hardening-v3.md) | Open |
| 21 | CIC-INGESTION-MULTI-SOURCE | [cic-ingestion-multi-source.md](cic-ingestion-multi-source.md) | Open |
| 22 | RL-5.X-SPEC-GENERATOR | [rl-5x-spec-generator.md](rl-5x-spec-generator.md) | Open |
| 22 | RL-5.X-ARCH-PATTERNS | [rl-5x-arch-patterns.md](rl-5x-arch-patterns.md) | Open |
| 23 | GOVERNANCE-AUTOMATION-V2 | [governance-automation-v2.md](governance-automation-v2.md) | Open |
| 23 | GOVERNANCE-RUNNER-HOOKS | [governance-runner-hooks.md](governance-runner-hooks.md) | Open |
| 24 | RUNNER-ORCHESTRATION-V3 | [runner-orchestration-v3.md](runner-orchestration-v3.md) | Open |
| 24 | RUNNER-EXECUTION-GRAPH-INTEGRATION | [runner-execution-graph-integration.md](runner-execution-graph-integration.md) | Open |
| 25 | WORLD-CORPUS-PIPELINE-V1 | [world-corpus-pipeline-v1.md](world-corpus-pipeline-v1.md) | Open |
| 25 | WORLD-CORPUS-INDEXER | [world-corpus-indexer.md](world-corpus-indexer.md) | Open |
| 26 | FUSION-LAYER-V1 | [fusion-layer-v1.md](fusion-layer-v1.md) | Open |
| 26 | FUSION-LAYER-INTEGRATION | [fusion-layer-integration.md](fusion-layer-integration.md) | Open |
| 27 | CIC-EVOLUTION-ENGINE-V1 | [cic-evolution-engine-v1.md](cic-evolution-engine-v1.md) | Open |
| 27 | CIC-EVOLUTION-RUNNER | [cic-evolution-runner.md](cic-evolution-runner.md) | Open |
| 28 | KD-ENGINE-V1 | [kd-engine-v1.md](kd-engine-v1.md) | Open |
| 29 | RL-CIC-FUSION-V2 | [rl-cic-fusion-v2.md](rl-cic-fusion-v2.md) | Open |

## Parallelization Waves

Independent starters (wave 1): TQ-SHARED-INGESTION-V2, CIC-INGESTION-HARDENING-V3, RL-5.X-SPEC-GENERATOR, RL-5.X-ARCH-PATTERNS, GOVERNANCE-AUTOMATION-V2, RUNNER-ORCHESTRATION-V3, WORLD-CORPUS-PIPELINE-V1, FUSION-LAYER-V1, CIC-EVOLUTION-ENGINE-V1, KD-ENGINE-V1.

Dependent (wave 2): TQ-SEARCH-ENGINE-V2, CIC-INGESTION-MULTI-SOURCE, GOVERNANCE-RUNNER-HOOKS, RUNNER-EXECUTION-GRAPH-INTEGRATION, WORLD-CORPUS-INDEXER, FUSION-LAYER-INTEGRATION, CIC-EVOLUTION-RUNNER, RL-CIC-FUSION-V2.

## Execution Notes

- Tickets are independent unless noted in a ticket's Dependencies section.
- Update the Status column when a ticket ships (Open → In Progress → Done, with commit hash).
- Related batch: [Batch 2 Index](../batch-2/index.md)
- Related roadmap: [Unified Roadmap](../../unified-roadmap.md)
