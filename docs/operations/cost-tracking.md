---
title: "Cost Tracking & Notifications"
summary: "# Cost Tracking & Notifications"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Cost Tracking & Notifications

The real CIC cost system lives in `src/lib/` — **not** in standalone CLI scripts. (No `scripts/cost-notifier.js` or `scripts/token-cost-report.js` exists; anything referencing those paths is stale.)

## Components

| Component | Path | Role |
|-----------|------|------|
| Cost notifier | `src/lib/notify/CostNotifier.ts` | Slack webhook + Email delivery of daily/weekly cost digests (`sendSlackDaily`, …). Has test suite (`CostNotifier.test.ts`) |
| Unified report | `src/lib/report/CicCostComputeReport.ts` | Single source of truth for cost/usage analytics — daily/weekly tokens from `UsageLedger`, GPU cost from `GpuAmortization` |
| HTML/PDF rendering | `src/lib/report/renderReportHtml.ts`, `src/lib/report/htmlToPdf.ts` | Renders the report to HTML and converts to PDF |
| PDF generator | `scripts/cicCostComputePdf.ts` | Generates daily/weekly PDF reports from cost data |
| Notification tester | `scripts/test-cost-notifications.ts` | Sends sample digests to Slack/Email (`npx tsx scripts/test-cost-notifications.ts`) |
| Supporting libs | `src/lib/usage/`, `src/lib/cost/`, `src/lib/charts/` | Usage ledger, GPU amortization, chart rendering |

## Configuration

Environment variables:

- `CIC_NOTIFY_ENABLED` — master switch for digest delivery
- `CIC_SLACK_WEBHOOK_URL` — Slack incoming webhook
- `CIC_NOTIFY_EMAIL` — email digest recipient

## Cost ↔ governance loop

Token usage recorded by the usage ledger feeds two places:

1. **Digests** — daily/weekly Slack/Email summaries via `CostNotifier`.
2. **Drift penalties** — token-budget breaches count against provider SLA in `governance/cicState.json` (`slaSettings.maxTokens`), raising drift scores that the routing engine then acts on. See [Drift Classification](../architecture/drift.md) and [Routing](../architecture/routing.md).

## 💡 Potential (not implemented)

- Standalone CLI wrappers (`cost-notifier` / `token-cost-report` commands) — would thinly wrap the `src/lib` modules; no code exists.

## Related

- [Weekly Sync Procedure](weekly-sync.md) — includes the cost digest review step
- [Integration Overview](../integration/index.md) — drift → routing → cost loop
