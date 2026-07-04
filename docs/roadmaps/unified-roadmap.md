# Unified CIC + Rewrite Labs Roadmap

Cross-system alignment view: how CIC phases and Rewrite Labs phases share infrastructure, and where each system stands. Detail lives in the [CIC Roadmap](cic-roadmap.md) and [Rewrite Labs Roadmap](rewrite-labs-roadmap.md).

**Last updated:** 2026-07-03

## Status Legend

✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated. Runner-managed phases: `Build` vs `Runner` (per `roadmap-runner/state-store.json`).

## RL-4.x → CIC Phase Mapping

Functional alignment between RL phases and the CIC phases/subsystems they depend on or feed:

| RL Phase | RL Deliverable | Aligned CIC Phase/Subsystem | RL Build | RL Runner |
|----------|----------------|-----------------------------|----------|-----------|
| RL-4.0 | Extraction Engine v1 | Phase 23 (memory/exploration surface) | ✅ | ⏸ pending |
| RL-4.1 | RedesignAgent + variants | Phase 23 | ✅ | ⏸ pending |
| RL-4.2 | SiteBundle + Delivery | Phase 24 (autonomous governance approvals) | ✅ | ⏸ pending |
| RL-4.3 | ChatEditSession + DOMPatch | Phase 26 (TorqueQuery shared ingestion/search) | ✅ | ⏸ pending |
| RL-4.4 | SaaSPricingGate + EntitlementSet | Governance layer (`governance/`) | ✅ | ⏸ pending |
| RL-4.5 | OutreachAgent | Phase 26 | ✅ | ⏸ pending |
| RL-4.6 | CrawlerEngine v1 | Ingestion pipeline (`cic-ingestion/`, `roadmap-runner/ingestion-config.json`) | ✅ | ⏸ pending |

The same table with per-phase links lives in the [CIC ↔ RL Cross-Reference](../reference/cic-rl-cross-reference.md).

## Shared Systems

| System | Real location | Used by CIC | Used by RL | Status |
|--------|---------------|-------------|------------|--------|
| Governance orchestration | `governance/` (orchestrator, approval-gate, promotion-rollback, audit-policy, audit-log, cicState.json) | ✅ | ✅ (RL-4.4 gates) | ✅ Done |
| Ingestion pipeline stages | `roadmap-runner/ingestion-config.json` (Crawler → Scraper → Mapper → Indexer) + `cic-ingestion/src/` | ✅ | ✅ (RL-4.6 crawl feeds it) | ✅ Done (config); code in `cic-ingestion/src/harvester/`, `src/drift/` |
| Roadmap runner | `roadmap-runner/` (scheduler, docker-runner, gates, state-store) | ✅ (PHASE-0.9, PHASE-26) | ✅ (RL-4.0→4.6) | Build ✅ / Runner ⏸ (all phases pending) |
| Routing engine | `src/cic-runtime/routing/` (5 routers) | ✅ | via shared fallback (`src/resilience/fallbackChain.ts`) | ✅ Done |
| Drift detection | 4 systems — see [Drift Classification](../architecture/drift.md) | ✅ | ✅ (vault/metadata drift) | ✅ Done |
| Cost & notification | `src/lib/notify/CostNotifier.ts`, `src/lib/report/CicCostComputeReport.ts` | ✅ | shared token economy | ✅ Done |
| Knowledge graph | `docs/reference/knowledge-graph/` | ✅ | ✅ | ✅ Done |

## IR Packet Lifecycle (shared data contract)

```
RL Vault / seed URLs
   → Crawler (raw_html)
   → Scraper (documents)
   → Mapper (IRPackets)          ← unified schema, see cross-reference
   → Indexer (search_index)
   → Knowledge Graph + MAAL governance + drift scoring
```

Stage names and timeouts are defined in `roadmap-runner/ingestion-config.json`; the IR Packet schema is documented in the [CIC ↔ RL Cross-Reference](../reference/cic-rl-cross-reference.md#data-contracts).

## Shared Agents

- **Implemented:** research skill (`docs/cic/research-skill/`), Toolforge skill catalog (`toolforge/skills/` — 10 skills incl. work-summarizer, roadmap-validator, toolforge-drift-monitor). See [Toolforge reference](../reference/toolforge.md).
- **Planned/agent-shaped services:** Gemini Coach + Antigravity IDE integration (`services/`) — see [Services reference](../reference/services.md).
- 💡 **Potential:** `toolforge/agents/` (outreach/delivery/analysis) — does not exist yet; RL-4.5's OutreachAgent is the nearest specced work.

## Cross-System Timeline Snapshot (2026-07-03)

| Track | Now | Next | Later |
|-------|-----|------|-------|
| CIC phases | 23.2 + 0.9 M3 🔄 | 28b, 24.5, 0.9.1 📋 | 30 MVP, 31–50 placeholders 📋 |
| CIC runtime | v0.8.0 ✅ | v0.9.0 Adaptive Memory 📋 | — |
| RL | configs locked ✅ | runner execution of RL-4.6→4.5 wave 📋 (blocked on real images) | post-4.5 phases 💡 |
| Shared infra | governance + routing + cost ✅ | System Index Builder 💡 ([spec](../reference/system-index-builder.md)) | — |

## Related

- [CIC Roadmap](cic-roadmap.md) · [Rewrite Labs Roadmap](rewrite-labs-roadmap.md)
- [CIC ↔ RL Cross-Reference](../reference/cic-rl-cross-reference.md)
- [Integration Overview](../integration/index.md) · [Systems Overview](../systems/index.md)
- [Weekly Sync Procedure](../operations/weekly-sync.md) · [Drift Forecast](../operations/drift-forecast.md)
