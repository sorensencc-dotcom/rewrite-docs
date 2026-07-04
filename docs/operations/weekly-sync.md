# Weekly Sync Procedure

One weekly pass that keeps roadmaps, ingestion, governance, drift, cost, and docs aligned across CIC and Rewrite Labs. Every step uses tools that already exist in the repo. Estimated time: 30–45 minutes.

**Cadence:** weekly (suggested Monday). Record findings in the week's [Drift Forecast](drift-forecast.md).

## 1. Roadmap sync

- Re-read `build-roadmap.json` and `roadmap-runner/state-store.json`; reconcile against the [CIC Roadmap](../roadmaps/cic-roadmap.md) and [RL Roadmap](../roadmaps/rewrite-labs-roadmap.md) status tables.
- Known standing conflict to re-check: Phase 24.5 (queued in `build-roadmap.json` vs integration-complete per Phase 28a doc).
- Diff any changed phase docs: `node scripts/roadmap-diff.js <old.md> <new.md>`.

## 2. Roadmap-runner sync

- Check `state-store.json` for new runs (`lastRunAt`, `runs[]`). If any phase moved off `pending`, update the dual Build/Runner statuses in all three roadmap docs.
- Verify `roadmap-runner/phases/*.yaml` count still matches the phases claimed in roadmap docs (currently 9: PHASE-0.9, PHASE-26, RL-4.0→4.6).

## 3. Ingestion sync

- Review `roadmap-runner/ingestion-config.json` for stage/timeout/retry changes; if changed, update [Ingestion Architecture](../architecture/ingestion.md) and [Integration Overview](../integration/index.md).
- Scan `cic-ingestion/src/` for new top-level modules (new dirs = doc updates needed).

## 4. Governance sync

- Review `governance/cicState.json`: nonzero drift scores, active playbooks, violations, freeze flags. Anything nonzero → note in drift forecast.
- Skim `governance/audit-log.json` tail for unexpected event types.
- Confirm governance CI (`.github/workflows/governance-validation.yml`) is green.

## 5. Drift sync (all four detectors)

- **Visual:** `node scripts/drift-detector.js --report` (dashboard panel regressions).
- **Docker image:** `node scripts/docker-drift-detector.js --json` (stale images vs source).
- **Ingestion/governance:** drift scores in `cicState.json` (covered in step 4).
- **Work-summarizer:** review latest work-summarizer output for drift signals.

## 6. Cost sync

- Confirm the weekly digest arrived (Slack/Email via `src/lib/notify/CostNotifier.ts`; env: `CIC_NOTIFY_ENABLED`).
- If not: `npx tsx scripts/test-cost-notifications.ts` to verify delivery path.
- Compare token totals against `slaSettings.maxTokens` budget; flag breaches.

## 7. Doc + metadata sync

- `mkdocs build --strict` — must pass with zero warnings.
- `node scripts/verify-all.js` — content + topology verification suite.
- Grep changed docs for paths that don't exist (anti-hallucination check; see verification section of the doc suite).

## 8. CIC ↔ RL alignment sync

- Re-generate the cross-system dependency map: `node scripts/link-roadmaps.js`.
- Check RL reference vault status in [00-RL-INDEX](../rewrite-labs/00-RL-INDEX.md) — still pending source-location confirmation? CIC vault last-synced date fresh?
- Confirm the RL-4.x → Phase mapping in the [Cross-Reference](../reference/cic-rl-cross-reference.md) still matches phase YAML dependencies.

## 9. Close out

- Write/update this week's [Drift Forecast](drift-forecast.md) with findings and predictions.
- File roadmap-status corrections as edits to `docs/roadmaps/*` in the same commit.

> 💡 Steps 1, 7, and 8 are candidates for automation by the proposed [System Index Builder](../reference/system-index-builder.md) (not implemented).
