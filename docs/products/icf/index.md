---
title: "Iron Command Forge (ICF)"
summary: "Standalone command center for the dashboard, weekly retro reporting, and telemetry aggregation."
tags:
  - products
  - icf
---

# Iron Command Forge (ICF)

Iron Command Forge is a standalone operational command center. The README describes it as the reporting engine, telemetry aggregator, and knowledge dashboard, in its own repository. The weekly retro contract draws the same line: this repo does not migrate or modify kb-sync, Toolforge, or the wiki dashboard.

What you run locally is the gateway. `npm start` serves the dashboard and the reporting API. The README opens that server at `http://127.0.0.1:8080`, and the port defaults to 8080. The dashboard titles itself "IRON COMMAND FORGE — Unified Operations & Knowledge Graph." The sections are the Daily Command Feed, the Unified MCP Matrix, the Knowledge Graph and Validation Vault, TRM Cognitive Intelligence, Weekly Reporting Telemetry, Operations and Automation, the Headroom Optimizer, Graft and Drift, Toolforge Skills, and Execution History and Errors. The header Docs control is titled "Open local MkDocs (rewrite-docs on :8001)". The page uses the Cast Iron Charlie design-system tokens checked in under `dashboard/_ds/`. Node.js 22.5.0 or newer is required, because the snapshot store uses native `node:sqlite`. The README also expects PowerShell 7 or newer. The checked-in `scripts/` directory holds the dashboard supervisor, the scheduled-task registration, and the weekly-retro publisher.

Weekly retro reporting is the piece with a written contract. `GET /api/reporting/weekly-retro` reads and validates the current report. History, category, evidence, action, and routing endpoints are bounded projections, and readers stay available without a snapshot writer. `publishWeeklyRetro` writes only when `ICF_WEEKLY_RETRO_WRITER_ENABLED` is `true`, `TRUE`, or `1`. The publication runbook says that flag defaults off. Generation finishes, the report is validated, and only then does SQLite persistence happen. Snapshot upserts are atomic, and writing the same snapshot again is idempotent. A snapshot is identified by `sourceSystem`, `sourceId`, `weekKey`, and `categoryId`. The launch registry has four categories: Delivery, Quality, Reliability, and Governance. Actions keep a stable identity and their carry-forward history. Redaction removes raw wording, owner, history, and provenance, and leaves a safe aggregate. Rollback is turning the writer flag off and restarting the publisher. Readers keep serving the last valid snapshot. The contract treats production rollout, remote publication, and migration of the existing dashboard as separate work.

The same gateway has a server-sent event stream at `/api/events`, `/api/stream`, and `/api/reporting/stream`. It also reads Ironbots daily status, TRM ingress, storage, and the mobile outbox. `/api/mobile/snapshot` and `/api/mobile/health` serve a signed weekly-retro snapshot, which requires `ICF_SNAPSHOT_SIGNING_KEY` and `ICF_MOBILE_AUTH_TOKEN`.

The Ironbots writeup describes a background fleet supervised by this telemetry aggregator: Notebook-Ingester, KB-Sentinel, TRM-Bot, Watchlist-Miner, Daemon-Healer, CI-Watchdog, and IronBot Task Monitor. That document owns the schedules, the unattended-task policy, and the commands. It places the Task Monitor under the kb-sync checkout, not in this repository. The root `package.json` has `npm run bot:*` scripts for the other bots and a daily reporter. The README says the reporting workspace includes 83 verified unit and contract tests. `npm test` is how the README runs the suites. This page does not copy the quick start.

## Where the writeups live

The full tree stays in the ICF repository. This page is only the index. GitHub's default branch is `codex/weekly-retro-reporting`, not `main`.

- GitHub: [sorensencc-dotcom/icf](https://github.com/sorensencc-dotcom/icf)
- Product README: [README.md](https://github.com/sorensencc-dotcom/icf/blob/codex/weekly-retro-reporting/README.md)
- Weekly retro contract: [reporting/docs/weekly-retro-reporting-contract.md](https://github.com/sorensencc-dotcom/icf/blob/codex/weekly-retro-reporting/reporting/docs/weekly-retro-reporting-contract.md)
- Publication and rollback: [reporting/docs/weekly-retro-publication-runbook.md](https://github.com/sorensencc-dotcom/icf/blob/codex/weekly-retro-reporting/reporting/docs/weekly-retro-publication-runbook.md)
- Ironbots fleet: [docs/ironbots-autonomous-agent-pipeline.md](https://github.com/sorensencc-dotcom/icf/blob/codex/weekly-retro-reporting/docs/ironbots-autonomous-agent-pipeline.md)
- Architecture diagrams: [docs/](https://github.com/sorensencc-dotcom/icf/tree/codex/weekly-retro-reporting/docs)
- Wiki source (Home, Architecture, Reporting Engine, Web Dashboard, Operations Guide): [wiki/](https://github.com/sorensencc-dotcom/icf/tree/codex/weekly-retro-reporting/wiki)
- Local checkout on this machine: `C:\dev\icf`
