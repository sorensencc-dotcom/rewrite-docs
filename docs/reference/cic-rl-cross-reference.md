---
title: "CIC ↔ RL Cross-Reference Map"
summary: "# CIC ↔ RL Cross-Reference Map"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC ↔ RL Cross-Reference Map

Detailed mapping of all integration points between CIC and Rewrite Labs systems.

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated

## RL-4.x → CIC Phase Mapping

Functional alignment between RL phases and CIC phases/subsystems. Build status = phase config locked + deliverables per roadmap docs; Runner status = execution recorded in `roadmap-runner/state-store.json` (currently **zero runs for all phases**).

| RL Phase | RL Deliverable | Aligned CIC Phase/Subsystem | Build | Runner | Config |
|----------|----------------|-----------------------------|-------|--------|--------|
| RL-4.0 | Extraction Engine v1 | Phase 23 | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.0.yaml` |
| RL-4.1 | RedesignAgent + DesignVariantRenderer | Phase 23 | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.1.yaml` |
| RL-4.2 | SiteBundle + DeploymentAdapter | Phase 24 (autonomous governance) | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.2.yaml` |
| RL-4.3 | ChatEditSession + DOMPatch | Phase 26 (TorqueQuery) | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.3.yaml` |
| RL-4.4 | SaaSPricingGate + EntitlementSet | Governance layer (`governance/`) | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.4.yaml` |
| RL-4.5 | OutreachAgent | Phase 26 | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.5.yaml` |
| RL-4.6 | CrawlerEngine v1 | Ingestion pipeline (`cic-ingestion/`) | ✅ | ⏸ pending | `roadmap-runner/phases/RL-4.6.yaml` |

Full phase details: [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md) · [CIC Roadmap](../roadmaps/cic-roadmap.md) · [Unified Roadmap](../roadmaps/unified-roadmap.md)

## Namespace Mapping

### Governance & State

| CIC | RL | Unified |
|-----|----|----|
| MAAL Core | — | Ledger Substrate |
| Governance Framework | Vault Policies | Memory System |
| State Store | Mirror State | Artifact Vault |
| Canary Gates | — | Validation Layer |

**Key Files**:
- `src/maal/core/` (CIC governance)
- `rewrite-labs/vault-mirror/` (RL state sync)

### Data Pipeline

| Stage | CIC | RL | Unified |
|-------|-----|----|----|
| Crawl | CodeFlow Harvester | Vault Extraction | ingestion-config.json |
| Extract | Scraper | Vault Mirror | Source Extraction |
| Map | IR Packet Mapper | Metadata Schema | IRPackets |
| Index | Knowledge Graph | Graph Indexer | Knowledge System |

**Key Files**:
- `src/cic/harvester.ts` (CodeFlow)
- `rewrite-labs/vault-mirror/` (Vault)
- `roadmap-runner/ingestion-config.json` (unified config)

### Routing & Federation

| Component | CIC | RL | Unified |
|-----------|-----|----|----|
| Primary Chain | ModelRouter | — | Local-First |
| Fallback Chain | FallbackChain | Provider Fallbacks | Federation |
| Model Selection | AgentRoutingProfile | Bias Weights | Deterministic |
| Provider Config | Grok, OpenRouter, Ollama | External APIs | Gateway |

**Key Files**:
- `src/resilience/fallbackChain.ts` (FallbackChain)
- `src/core/modelRouter.ts` (routing)
- `gateway/providers.md` (configuration)

### Knowledge & Semantics

| System | CIC | RL | Unified |
|--------|-----|----|----|
| Knowledge Graph | Phase nodes | Vault nodes | Shared Graph |
| IR Packets | Component schema | Artifact schema | Unified Schema |
| Drift Detection | Pattern matching | Metadata comparison | Common Engine |
| Memory | MAAL ledger | Mirror state | Unified State |

**Key Files**:
- `reference/knowledge-graph/` (graph implementation)
- `src/drift/driftEngine.ts` (drift detection)

### Operations & Observability

