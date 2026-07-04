---
title: RL-CRAWLER-V2-RUNNER
summary: "Runner config for RL Crawler v2: RL-4.6 v2 phase config + success gates."
created: "2026-07-04"
tags: [rewrite-labs, tickets, batch-4, crawler, runner]
---

# TICKET: RL-CRAWLER-V2-RUNNER

**Track:** 32 — RL Crawler v2 (Next-Gen Playwright Engine)
**Goal:** Add runner config for v2 crawler.

## Steps

1. Add RL-4.6 v2 runner config.
2. Add success gates.

## Output

- `roadmap-runner/phases/RL-4.6-v2.yaml`

## Dependencies

Requires engine from [rl-crawler-v2-core.md](rl-crawler-v2-core.md) and adapters from [rl-crawler-v2-adapters.md](rl-crawler-v2-adapters.md). Success gates validate through `roadmap-runner/success-gate-validator.js`.
