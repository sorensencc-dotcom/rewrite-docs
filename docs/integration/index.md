# CIC + Rewrite Labs Integration

Cross-system dependencies, data flow, and unified patterns.

## Integration Layers

### 1️⃣ Governance Integration

Both CIC and RL are governed by the same framework:

- **Memory System**: Unified across both (MAAL ledger)
- **State Store**: Shared artifact vault
- **Drift Detection**: Common classification schema
- **Validation Gates**: Shared canary + rollback

**Files**:
- [CIC Governance](../cic/GOVERNANCE.md)
- [Governance Validation Setup](../meta/GOVERNANCE_VALIDATION_SETUP.md)

### 2️⃣ Ingestion Pipeline

Data flows: Crawl → Extract → Map → Index

- **Source**: RL Vault (GitHub, docs, manifests)
- **Extraction**: CodeFlow Harvester (CIC)
- **Mapping**: IR Packets (unified schema)
- **Indexing**: Knowledge Graph (shared)

**Files**:
- [Ingestion Architecture](../architecture/ingestion.md)
- [RL Vault Setup](../rewrite-labs/VAULT-README.md)
- [CodeFlow Harvester](../cic/harvester.md)

### 3️⃣ Routing Integration

Model selection rules apply across both systems:

- **Primary Chain**: CIC routing (local-first)
- **Fallback Chain**: RL provider fallbacks
- **Federation**: Multi-vendor selection
- **Cost Governance**: Shared token economy

**Files**:
- [Routing Architecture](../architecture/routing.md)
- [Provider Configuration](../gateway/providers.md)

### 4️⃣ Knowledge Graph

Unified semantic model:

- **CIC Nodes**: Phases, components, decisions
- **RL Nodes**: Vault items, artifacts, patterns
- **Shared Edges**: Depends-on, implements, mirrors

**Files**:
- [Knowledge Graph Setup](../reference/knowledge-graph/QUICK_START.md)
- [Knowledge Graph README](../reference/knowledge-graph/README.md)

### 5️⃣ Operations & Monitoring

Both systems share the same ops stack:

- **Prometheus**: Metrics from both
- **Sandbox-3**: Determinism testing
- **Dashboards**: Unified observability
- **Canary Gates**: Shared validation

**Files**:
- [Operations Guide](../operations/running.md)
- [Sandbox-3 Overview](../cic/SANDBOX-3_OVERVIEW.md)
- [Monitoring](../operations/monitoring.md)

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
