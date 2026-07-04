---
title: Batch 2 Ticket Index
summary: "Concrete coding-ready tickets, Tracks 7-19. No UI tasks."
created: "2026-07-03"
tags:
  - cic
  - rewrite-labs
  - roadmap
  - tickets
---

# Batch 2 — Concrete Tickets (Coding-Ready)

Pure implementation tickets. No UI triggers, no Copilot Tasks. Each ticket is self-contained and can be executed in an independent Claude session (parallel windows), sandbox, or Docker.

## Coverage

CIC Phase 8, CIC Phase 30, CIC Phases 31-50, RL architecture patterns, Foundry expansion, runner hardening, unified roadmap execution graph, services layer, routing engine, drift detector integration, cost attribution, repo cleanup, observability.

## Ticket Table

| Track | Ticket | File | Status |
|-------|--------|------|--------|
| 7 | CIC-PHASE-8-SPEC-FINALIZATION | [cic-phase-8-spec-finalization.md](cic-phase-8-spec-finalization.md) | Open |
| 7 | CIC-PHASE-8-IMPLEMENTATION-STUBS | [cic-phase-8-implementation-stubs.md](cic-phase-8-implementation-stubs.md) | Open |
| 8 | CIC-PHASE-30-MVP-EXPANSION | [cic-phase-30-mvp-expansion.md](cic-phase-30-mvp-expansion.md) | Open |
| 9 | CIC-PHASE-31-50-SPEC-GENERATOR | [cic-phase-31-50-spec-generator.md](cic-phase-31-50-spec-generator.md) | Open |
| 10 | RL-PATTERNS-GENERATOR | [rl-patterns-generator.md](rl-patterns-generator.md) | Open |
| 11 | FOUNDRY-EXPANSION-M2-M3 | [foundry-expansion-m2-m3.md](foundry-expansion-m2-m3.md) | Open |
| 12 | RUNNER-HARDENING-V2 | [runner-hardening-v2.md](runner-hardening-v2.md) | Done (058b037) |
| 13 | UNIFIED-EXECUTION-GRAPH-GENERATOR | [unified-execution-graph-generator.md](unified-execution-graph-generator.md) | Open |
| 14 | SERVICES-LAYER-EXPANSION | [services-layer-expansion.md](services-layer-expansion.md) | Open |
| 15 | ROUTING-ENGINE-V2 | [routing-engine-v2.md](routing-engine-v2.md) | Open |
| 16 | DRIFT-DETECTOR-INTEGRATION-V2 | [drift-detector-integration-v2.md](drift-detector-integration-v2.md) | Open |
| 17 | COST-ATTRIBUTION-ENGINE | [cost-attribution-engine.md](cost-attribution-engine.md) | Open |
| 18 | REPO-CLEANUP-V3 | [repo-cleanup-v3.md](repo-cleanup-v3.md) | Open |
| 19 | OBSERVABILITY-V3 | [observability-v3.md](observability-v3.md) | Open |

## Execution Notes

- Tickets are independent unless noted in a ticket's Dependencies section.
- Update the Status column when a ticket ships (Open → In Progress → Done, with commit hash).
- Related roadmap: [Unified Roadmap](../../unified-roadmap.md)
