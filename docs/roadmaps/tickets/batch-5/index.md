---
title: Batch 5 Ticket Index
summary: "Concrete coding-ready tickets, Tracks 37-43. Autonomous systems batch. No UI tasks."
created: "2026-07-04"
tags:
  - cic
  - rewrite-labs
  - world-corpus
  - roadmap
  - tickets
---

# Batch 5 — Concrete Tickets (Autonomous Systems)

Pure implementation tickets. No UI triggers, no Copilot Tasks. Each ticket is self-contained and can be executed in an independent Claude session (parallel windows), sandbox, or Docker.

## Coverage

CIC Runtime v5 (autonomous runtime: self-triggering scheduler, self-healing, runtime governance), RL-6.x (autonomous redesign + outreach engines), world-corpus v3 (autonomous ingestion/chunking/embedding/indexing), multi-agent orchestration layer, autonomous governance (Phase 24+), CIC + RL + world-corpus fusion v4 (Phase 29), CIC evolution engine v2 (Phase 10).

## Ticket Table

| Track | Ticket | File | Status |
|-------|--------|------|--------|
| 37 | CIC-RUNTIME-V5-ARCHITECTURE | [cic-runtime-v5-architecture.md](cic-runtime-v5-architecture.md) | Open |
| 37 | CIC-RUNTIME-V5-SELF-HEALING | [cic-runtime-v5-self-healing.md](cic-runtime-v5-self-healing.md) | Open |
| 37 | CIC-RUNTIME-V5-AUTO-GOVERNANCE | [cic-runtime-v5-auto-governance.md](cic-runtime-v5-auto-governance.md) | Open |
| 38 | RL-6.X-SPEC-GENERATOR | [rl-6x-spec-generator.md](rl-6x-spec-generator.md) | Open |
| 38 | RL-6.X-AUTONOMOUS-REDESIGN | [rl-6x-autonomous-redesign.md](rl-6x-autonomous-redesign.md) | Open |
| 38 | RL-6.X-AUTO-OUTREACH | [rl-6x-auto-outreach.md](rl-6x-auto-outreach.md) | Open |
| 39 | WORLD-CORPUS-V3-ARCHITECTURE | [world-corpus-v3-architecture.md](world-corpus-v3-architecture.md) | Open |
| 39 | WORLD-CORPUS-V3-AUTO-INGESTION | [world-corpus-v3-auto-ingestion.md](world-corpus-v3-auto-ingestion.md) | Open |
| 39 | WORLD-CORPUS-V3-AUTO-INDEXER | [world-corpus-v3-auto-indexer.md](world-corpus-v3-auto-indexer.md) | Open |
| 40 | MULTI-AGENT-ORCHESTRATION-V1 | [multi-agent-orchestration-v1.md](multi-agent-orchestration-v1.md) | Open |
| 40 | MULTI-AGENT-ORCHESTRATION-V1-RUNNER | [multi-agent-orchestration-v1-runner.md](multi-agent-orchestration-v1-runner.md) | Open |
| 41 | AUTONOMOUS-GOVERNANCE-V3 | [autonomous-governance-v3.md](autonomous-governance-v3.md) | Open |
| 41 | AUTONOMOUS-GOVERNANCE-RUNNER | [autonomous-governance-runner.md](autonomous-governance-runner.md) | Open |
| 42 | AUTONOMOUS-FUSION-V4 | [autonomous-fusion-v4.md](autonomous-fusion-v4.md) | Open |
| 42 | AUTONOMOUS-FUSION-RUNNER | [autonomous-fusion-runner.md](autonomous-fusion-runner.md) | Open |
| 43 | CIC-EVOLUTION-ENGINE-V2 | [cic-evolution-engine-v2.md](cic-evolution-engine-v2.md) | Open |
| 43 | CIC-EVOLUTION-RUNNER-V2 | [cic-evolution-runner-v2.md](cic-evolution-runner-v2.md) | Open |

## Parallelization Waves

Independent starters (wave 1): CIC-RUNTIME-V5-ARCHITECTURE, RL-6.X-SPEC-GENERATOR, WORLD-CORPUS-V3-ARCHITECTURE, MULTI-AGENT-ORCHESTRATION-V1, AUTONOMOUS-GOVERNANCE-V3, AUTONOMOUS-FUSION-V4, CIC-EVOLUTION-ENGINE-V2.

Dependent (wave 2): CIC-RUNTIME-V5-SELF-HEALING, CIC-RUNTIME-V5-AUTO-GOVERNANCE, RL-6.X-AUTONOMOUS-REDESIGN, RL-6.X-AUTO-OUTREACH, WORLD-CORPUS-V3-AUTO-INGESTION, WORLD-CORPUS-V3-AUTO-INDEXER, MULTI-AGENT-ORCHESTRATION-V1-RUNNER, AUTONOMOUS-GOVERNANCE-RUNNER, AUTONOMOUS-FUSION-RUNNER, CIC-EVOLUTION-RUNNER-V2.

## Execution Notes

- Tickets are independent unless noted in a ticket's Dependencies section.
- Runner tickets create *-v-variant* PHASE yaml files alongside existing ones — never overwrite existing PHASE configs.
- Update the Status column when a ticket ships (Open → In Progress → Done, with commit hash).
- Related batches: [Batch 3 Index](../batch-3/index.md), Batch 4 (no index yet — `../batch-4/`)
- Related roadmap: [Unified Roadmap](../../unified-roadmap.md)
