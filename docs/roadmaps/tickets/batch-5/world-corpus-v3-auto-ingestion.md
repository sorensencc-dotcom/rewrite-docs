---
title: WORLD-CORPUS-V3-AUTO-INGESTION
summary: "Autonomous ingestion engine for world-corpus v3: scheduler, routing, metrics."
created: "2026-07-04"
tags: [world-corpus, tickets, batch-5, ingestion]
---

# TICKET: WORLD-CORPUS-V3-AUTO-INGESTION

**Track:** 39 — World-Corpus v3 (Autonomous Corpus)
**Goal:** Add autonomous ingestion engine.

## Steps

1. Add ingestion scheduler.
2. Add ingestion routing.
3. Add ingestion metrics.

## Output

- `src/world-corpus/v3/ingestion/`

## Dependencies

[world-corpus-v3-architecture.md](world-corpus-v3-architecture.md) (wave 2). Scheduler follows cic-ingestion patterns (`cic-ingestion/` autonomy API server).
