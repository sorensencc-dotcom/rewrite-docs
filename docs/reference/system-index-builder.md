---
title: "System Index Builder — 💡 Planned (not implemented)"
summary: "# System Index Builder — 💡 Planned (not implemented)"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# System Index Builder — 💡 Planned (not implemented)

> **No code exists for this system.** Searches for `system-index`, `index-builder`, and `systemIndex` across `scripts/`, `toolforge/`, and `cic-ingestion/` return nothing. This page is a **spec-only proposal**. The nearest existing artifact is the *dual-system reference index* — a hand-maintained markdown file at [docs/rewrite-labs/00-RL-INDEX.md](../rewrite-labs/00-RL-INDEX.md).

## What it would be

A generator that produces a machine-readable + human-readable index of every CIC-OS subsystem: name, real path, purpose, status (✅/🔄/📋/💡/⛔), owners, and cross-links. Today that map is maintained by hand in [Systems Overview](../systems/index.md) and the [roadmap docs](../roadmaps/unified-roadmap.md); the builder would derive it from the repo instead.

## Proposed contents

- Subsystem inventory (routing, governance, ingestion, drift ×4, cost, runner, services, toolforge skills)
- Phase status snapshot (from `build-roadmap.json` + `roadmap-runner/state-store.json`)
- Doc ↔ code cross-reference (which doc describes which real path; flags docs citing paths that no longer exist)
- Drift-relevant metadata (last-modified timestamps per subsystem, doc-vs-code staleness)

## Proposed generation

1. Scan configured roots (`src/`, `cic-ingestion/`, `governance/`, `roadmap-runner/`, `services/`, `toolforge/skills/`).
2. Merge status from `build-roadmap.json`, `roadmap-runner/state-store.json`, and roadmap doc frontmatter.
3. Validate doc-cited paths against the filesystem (extends the existing verification suite: `scripts/verify-all.js`, `verify-docs-content.js`, `verify-topology-docs.js`).
4. Emit `system-index.json` + a generated markdown page under `docs/reference/`.

## Proposed usage

- **CIC/RL alignment** — authoritative subsystem list backing the [Unified Roadmap](../roadmaps/unified-roadmap.md) and [Cross-Reference](cic-rl-cross-reference.md).
- **Ingestion/governance/drift** — staleness metadata feeds the ingestion-governance drift engine and doc-drift checks.
- **Weekly sync** — replaces the manual doc-vs-repo reconciliation steps in the [Weekly Sync Procedure](../operations/weekly-sync.md).
- **Roadmap-runner** — phase inventory could validate `phases/*.yaml` coverage against declared roadmap phases.

## Status

| Aspect | State |
|--------|-------|
| Code | 💡 none |
| Spec | this page |
| Prerequisites in place | verification suite (`scripts/verify-all.js`), state stores, roadmap JSON — all exist |
| Next step if adopted | small Node script alongside the existing `scripts/verify-*.js` family |
