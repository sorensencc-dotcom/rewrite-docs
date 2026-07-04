---
title: TQ-SEARCH-ENGINE-V2
summary: "Expand TorqueQuery search: semantic, hybrid BM25+embeddings, cost/drift-aware routing."
created: "2026-07-03"
tags: [cic, tickets, batch-3, torquequery, search]
---

# TICKET: TQ-SEARCH-ENGINE-V2

**Track:** 20 — TorqueQuery Expansion (Phase 26+)
**Goal:** Expand TorqueQuery search engine.

## Steps

1. Add semantic search layer.
2. Add hybrid search (BM25 + embeddings).
3. Add cost-aware search routing.
4. Add drift-aware search routing.

## Output

- `src/torquequery/search/`
- Updated routing engine

## Dependencies

Consumes indexed content from [tq-shared-ingestion-v2.md](tq-shared-ingestion-v2.md). Cost-aware routing builds on batch-2 [cost-attribution-engine.md](../batch-2/cost-attribution-engine.md); drift-aware routing builds on batch-2 [drift-detector-integration-v2.md](../batch-2/drift-detector-integration-v2.md).
