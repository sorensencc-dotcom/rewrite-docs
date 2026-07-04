---
title: FUSION-LAYER-V1
summary: "CIC ↔ RL fusion layer: IR-packet translator, bidirectional routing, metrics."
created: "2026-07-03"
tags: [cic, rewrite-labs, tickets, batch-3, fusion, phase-29]
---

# TICKET: FUSION-LAYER-V1

**Track:** 26 — CIC ↔ RL Fusion Layer (Phase 29)
**Goal:** Build CIC ↔ RL fusion layer.

## Steps

1. Add IR-packet translator.
2. Add RL → CIC routing.
3. Add CIC → RL routing.
4. Add metrics.

## Output

- `src/fusion/translator.js`
- `src/fusion/router.js`

## Dependencies

None hard. Feeds [fusion-layer-integration.md](fusion-layer-integration.md) and [rl-cic-fusion-v2.md](rl-cic-fusion-v2.md).
