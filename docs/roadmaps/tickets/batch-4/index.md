---
title: Batch 4 Ticket Index
summary: "Concrete coding-ready tickets, Tracks 30-36. Next-gen runtime & engines batch. No UI tasks."
created: "2026-07-04"
tags:
  - cic
  - rewrite-labs
  - roadmap
  - tickets
---

# Batch 4 — Concrete Tickets (Next-Gen Runtime & Engines)

Pure implementation tickets. No UI triggers, no Copilot Tasks. Each ticket is self-contained and can be executed in an independent Claude session (parallel windows), sandbox, or Docker.

## Coverage

TorqueQuery v3 (multi-index next-gen search), CIC Runtime v4 (full runtime overhaul), RL Crawler v2 (next-gen Playwright engine), World-Corpus Search v2 (global search engine), Foundry CI/CD (deterministic build system), full Runtime Orchestrator (CIC + RL + world-corpus), Fusion Engine v3.

## Ticket Table

| Track | Ticket | File | Status |
|-------|--------|------|--------|
| 30 | TQ-V3-ARCHITECTURE | [tq-v3-architecture.md](tq-v3-architecture.md) | Open |
| 30 | TQ-V3-SEMANTIC-PIPELINE | [tq-v3-semantic-pipeline.md](tq-v3-semantic-pipeline.md) | Open |
| 30 | TQ-V3-HYBRID-ENGINE | [tq-v3-hybrid-engine.md](tq-v3-hybrid-engine.md) | Open |
| 31 | CIC-RUNTIME-V4-CORE | [cic-runtime-v4-core.md](cic-runtime-v4-core.md) | Open |
| 31 | CIC-RUNTIME-V4-SANDBOX | [cic-runtime-v4-sandbox.md](cic-runtime-v4-sandbox.md) | Open |
| 31 | CIC-RUNTIME-V4-ADAPTERS | [cic-runtime-v4-adapters.md](cic-runtime-v4-adapters.md) | Open |
| 32 | RL-CRAWLER-V2-CORE | [rl-crawler-v2-core.md](rl-crawler-v2-core.md) | Open |
| 32 | RL-CRAWLER-V2-ADAPTERS | [rl-crawler-v2-adapters.md](rl-crawler-v2-adapters.md) | Open |
| 32 | RL-CRAWLER-V2-RUNNER | [rl-crawler-v2-runner.md](rl-crawler-v2-runner.md) | Open |
| 33 | WORLD-SEARCH-V2-ARCHITECTURE | [world-search-v2-architecture.md](world-search-v2-architecture.md) | Open |
| 33 | WORLD-SEARCH-V2-PIPELINE | [world-search-v2-pipeline.md](world-search-v2-pipeline.md) | Open |
| 34 | FOUNDRY-CICD-V1 | [foundry-cicd-v1.md](foundry-cicd-v1.md) | Open |
| 34 | FOUNDRY-CICD-PIPELINE | [foundry-cicd-pipeline.md](foundry-cicd-pipeline.md) | Open |
| 35 | RUNTIME-ORCHESTRATOR-V4 | [runtime-orchestrator-v4.md](runtime-orchestrator-v4.md) | Open |
| 35 | RUNTIME-ORCHESTRATOR-EXECUTION-GRAPH | [runtime-orchestrator-execution-graph.md](runtime-orchestrator-execution-graph.md) | Open |
| 36 | FUSION-ENGINE-V3 | [fusion-engine-v3.md](fusion-engine-v3.md) | Open |
| 36 | FUSION-ENGINE-RUNNER | [fusion-engine-runner.md](fusion-engine-runner.md) | Open |

## Parallelization Waves

Independent starters (wave 1): TQ-V3-ARCHITECTURE, CIC-RUNTIME-V4-CORE, RL-CRAWLER-V2-CORE, WORLD-SEARCH-V2-ARCHITECTURE, FOUNDRY-CICD-V1, RUNTIME-ORCHESTRATOR-V4, FUSION-ENGINE-V3.

Dependent (wave 2): TQ-V3-SEMANTIC-PIPELINE, CIC-RUNTIME-V4-SANDBOX, CIC-RUNTIME-V4-ADAPTERS, RL-CRAWLER-V2-ADAPTERS, WORLD-SEARCH-V2-PIPELINE, FOUNDRY-CICD-PIPELINE, RUNTIME-ORCHESTRATOR-EXECUTION-GRAPH.

Dependent (wave 3): TQ-V3-HYBRID-ENGINE, RL-CRAWLER-V2-RUNNER, FUSION-ENGINE-RUNNER.

## Execution Notes

- Tickets are independent unless noted in a ticket's Dependencies section.
- Update the Status column when a ticket ships (Open → In Progress → Done, with commit hash).
- Related batches: [Batch 2 Index](../batch-2/index.md), [Batch 3 Index](../batch-3/index.md)
- Related roadmap: [Unified Roadmap](../../unified-roadmap.md)
