---
title: "CIC + Rewrite Labs Integration"
summary: "# CIC + Rewrite Labs Integration"
created: "2026-07-04T01:46:48.704Z"
updated: "2026-07-04T01:46:48.704Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC + Rewrite Labs Integration

Cross-system dependencies, data flow, and unified patterns.

**Status legend:** ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated

## Integration Layers

### 1️⃣ Governance Integration — ✅

Both CIC and RL are governed by the same framework (`governance/`):

- **Memory System**: Unified across both (MAAL ledger)
- **State Store**: Shared artifact vault; live runtime state in `governance/cicState.json`
- **Drift Detection**: Common classification schema
- **Validation Gates**: Shared canary + rollback (`governance/approval-gate.ts`, `governance/promotion-rollback.ts`)

**Files**:
- [CIC Governance](../cic/governance.md)

### 2️⃣ Ingestion Pipeline — ✅

Data flows through four config-defined stages (`roadmap-runner/ingestion-config.json`): **Crawler** (seed_urls → raw_html) → **Scraper** (raw_html → documents) → **Mapper** (documents → IRPackets) → **Indexer** (IRPackets → search_index), with retry (3 attempts, 30s backoff).

Note: Crawler/Scraper/Mapper/Indexer are *pipeline stage names* in config, not code directories. Implementing code lives in `cic-ingestion/src/` (`harvester/`, `drift/`, ingestion modules).

- **Source**: RL Vault (GitHub, docs, manifests)
- **Extraction**: CodeFlow Harvester (CIC)
- **Mapping**: IR Packets (unified schema)
- **Indexing**: Knowledge Graph (shared)

**Files**:
- [Ingestion Architecture](../architecture/ingestion.md)
- [RL Vault Setup](../rewrite-labs/vault-readme.md)
- [CodeFlow Harvester](../cic/harvester.md)

### 3️⃣ Routing Integration — ✅

Model selection rules apply across both systems:

- **Primary Chain**: CIC routing (local-first) — `src/cic-runtime/routing/`
- **Fallback Chain**: `src/resilience/fallbackChain.ts` (CLOSED/OPEN/HALF_OPEN circuit states)
- **Federation**: Multi-vendor selection
- **Cost Governance**: Shared token economy — see [Cost Tracking](../operations/cost-tracking.md)

**Files**:
- [Routing Architecture](../architecture/routing.md)
- [Provider Configuration](../gateway/providers.md)

#### Drift → Routing → Cost governance loop

Live state in `governance/cicState.json` closes the loop:

1. **Drift scoring** — per-provider drift scores (ollama, localai, gpt4all, llamafile, koboldcpp, anythingllm, mock) updated from SLA breaches; decayed 5% per 30s cycle.
2. **SLA settings/metrics** — `maxLatencyMs`, `maxTokens`, `maxBacklog`, `maxOscillations` vs live averages.
3. **Playbooks** — driftSpike, routingStability, backendRecovery, ingestionRecovery, governanceLockdown, dashboardRecovery toggle on threshold breach.
4. **Freezes** — `routingFrozen`, `promotionsFrozen`, `rollbacksFrozen`, `governanceLockdown` gate all promotion/rollback actions.
5. **Cost feedback** — token usage feeds drift penalties and the daily cost digest ([Cost Tracking](../operations/cost-tracking.md)).

### 4️⃣ Knowledge Graph

Unified semantic model:

- **CIC Nodes**: Phases, components, decisions
- **RL Nodes**: Vault items, artifacts, patterns
- **Shared Edges**: Depends-on, implements, mirrors

**Files**:
- [Knowledge Graph Setup](../reference/knowledge-graph/quick-start.md)
- [Knowledge Graph README](../reference/knowledge-graph/readme.md)

### 5️⃣ Operations & Monitoring

Both systems share the same ops stack:

- **Prometheus**: Metrics from both
- **Sandbox-3**: Determinism testing
- **Dashboards**: Unified observability
- **Canary Gates**: Shared validation

**Files**:
- [Operations Guide](../operations/running.md)
- [Sandbox-3 Overview](../cic/sandbox-3-overview.md)
- [Monitoring](../operations/monitoring.md)

### 6️⃣ Services Layer — 🔄

Agentic experience services (`services/`) integrate on top of CIC routing:

- **Gemini Coach** (`services/gemini-coach/`) — routing engine + messaging + CIC hooks (src modules: routing, messaging, cic-hooks, ide, mcp, skills)
- **Antigravity IDE** (`services/antigravity-ide/`) — IDE integration layer consuming Gemini Coach's routing engine (`integration.ts`, `wsClient.ts`, `patches.ts`, `applyFixesFlow.ts`)

**Files**:
- [Services Reference](../reference/services.md)

## Data Flow Diagrams

```
┌─────────────────────────────────────────────────────────┐
│ Rewrite Labs Vault (Source)                             │
│ ├─ GitHub repos                                         │
│ ├─ Documentation                                        │
│ └─ Manifests                                            │
└──────────────────┬──────────────────────────────────────┘
                   │ (RL Vault Extraction)
                   ▼
┌─────────────────────────────────────────────────────────┐
│ CIC Ingestion Pipeline                                  │
│ ├─ CodeFlow Harvester (crawl/extract)                   │
│ ├─ IR Packet Mapper (unify schema)                      │
│ └─ Knowledge Graph Indexer                              │
└──────────────────┬──────────────────────────────────────┘
                   │ (Unified Knowledge)
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Shared Systems                                          │
│ ├─ MAAL Governance (state + memory)                     │
│ ├─ Routing Engine (model selection)                     │
│ ├─ Observability (metrics + tracing)                    │
│ └─ Canary Gates (validation + rollback)                 │
└─────────────────────────────────────────────────────────┘
```

## Cross-References

### CIC Components Dependent on RL

| CIC Component | RL Dependency | Purpose |
|---------------|---------------|---------|
| Vault Mirror | RL Vault | Artifact sync |
| Knowledge Graph | RL Metadata | Semantic nodes |
| CodeFlow | RL Source Code | Pattern extraction |
| Governance | RL Policies | Validation rules |

### RL Components Dependent on CIC

| RL Component | CIC Dependency | Purpose |
|--------------|----------------|---------|
| Vault Mirror | CIC State | Sync state |
| Setup Scripts | CIC Ingestion | Data flow |
| Configuration | CIC Governance | Rules application |

## Running Both Systems

See [Operations Guide](../operations/running.md) for:
- Local dev setup (both CIC + RL)
- Docker Compose config (unified)
- Health checks (both systems)
- Troubleshooting (cross-system issues)

## Unified Testing

- [Routing Tests](../tests/routing-tests.md) — tests both CIC + RL fallbacks
- [Feedback Loop Tests](../tests/feedback-loop-tests.md) — end-to-end governance
- [Dashboard Tests](../tests/dashboard-tests.md) — unified observability
