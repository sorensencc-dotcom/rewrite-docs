---
title: SERVICES-LAYER-EXPANSION
summary: "Expand services layer into real modules with registry + hooks."
created: "2026-07-03"
tags: [cic, tickets, batch-2, services]
---

# TICKET: SERVICES-LAYER-EXPANSION

**Track:** 14 — Services Layer Expansion
**Goal:** Expand services layer into real modules.

## Steps

1. Create service registry.
2. Add routing hooks.
3. Add drift hooks.
4. Add cost hooks.

## Output

- `src/services/registry.js`
- Updated `services.md`

## Dependencies

Cost hooks pair with [cost-attribution-engine.md](cost-attribution-engine.md); drift hooks pair with [drift-detector-integration-v2.md](drift-detector-integration-v2.md). Stubs OK if those tickets not yet done.
