---
title: ROUTING-ENGINE-V2
summary: "Upgrade routing engine: multi-detector, cost-aware, fallback."
created: "2026-07-03"
tags: [cic, tickets, batch-2, routing]
---

# TICKET: ROUTING-ENGINE-V2

**Track:** 15 — Routing Engine Upgrades
**Goal:** Upgrade routing engine.

## Steps

1. Add multi-detector routing.
2. Add cost-aware routing.
3. Add fallback routing.

## Output

- Updated `src/cic-runtime/routing/`

## Dependencies

Multi-detector routing consumes drift bus from [drift-detector-integration-v2.md](drift-detector-integration-v2.md). Cost-aware routing consumes [cost-attribution-engine.md](cost-attribution-engine.md).
