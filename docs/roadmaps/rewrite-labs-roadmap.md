---
title: "Rewrite Labs Roadmap"
summary: "# Rewrite Labs Roadmap"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Rewrite Labs Roadmap

Canonical status roadmap for Rewrite Labs (RL) phases. Compiled from `roadmap-runner/phases/RL-4.*.yaml`, `roadmap-runner/state-store.json`, and the [Deploy Summary](../reference/DEPLOY_SUMMARY.md).

**Last updated:** 2026-07-03

## Status Legend

| Marker | Meaning |
|--------|---------|
| ✅ Done | Implemented and verified in repo |
| 🔄 In Progress | Active work, partial artifacts in repo |
| 📋 Planned | Committed next step; referenced in a roadmap/plan file |
| 💡 Potential | Idea/candidate only — no code or files exist yet |
| ⛔ Deprecated | Superseded or removed |

**Dual status for runner-managed phases.** Every RL-4.x phase has a locked config in `roadmap-runner/phases/` (Build track), but `roadmap-runner/state-store.json` (v3.0) records **zero runs — all phases `pending`**. Runner execution uses stub Docker images until real phase images are built (see [Integration Guide](../reference/INTEGRATION_GUIDE.md)). Do not read "Build ✅" as "runner-verified".

## RL-4.x Phase Wave

| Phase | Title | Depends on | Build | Runner |
|-------|-------|-----------|-------|--------|
| RL-4.6 | CrawlerEngine v1 (Playwright headless crawler) | — | ✅ config locked | ⏸ pending, 0 runs |
| RL-4.0 | Extraction Engine v1 (SiteExtractor + StyleMatchEngine) | RL-4.6 | ✅ config locked | ⏸ pending, 0 runs |
| RL-4.1 | RedesignAgent + DesignVariantRenderer | RL-4.0 | ✅ config locked | ⏸ pending, 0 runs |
| RL-4.2 | SiteBundle + DeploymentAdapter + Delivery Infrastructure | RL-4.1 | ✅ config locked | ⏸ pending, 0 runs |
| RL-4.3 | ChatEditSession + InstructionParser + DOMPatch | RL-4.2 | ✅ config locked | ⏸ pending, 0 runs |
| RL-4.4 | SaaSPricingGate + EntitlementSet | RL-4.2 (parallel with RL-4.3) | ✅ config locked | ⏸ pending, 0 runs |
| RL-4.5 | OutreachAgent (automated outreach pipeline) | RL-4.3 + RL-4.4 | ✅ config locked | ⏸ pending, 0 runs |

Each phase config defines container image, command, env, dependencies, and success gates (exit code, metric thresholds, output patterns). Example gates for RL-4.0: `dom_parse_success_rate >= 0.95`, `style_match_confidence_avg >= 0.75`.

### Dependency graph

```
RL-4.6 (CrawlerEngine)
   └─ RL-4.0 (Extraction) ── RL-4.1 (Redesign) ── RL-4.2 (SiteBundle/Delivery)
                                                     ├─ RL-4.3 (ChatEdit/DOMPatch) ─┐
                                                     └─ RL-4.4 (PricingGate) ───────┴─ RL-4.5 (Outreach)
```

## Vault Mirror System

| Component | Status | Evidence |
|-----------|--------|----------|
| Vault Mirror extraction + sync | ✅ Done | [Executive Summary](../rewrite-labs/vault-mirror/executive-summary.md), [Setup](../rewrite-labs/vault-mirror/setup.md) |
| CIC reference vault sync (`cic-ref/`) | ✅ Done | Last synced 2026-07-02 per [RL Index](../rewrite-labs/00-RL-INDEX.md) |
| RL reference vault sync (`rl-ref/`) | 📋 Planned | Awaiting source-location confirmation (OneDrive/Drive/GitHub) — see [RL Index](../rewrite-labs/00-RL-INDEX.md) |

## 📋 Planned / Next

- **Runner execution of RL-4.6 → RL-4.5 wave** — configs and gates locked; blocked on real phase Docker images replacing stubs.
- **RL reference vault population** (`rl-ref/`) — blocked on source-location confirmation.
- **Architecture pattern folders** (`architecture/rl-patterns/`) — planned per [RL Index](../rewrite-labs/00-RL-INDEX.md).

## 💡 Potential

- Additional RL phases beyond RL-4.5 — none specced; no RL-5.x configs exist in `roadmap-runner/phases/`.

## ⛔ Deprecated

- No RL phases deprecated to date. (CIC-side deprecations that touch RL infrastructure — operator-UI clones, `planning-engine/` clone — are tracked in the [CIC Roadmap](cic-roadmap.md).)

## Related

- [CIC Roadmap](cic-roadmap.md)
- [Unified Roadmap](unified-roadmap.md)
- [CIC ↔ RL Cross-Reference](../reference/cic-rl-cross-reference.md)
- [Roadmap Runner](../operations/roadmap-runner.md)
