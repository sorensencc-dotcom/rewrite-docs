# Unified CIC + Rewrite Labs Systems

Complete documentation for all subsystems across CIC and Rewrite Labs.

## System Categories

### 🔹 MAAL & Governance
Core autonomous agent learning framework with deterministic governance.

- [MAAL Architecture](../cic/PHASE-1_OVERVIEW.md)
- [Governance Framework](../cic/GOVERNANCE.md)
- [Memory & State](../cic/PHASE_1_LEDGER_SUBSTRATE.md)

### 🔹 Routing & Federation
Model routing, fallback chains, and multi-vendor federation.

- [Local-First Routing](../architecture/routing.md)
- [Federation Layer](../api/federation-layer.md)
- [Provider Configuration](../gateway/providers.md)

### 🔹 Ingestion & Extraction
Data pipeline from crawl → scrape → map → index.

- [Ingestion Architecture](../architecture/ingestion.md)
- [Vault Extraction (RL)](../rewrite-labs/00-RL-INDEX.md)
- [CodeFlow Harvester](../cic/harvester.md)

### 🔹 Knowledge Systems
Knowledge graphs, memory governance, and semantic drift.

- [Knowledge Graph Setup](../reference/knowledge-graph/QUICK_START.md)
- [Drift Classification](../architecture/drift.md)
- [Memory Governance](../cic/MEMORY_V1_STAGING_ACTIVATION.md)

### 🔹 Observability & Operations
Monitoring, tracing, determinism verification, sandbox.

- [Observability Plan](../cic/CIC_RUNTIME_OBSERVABILITY_PLAN.md)
- [Sandbox-3 Reference](../cic/SANDBOX-3_OVERVIEW.md)
- [Operations Guide](../operations/running.md)

## Phase Roadmaps

- [Phase 1–4: Foundation](../cic/PHASE-1_OVERVIEW.md)
- [Phase 5: TorqueQuery](../cic/TORQUEQUERY_EXECUTIVE_SUMMARY.md)
- [Phase A–C: Hardening](../cic/PHASE_A_OPTIMIZATION_SUMMARY.md)
- [Phase 26: Implementation](../implementation/phase-26/summary.md)

## Integration Points

| System | CIC | RL | Shared |
|--------|-----|----|----|
| Governance | ✓ | ✓ | Memory, State |
| Routing | ✓ | — | Provider mgmt |
| Ingestion | CodeFlow | Vault | Pipeline |
| Knowledge | Graph | Mirror | Extraction |
| Operations | Sandbox-3 | Infra | Monitoring |

## Quick Links

- [CIC Index](../cic/index.md) — all CIC phases & components
- [RL Index](../rewrite-labs/00-RL-INDEX.md) — Rewrite Labs vault system
- [Architecture Overview](../architecture/overview.md)
- [Full API Reference](../api/overview.md)
