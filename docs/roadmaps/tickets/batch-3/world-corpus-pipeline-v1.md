---
title: WORLD-CORPUS-PIPELINE-V1
summary: "World-corpus ingestion pipeline: adapters, chunking, embeddings, Qdrant storage."
created: "2026-07-03"
tags: [cic, tickets, batch-3, world-corpus, qdrant]
---

# TICKET: WORLD-CORPUS-PIPELINE-V1

**Track:** 25 — World-Corpus Ingestion Backbone
**Goal:** Build world-corpus ingestion pipeline.

## Steps

1. Add ingestion adapters (web, vault, RL output).
2. Add chunking pipeline.
3. Add embedding pipeline.
4. Add storage layer (Qdrant).

## Output

- `src/world-corpus/ingestion/`
- `src/world-corpus/chunking/`
- `src/world-corpus/embeddings/`

## Dependencies

None hard. Adapter registry pattern shared with [tq-shared-ingestion-v2.md](tq-shared-ingestion-v2.md) and [cic-ingestion-multi-source.md](cic-ingestion-multi-source.md) — align interfaces.
