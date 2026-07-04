---
title: RL-6.X-AUTONOMOUS-REDESIGN
summary: "Autonomous redesign engine: multi-variant generator, scoring engine, selection engine."
created: "2026-07-04"
tags: [rewrite-labs, tickets, batch-5, rl-6x, redesign]
---

# TICKET: RL-6.X-AUTONOMOUS-REDESIGN

**Track:** 38 — RL-6.x (Autonomous Redesign Engine)
**Goal:** Add autonomous redesign engine.

## Steps

1. Add multi-variant redesign generator.
2. Add redesign scoring engine.
3. Add redesign selection engine.

## Output

- `src/rewrite-labs/redesign/v6/`

## Dependencies

[rl-6x-spec-generator.md](rl-6x-spec-generator.md) (wave 2). Scoring/selection follows canary-gate scoring patterns from the governance playbook.
