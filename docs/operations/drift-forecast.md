# Weekly Drift Forecast

Narrative forecast of where documentation, roadmaps, and systems are most likely to diverge in the coming weeks. Updated as part of the [Weekly Sync Procedure](weekly-sync.md).

**Forecast date:** 2026-07-03

## Current known gaps (seed findings)

These are verified divergences as of this forecast — the baseline the next sync should check first:

1. **Runner state vs build claims.** `roadmap-runner/state-store.json` shows all 9 phases (RL-4.0→4.6, PHASE-0.9, PHASE-26) `pending` with zero runs, while build-side docs describe those phases as complete. The dual Build/Runner convention covers this, but any doc that says "complete" without qualification will drift further from runner reality until real phase images replace the stubs.
2. **Phase 24.5 status conflict.** `build-roadmap.json` queues Phase 24.5 (behind 28b) while `PHASE-28a-SCP-COMPLETION.md` documents its governance integration as complete. One of the two sources is stale; reconcile and update the [CIC Roadmap](../roadmaps/cic-roadmap.md).
3. **RL vault source unconfirmed.** `rl-ref/` remains empty pending source-location confirmation ([00-RL-INDEX](../rewrite-labs/00-RL-INDEX.md)). Every week this stays open, RL-side reference docs fall further behind CIC-side (last CIC sync 2026-07-02).
4. **Stub Docker images.** Phase containers referenced in `roadmap-runner/phases/*.yaml` point at registry images that are stubs. Runner metrics gates (e.g. `dom_parse_success_rate`) are unverifiable until real images exist.
5. **`cic-os/` naming hazard.** The `cic-os/` directory contains only a personal-knowledge-base stub, but the name invites docs/briefs to describe it as the core codebase (it happened in the brief that produced this doc set). Real code is distributed — see [Architecture Overview](../architecture/overview.md).
6. **Analyzers archive-only.** Analyzer code exists only in archives (`_cic-fragments-archive/`, `rewrite-mcp/castironforge/`). Docs that mention "CIC analyzers" as active will be wrong until code is restored or references removed.

## Forecast: likely drift next 2–4 weeks

- **Roadmap misalignment (high likelihood).** Phases 23.2 and 0.9 M3 are in-progress; when they complete, `build-roadmap.json`, `docs/roadmaps/cic-roadmap.md`, and `docs/cic/index.md` must move together — historically they haven't. Watch also 28b unblocking 24.5.
- **Ingestion changes (medium).** `cic-ingestion/src/` is the most actively developed tree (harvester v2, drift engines). New modules will appear before docs mention them; step 3 of the weekly sync catches this.
- **Governance changes (medium).** Drift scores in `cicState.json` are currently all zero with no active playbooks — a clean baseline. First real ingestion runs will move these; expect the drift → routing → cost loop docs to need concrete-value updates.
- **Cross-system dependency shifts (medium).** If runner execution starts, RL-4.6 → RL-4.0 → … completion order will create new CIC dependencies (TorqueQuery load, governance approvals for RL-4.2/4.4) not yet reflected in the [Cross-Reference](../reference/cic-rl-cross-reference.md).
- **Documentation gaps (medium).** The `docs/meta/` build-artifact pile (42+ docs) keeps growing and is mostly outside nav; expect orphan warnings from `mkdocs build --strict` when files are added without nav entries.
- **Roadmap-runner changes (low-medium).** Scheduler enforcement patch (manifest freshness) is documented as copy-paste pending in the [Integration Guide](../reference/INTEGRATION_GUIDE.md); if applied, runner behavior changes (refuses stale graphs) and the runner doc needs an update.
- **Placeholder-phase inflation (low).** Phases 31–50 sit queued with no specs. Risk: docs or briefs treating them as scoped work. They are placeholders until specs exist in `docs/cic/`.

## How to update this forecast

Each weekly sync: strike resolved items from "Current known gaps", add new findings, and re-score the forecast bullets (high/medium/low). Keep prior forecasts in git history rather than in-file archives.
