---
title: TQ-SHARED-INGESTION-V2
summary: "Expand TorqueQuery ingestion into multi-source, multi-adapter architecture."
created: "2026-07-03"
tags: [cic, tickets, batch-3, torquequery, ingestion]
---

# TICKET: TQ-SHARED-INGESTION-V2

**Track:** 20 — TorqueQuery Expansion (Phase 26+)
**Goal:** Expand TorqueQuery ingestion into multi-source, multi-adapter architecture.

## Inputs

- `src/cic-runtime/routing/`
- Phase 26 summary

## Steps

1. Add adapter registry (HTML, JSON, RSS, sitemap, screenshot).
2. Add ingestion pipeline with batching + retry.
3. Add structured logs + metrics.
4. Add runner config for ingestion mode.

## Output

- `src/torquequery/ingestion/`
- Updated Phase 26 YAML

## Dependencies

None. Independent.
