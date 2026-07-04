---
title: WORLD-SEARCH-V2-ARCHITECTURE
summary: "World-corpus search v2 architecture: multi-index, semantic + hybrid, drift-aware routing."
created: "2026-07-04"
tags: [cic, tickets, batch-4, world-corpus, search, architecture]
---

# TICKET: WORLD-SEARCH-V2-ARCHITECTURE

**Track:** 33 — World-Corpus Search v2 (Global Search Engine)
**Goal:** Build world-corpus search v2 architecture.

## Steps

1. Add multi-index architecture.
2. Add semantic + hybrid search.
3. Add drift-aware search routing.

## Output

- `src/world-corpus/search/v2/architecture.md`

## Dependencies

Builds on batch-3 [world-corpus-pipeline-v1.md](../batch-3/world-corpus-pipeline-v1.md) and [world-corpus-indexer.md](../batch-3/world-corpus-indexer.md). Index/routing design should stay consistent with [tq-v3-architecture.md](tq-v3-architecture.md) to allow shared components.
