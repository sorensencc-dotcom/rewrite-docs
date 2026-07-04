---
title: TQ-V3-HYBRID-ENGINE
summary: "TorqueQuery v3 hybrid search engine: BM25 indexer, hybrid scoring, hybrid routing."
created: "2026-07-04"
tags: [cic, tickets, batch-4, torquequery, search, hybrid]
---

# TICKET: TQ-V3-HYBRID-ENGINE

**Track:** 30 — TorqueQuery v3 (Next-Gen Search Engine)
**Goal:** Build hybrid search engine (BM25 + embeddings).

## Steps

1. Add BM25 indexer.
2. Add hybrid scoring.
3. Add hybrid routing.

## Output

- `src/torquequery/v3/hybrid/`

## Dependencies

Requires scaffold from [tq-v3-architecture.md](tq-v3-architecture.md) and embeddings from [tq-v3-semantic-pipeline.md](tq-v3-semantic-pipeline.md).
