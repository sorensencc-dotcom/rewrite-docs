---
title: "Roadmap Runner"
summary: "# Roadmap Runner"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Roadmap Runner

Phase execution engine at `c:\dev\roadmap-runner\`. Loads the compiled roadmap dependency graph, resolves runnable phases, executes them in Docker containers, validates success gates, and tracks state. Repo-level docs: `roadmap-runner/README.md` and `roadmap-runner/STARTUP_CHECKLIST.md` (summarized here, not duplicated).

**Status (2026-07-03):** system Build ✅ (production-ready per [Deploy Summary](../reference/DEPLOY_SUMMARY.md)); Runner execution ⏸ — all 9 configured phases `pending` with zero runs in `state-store.json`; phase Docker images are stubs.

## Components

| Component | File | Role |
|-----------|------|------|
| Scheduler | `roadmap-runner/scheduler.js` | Main orchestrator: load graph → resolve dependencies → execute phases → validate gates |
| Docker runner | `roadmap-runner/docker-runner.js` | Spawns a Docker container per phase, captures output, extracts metrics |
| Success-gate validator | `roadmap-runner/success-gate-validator.js` | Evaluates gates declared in phase YAML (exit codes, metric thresholds, output patterns) |
| Visualizer | `roadmap-runner/visualize.js` | Generates HTML timeline of all phases in `phases/` |
| State store | `roadmap-runner/state-store.json` | Per-phase status + run history (v3.0). Source of truth for **Runner** status in the roadmaps |
| Ingestion config | `roadmap-runner/ingestion-config.json` | CIC + TorqueQuery pipeline stages: Crawler → Scraper → Mapper → Indexer, with per-stage timeouts + retry policy |
| Phase configs | `roadmap-runner/phases/*.yaml` | 9 phases: PHASE-0.9, PHASE-26, RL-4.0 → RL-4.6. Each declares container, command, env, dependencies, success gates, deliverables |
| Ops | `docker-compose.yml`, `Dockerfile`, `Makefile`, `prometheus.yml` | Local runtime + metrics scrape config |

## Phase YAML shape

Each phase config declares: `id`, `title`, `owner`, `container`, `command`, `env`, `dependencies`, `success_gates` (types: `exit_code`, `metric` with op/threshold, `output` regex), and `metadata` (deliverables, test coverage, estimated duration). Example gates (RL-4.0): `dom_parse_success_rate >= 0.95`, `style_match_confidence_avg >= 0.75`.

## Companion scripts (repo `scripts/`)

| Script | Role |
|--------|------|
| `scripts/roadmap-diff.js` | Compares two roadmap markdown files line-by-line — use to diff phase doc revisions |
| `scripts/link-roadmaps.js` | Rewrite Labs → CIC roadmap linker; generates cross-system dependency map from shared tokens |

## Dual-status convention

Roadmap docs report runner-managed phases with two statuses:

- **Build** — engineering deliverables complete per completion docs/commits.
- **Runner** — execution recorded in `state-store.json`.

A phase can be Build ✅ while Runner shows ⏸ pending: configs and gates are locked, but no container run has been recorded (current state for every phase). Runner execution is blocked on real phase images replacing the stubs (see the caveat in the [Integration Guide](../reference/INTEGRATION_GUIDE.md)).

## Enforcement

The scheduler integrates with TheFoundry's compiled-docs manifest (freshness enforcement): it refuses to run when the roadmap dependency graph is stale — see [Integration Guide](../reference/INTEGRATION_GUIDE.md).

## Related

- [CIC Roadmap](../roadmaps/cic-roadmap.md) · [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md) · [Unified Roadmap](../roadmaps/unified-roadmap.md)
- [Weekly Sync Procedure](weekly-sync.md) — includes the state-store vs build-roadmap reconciliation step
