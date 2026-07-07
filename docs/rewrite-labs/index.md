---
title: "Rewrite Labs Documentation Index"
summary: "# Rewrite Labs Documentation Index"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Rewrite Labs Documentation Index

Complete reference for Rewrite Labs (RL) vault system, extraction, and integration with CIC.

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated

## Overview

- [RL Index](00-rl-index.md)
- [Vault README](vault-readme.md)
- [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md) — full RL-4.x status
- [Unified Roadmap](../roadmaps/unified-roadmap.md) — CIC ↔ RL alignment

## RL-4.x Phase Status

All seven RL-4.x phases have locked configs in `roadmap-runner/phases/`; the runner (`roadmap-runner/state-store.json`) records **zero runs** — execution awaits real phase Docker images.

| Phase | Title | Build | Runner |
|-------|-------|-------|--------|
| RL-4.6 | CrawlerEngine v1 | ✅ | ⏸ pending |
| RL-4.0 | Extraction Engine v1 | ✅ | ⏸ pending |
| RL-4.1 | RedesignAgent + DesignVariantRenderer | ✅ | ⏸ pending |
| RL-4.2 | SiteBundle + DeploymentAdapter | ✅ | ⏸ pending |
| RL-4.3 | ChatEditSession + DOMPatch | ✅ | ⏸ pending |
| RL-4.4 | SaaSPricingGate + EntitlementSet | ✅ | ⏸ pending |
| RL-4.5 | OutreachAgent | ✅ | ⏸ pending |

Details + dependency graph: [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md).

## Vault Mirror System

The Vault Mirror is the foundational extraction and sync system for Rewrite Labs.

### Setup & Configuration

- [Vault Mirror Overview](vault-mirror/executive-summary.md)
- [Vault Mirror Setup](vault-mirror/setup.md)
- [Configuration Guide](vault-mirror/configuration.md)
- [RL Setup](vault-mirror/rl-setup.md)

### Integration

- [Vault Sync Configuration](vault-sync-configuration.md)
- [CIC ↔ RL Integration](../reference/cic-rl-cross-reference.md)

## Data Pipeline

RL feeds into CIC's ingestion pipeline:

1. **Vault Extraction** → Extract source materials from GitHub
2. **Schema Mapping** → Convert to IR Packets (unified schema)
3. **Knowledge Graph** → Index into shared knowledge system
4. **Governance Application** → Apply rules from MAAL framework

**Related CIC Docs**:
- [CodeFlow Harvester](../cic/harvester.md)
- [Ingestion Architecture](../architecture/ingestion.md)
- [Knowledge Graph Setup](../reference/knowledge-graph/QUICK_START.md)

## Integration with CIC Systems

### Governance

RL artifacts are governed by the same MAAL framework as CIC:

- **Memory**: Shared MAAL ledger stores both CIC phases and RL artifacts
- **State**: RL mirror state syncs with CIC state store
- **Validation**: Canary gates apply to both systems

**Related**: [CIC Governance Framework](../cic/GOVERNANCE.md)

### Routing & Federation

RL provides fallback providers for CIC routing decisions:

- **Provider Pool**: RL configured providers (GitHub APIs, external services)
- **Fallback Chain**: Model selection falls back to RL providers
- **Determinism**: All fallback decisions are deterministic

**Related**: [Routing Architecture](../architecture/routing.md)

### Knowledge & Semantics

Both CIC and RL contribute nodes to the shared knowledge graph:

- **CIC Nodes**: Phases, components, decisions
- **RL Nodes**: Repository artifacts, documents, patterns
- **Shared Edges**: Dependencies, implementations, mirrors

**Related**: [Knowledge Graph Setup](../reference/knowledge-graph/QUICK_START.md)

### Observability

RL operations are monitored alongside CIC:

- **Metrics**: RL vault sync metrics in Prometheus
- **Tracing**: Extraction traces captured in unified dashboard
- **Health**: Vault mirror status in operations dashboard

**Related**: [Operations Guide](../operations/running.md)

## Quick Navigation

- **Getting Started**: [Vault Mirror Setup](vault-mirror/setup.md)
- **Architecture**: [Architecture Overview](../architecture/overview.md)
- **Integration**: [CIC ↔ RL Cross-Reference](../reference/cic-rl-cross-reference.md)
- **Operations**: [Running the System](../operations/running.md)
- **Knowledge**: [Knowledge Graph Setup](../reference/knowledge-graph/QUICK_START.md)

## Files & Locations

### RL System Files

```
rewrite-labs/
├── vault-mirror/          (extraction + sync)
├── VAULT-README.md        (system overview)
├── 00-RL-INDEX.md         (index)
└── VAULT-SYNC-CONFIGURATION.md (config ref)
```

### CIC Integration Points

- **Ingestion**: `cic/harvester.md` + `architecture/ingestion.md`
- **Governance**: `cic/GOVERNANCE.md`
- **Routing**: `gateway/providers.md` + `architecture/routing.md`
- **Knowledge**: `reference/knowledge-graph/QUICK_START.md`

## Status & Roadmap

- Current version: 1.0
- Last updated: 2026-07-03
- Doc/vault integration: ✅ complete (CIC-side); RL reference vault (`rl-ref/`) 📋 pending source-location confirmation
- Runner execution of RL-4.x wave: ⏸ pending (zero recorded runs)
- Full status: [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md) · [CIC ↔ RL Cross-Reference](../reference/cic-rl-cross-reference.md)
