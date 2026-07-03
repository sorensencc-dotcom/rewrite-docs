---
title: "Competitive Teardown REVIEW"
summary: "# Review: Competitive Teardown — Repaint vs Rewrite Labs"
created: "2026-07-03T19:43:45.815Z"
updated: "2026-07-03T19:43:45.815Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Review: Competitive Teardown — Repaint vs Rewrite Labs

Reviewed: 2026-06-13T00:00:00Z
Reviewer: ijfw-review
Domain: software / strategic-planning

## Summary

Teardown is structurally sound and repo-verified where it checks code. Three BLOCK issues undermine implementation-readiness: the discovery layer (web crawler) is entirely absent from the missing-primitives list; the phase dependency graph has a start-before-dependency-exists error (RL-4.2 starts Week 3, depends on RL-4.1 output that completes Week 4); and the capability matrix overstates discovery readiness as "Spec'd (stub)" when no crawler code exists at all. Fix these before using this document to drive sprint planning.

---

## BLOCK findings (must-fix)

- `Section 6 (Missing Primitives)`: `CrawlerEngine` / web discovery not listed — without it the pipeline has no seed URLs and `SiteExtractor` is unreachable. Add `CrawlerEngine` (Playwright/Puppeteer, robots.txt compliance, politeness delay, URL dedup) as a prerequisite to Phase RL-4.0.

- `Section 4 / Phase RL-4.2 (Week 3–5)`: Chat Edit Loop depends on HTML output from `RedesignAgent`, which completes end of Week 4 in Phase RL-4.1. Starting RL-4.2 in Week 3 is a hard dependency violation. Shift RL-4.2 start to Week 5.

- `Section 2 (Capability Gap Matrix) — "Automated discovery" row`: Marked "Spec'd (stub)" — inaccurate. No crawler stub exists in `packages/agents/`. PRD doc is not a stub. Correct to "Spec only (no code)".

---

## FLAG findings (should-discuss)

- `Section 3 (Architecture Diffs) — Repaint architecture`: Labeled "inferred from report" but treated as authoritative for gap analysis. Repaint is closed-source. If their internal architecture differs (e.g. server-side rendering vs DOM diffing), the gap prioritization shifts. Flag assumptions explicitly or mark whole section as estimated.

- `Section 7 (Risks) — "Zero-touch delivery without user consent" mitigation`: "claim-to-launch step" is not sufficient for GDPR. Outbound scraping + contact of EU businesses requires a documented lawful basis under GDPR Article 6(1)(f) (legitimate interest) with a balancing test. Mitigation must name lawful basis or exclude EU outreach from MVP.

- `Section 4 / Phase RL-4.4 — "$29/month flat pricing"`: No unit economics supporting this figure. LLM inference cost per site (extraction + redesign + chat edits) is unbounded without token caps. Price recommendation without cost-per-site analysis is a financial risk. Add cost floor before locking pricing.

- `Section 5 (Roadmap)` — No owner, team, or resource assignment on any phase. Stated constraint is "implementation-ready." Unassigned milestones are not implementation-ready. Add owner field per phase or note explicitly that resourcing is out of scope.

- `Section 1 (Repo Capability Audit) — "Pricing Engine | Shipped"`: `pricing-engine/generator.ts` was not read in the review session. Marked Shipped on directory presence alone. Verify `generator.ts` exports a usable function before treating as production-ready.

---

## NIT findings (polish)

- `Section 8 — "$29/month undercuts Repaint by $1"`: Marketing tactic framing in operator-grade analysis. Either justify with cost data or remove; price anchoring belongs in the sales playbook not the architecture teardown.

- `Section 4 / RL-4.0 success gate`: "≥80% accuracy on 10 test sites" — accuracy against what ground truth? Define measurement method (human labeled tokens vs computed diff) or the gate is unverifiable.

- `Section 2 (Gap table)` — "Flat monthly pricing" row has "Undefined" for Rewrite Labs. Pricing-engine package exists. Update to "Spec'd, no entitlement model" for precision.
