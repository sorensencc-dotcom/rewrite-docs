---
title: REPO-CLEANUP-V3
summary: "Remove deprecated clones, consolidate drift sources."
created: "2026-07-03"
tags: [cic, tickets, batch-2, cleanup]
---

# TICKET: REPO-CLEANUP-V3

**Track:** 18 — Repo Cleanup + Consolidation
**Goal:** Remove deprecated clones + consolidate drift sources.

## Steps

1. Delete operator-UI clones.
2. Delete planning-engine clone.
3. Consolidate drift docs.

## Output

- Clean repo
- Updated docs

## Dependencies

Destructive — confirm clone list with operator before deleting. Run after [drift-detector-integration-v2.md](drift-detector-integration-v2.md) so drift-doc consolidation reflects the unified bus.
