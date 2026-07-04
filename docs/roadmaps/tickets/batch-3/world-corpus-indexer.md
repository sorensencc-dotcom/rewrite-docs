---
title: WORLD-CORPUS-INDEXER
summary: "World-corpus indexer: indexing logic, search routing, drift hooks."
created: "2026-07-03"
tags: [cic, tickets, batch-3, world-corpus]
---

# TICKET: WORLD-CORPUS-INDEXER

**Track:** 25 — World-Corpus Ingestion Backbone
**Goal:** Build world-corpus indexer.

## Steps

1. Add indexing logic.
2. Add search routing.
3. Add drift hooks.

## Output

- `src/world-corpus/indexer/`

## Dependencies

Requires pipeline output from [world-corpus-pipeline-v1.md](world-corpus-pipeline-v1.md). Search routing may reuse [tq-search-engine-v2.md](tq-search-engine-v2.md) hybrid layer.