| Layer | CIC | RL | Unified |
|-------|-----|----|----|
| Metrics | Prometheus (CIC) | Metrics (RL) | Combined Dashboard |
| Tracing | CIC Traces | RL Traces | Unified View |
| Determinism | Sandbox-3 | Docker tests | Harness |
| Deployment | Docker Compose | Scripts | K8s / Compose |

**Key Files**:
- `operations/monitoring.md` (observability)
- `cic/SANDBOX-3_OVERVIEW.md` (determinism)
- `docker-compose.yml` (unified runtime)

## Dependency Graph

```
┌─────────────────────────┐
│ RL Vault                │
└────────────┬────────────┘
             │ (extraction)
             ▼
┌─────────────────────────────────────┐
│ CIC CodeFlow Harvester              │
│ ├─ Crawl                            │
│ ├─ Extract (Scraper)                │
│ └─ Map (IR Packet Mapper)           │
└────────────┬────────────────────────┘
             │ (ingestion)
             ▼
┌─────────────────────────────────────┐
│ Unified Knowledge Graph             │
│ ├─ CIC Phase Nodes                  │
│ ├─ RL Artifact Nodes                │
│ └─ Shared Edges (depends-on, etc)   │
└────────────┬────────────────────────┘
             │ (semantic queries)
             ▼
┌─────────────────────────────────────┐
│ MAAL Governance + Routing           │
│ ├─ Memory System                    │
│ ├─ Drift Detection                  │
│ ├─ Model Routing                    │
│ └─ Fallback Chains                  │
└─────────────────────────────────────┘
```

## Data Contracts

### IR Packet Schema

Used for both CIC and RL extraction:

```json
{
  "source": "cic|rl",
  "type": "phase|artifact|decision|implementation",
  "id": "unique-id",
  "name": "readable-name",
  "metadata": {
    "version": "1.0",
    "created": "ISO8601",
    "modified": "ISO8601"
  },
  "content": "full-text",
  "dependencies": ["id1", "id2"],
  "tags": ["tag1", "tag2"]
}
```

### State Sync Protocol

Memory state synced between CIC and RL:

```json
{
  "system": "cic|rl",
  "state_version": "1",
  "timestamp": "ISO8601",
  "memory": {
    "phases": [],
    "decisions": [],
    "artifacts": []
  },
  "checksum": "sha256-hash"
}
```

## Integration Checklist

- [ ] Vault extraction runs daily (RL)
- [ ] CodeFlow harvester indexes (CIC)
- [ ] Knowledge graph synchronized
- [ ] Governance rules applied (both)
- [ ] Drift detection runs (both)
- [ ] Model routing deterministic (both)
- [ ] Canary gates pass (both)
- [ ] Observability dashboards updated (both)

## Troubleshooting Cross-System Issues

### Issue: RL Vault not syncing

**Check**:
1. `rewrite-labs/vault-mirror/` configuration
2. GitHub token in `.env`
3. Sync daemon logs

**Fix**: See [RL Setup Guide](../rewrite-labs/RL-VAULT-SETUP.md)

### Issue: Knowledge graph incomplete

**Check**:
1. CodeFlow harvester running
2. IR packet schema validation
3. Graph indexer state

**Fix**: See [Knowledge Graph Setup](../reference/knowledge-graph/SETUP_GUIDE.md)

### Issue: Routing inconsistency

**Check**:
1. FallbackChain state (CLOSED/OPEN/HALF_OPEN)
2. Provider config alignment
3. MAAL memory sync

**Fix**: See [Routing Architecture](../architecture/routing.md)

## Performance Metrics

Key metrics tracked across both systems:

- **Ingestion latency**: Source → indexed (target: <5s)
- **Knowledge graph queries**: Graph node lookup (target: <100ms)
- **Model routing decision**: Selection time (target: <50ms)
- **Drift detection**: Full scan (target: <10s)
- **State sync**: Memory checkpoint (target: <2s)

See [Monitoring Guide](../operations/monitoring.md) for setup.
