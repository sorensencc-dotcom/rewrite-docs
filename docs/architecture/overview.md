> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Platform Engineering · **Review Cycle:** Quarterly

# Architecture Overview

The Rewrite Labs platform is built on the **Cognitive Intelligence Core (CIC)** — a stateful
orchestration engine that manages AI-augmented workflows end-to-end, from request ingestion through
reasoning, tool dispatch, skill execution, and response delivery, while enforcing safety policies and
maintaining a complete audit trail.

---

## System Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                        │
│  CIC UI · CLI · Agent API (port 3118) · MCP Server (port 3100)      │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│  ROUTING LAYER                                                       │
│  Local-First Router · Drift-Aware Scoring · SLA Failover            │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│  CIC RUNTIME                                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐          │
│  │  Session     │  │  Orchestrator │  │  Tool Dispatcher │          │
│  │  Manager     │◄─►  (Reasoning)  │◄─►  (Execution)     │          │
│  └──────────────┘  └───────────────┘  └──────────────────┘          │
│        │                  │                     │                    │
│  ┌─────▼──────┐   ┌───────▼──────┐   ┌──────────▼──────┐           │
│  │  Memory    │   │  Skill       │   │  Safety          │           │
│  │  Manager   │   │  Registry    │   │  Evaluator       │           │
│  └────────────┘   └──────────────┘   └─────────────────┘           │
│        │                                        │                    │
│  ┌─────▼────────────────────────────────────────▼──────┐            │
│  │                    Audit Logger                      │            │
│  └──────────────────────────────────────────────────────┘           │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│  INGESTION LAYER                                                     │
│  CodeFlow Harvester · IR Packet Mapper · Knowledge Graph Indexer     │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│  DETERMINISTIC LAYER                                                 │
│  MAAL Sandbox · Seal Verification · Drift Detection                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

| Component | Purpose | Key File |
|---|---|---|
| Session Manager | Lifecycle (init → hibernate → terminate), state hydration | `CIC_SYSTEM.md §2.1` |
| Orchestrator | Reasoning loop, skill selection, plan execution | `CIC_SYSTEM.md §2.2` |
| Tool Dispatcher | Route calls to platform/connector/skill/browser backends | `CIC_SYSTEM.md §2.3` |
| Memory Manager | Three-tier memory: working, durable, KB reference | `CIC_STATE.md` |
| Skill Registry | Toolforge catalog; validates status before loading | `CIC_SYSTEM.md §2.5` |
| Safety Evaluator | Confirmation gates, content policy, PII scan, injection detection | `CIC_SYSTEM.md §2.6` |
| Audit Logger | Immutable per-session event log, 90-day retention | `CIC_SYSTEM.md §2.7` |
| Local-First Router | Drift-aware backend selection, SLA failover | `architecture/routing.md` |
| Drift Engine | Provider scoring, penalty/decay, playbook toggles | `architecture/drift.md` |
| MAAL Sandbox | Deterministic seal layers, SHA-256 hash verification | `architecture/deterministic-stack.md` |

---

## Design Principles

1. **Determinism first** — Same input always produces the same output. Achieved through the sealed
   MAAL layer, content-addressed hashing, and reproducible execution.

2. **Local-first** — All processing defaults to on-device or local network. Cloud backends are
   opt-in and always lower priority than local providers.

3. **Safety by construction** — The Safety Evaluator intercepts every tool call and outbound
   response. There is no bypass path.

4. **Audit completeness** — Every state mutation, tool call, and safety decision is logged. Logs are
   immutable.

5. **Isolation at every boundary** — Sessions cannot share state. Connectors hold credentials
   outside the orchestrator. External content is never treated as instructions.

---

## Deployment Topology

```
┌──────────┐    ┌─────────────────────────────────────────┐
│  Client  │───►│  MCP Server :3100                        │
└──────────┘    │  CIC Ingestion :3000                     │
                │  Agents API :3118                        │
                │  CIC UI :5173                            │
                └──────────┬──────────────────────────────┘
                           │  docker-compose.yml
                ┌──────────▼──────────────────────────────┐
                │  PostgreSQL (state) · Prometheus :9090   │
                │  Grafana :3001 · Alertmanager :9093      │
                └─────────────────────────────────────────┘
```

All services are managed via `docker-compose.yml` at the repo root.
Dev startup: `docker-compose up -d` — see [Running Services](../operations/running.md).

---

## Architecture Sub-Pages

| Page | Content |
|---|---|
| [CIC System](CIC_SYSTEM.md) | Full component reference, connector architecture, config |
| [CIC State](CIC_STATE.md) | State schema, lifecycle, integrity rules, observability |
| [Data Flow](data-flow.md) | End-to-end request/response path with error paths |
| [Routing Engine](routing.md) | Local-first constraints, drift-aware routing, SLA failover |
| [Drift Detection](drift.md) | Four drift systems, penalty algorithm, decay cycle |
| [Deterministic Stack](deterministic-stack.md) | MAAL seal layers, SHA-256 verification, reproducibility |
| [Design Principles](design.md) | Extended design rationale and pattern library |
| [Ingestion Pipeline](ingestion.md) | CodeFlow harvester, IR packets, knowledge graph indexing |
| [Security Model](security.md) | Isolation boundaries, credential handling, safety policies |
