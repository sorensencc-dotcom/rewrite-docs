> **Status:** STABLE · **Version:** 3.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Platform Engineering · **Review Cycle:** On release

# Changelog

Public-facing change history for the CIC and Rewrite Labs platform. Records major subsystem
additions, documentation additions, phase completions, and breaking changes.

---

## v3.0.0 — 2026-07-09 (Current)

### Architecture Documentation Complete

- **Added:** `architecture/overview.md` — unified system layer diagram, component table, design
  principles, deployment topology
- **Added:** `architecture/data-flow.md` — all four major data flows (request lifecycle, ingestion,
  routing, sealing) with error paths and audit emission points
- **Added:** `architecture/routing.md` — local-first constraints, drift-aware scoring, SLA failover
  playbooks, five router module reference
- **Added:** `architecture/drift.md` — four-system disambiguation, penalty algorithm, decay cycle,
  evaluation flow diagram
- **Added:** `architecture/deterministic-stack.md` — MAAL seal layer strategy, SHA-256 verification
  workflow, reproducibility guarantees
- **Expanded:** `reference/glossary.md` — A–W terminology (30+ terms) seeded from component docs
- **Expanded:** `reference/api.md` — unified API surface: Agents API, MCP server, routing contract,
  drift API, seal/verify CLI, audit log schema, environment variables

### Navigation

- **Added:** `Roadmaps` nav section to `mkdocs.yml` (unified, CIC, Rewrite Labs, risk register,
  execution blueprint)
- **Added:** `CIC` nav section to `mkdocs.yml` (phase 27 docs, governance, six rules, Ashfall State)
- **Expanded:** `Architecture` nav (routing, drift, deterministic-stack, design, ingestion)
- **Expanded:** `Operations` nav (monitoring, running, sealing, weekly-sync, cost, drift forecast,
  troubleshooting, verification)
- **Expanded:** `Reference` nav (agents-api, CLI, CIC–RL cross-reference, integration guide,
  handbook, knowledge graph)

### CIC Phase 27 — Wave F

- **Complete:** Ingestion autonomy locked (`cic/phase-27-ingestion-autonomy-locked.md`)
- **Complete:** Wave F architecture, runbook, rollback, troubleshooting docs
- **Complete:** TorqueQuery delivery (index, MCP reference, quickstart, executive summary)
- **Complete:** Sandbox-3 phases 1–7

---

## v2.0.0 — 2026-07-03

### CIC System Rewrite

- **Rewrote:** `architecture/CIC_SYSTEM.md` v2.0.0 — added Safety Evaluator, Audit Logger,
  Connector Architecture sections
- **Rewrote:** `architecture/CIC_STATE.md` v2.0.0 — three-layer state architecture, consent
  records, integrity rules, observability surfaces
- **Added:** Knowledge Graph system (`reference/knowledge-graph/`) — extractor, query interface,
  D3.js viewer, 280+ nodes / 600+ edges
- **Added:** CIC–RL Cross-Reference Map (`reference/cic-rl-cross-reference.md`)
- **Added:** Six Rules Framework (`cic/six-rules-framework.md`)
- **Added:** Operations stubs — monitoring, running, sealing, weekly-sync

### Roadmaps

- **Added:** `roadmaps/unified-roadmap.md` — cross-project milestone timeline
- **Added:** `roadmaps/cic-roadmap.md` — Wave A–F phase summary
- **Added:** `roadmaps/rewrite-labs-roadmap.md` — Discovery → Deploy milestones
- **Added:** `roadmaps/risk-register-phases-23-27.md` — risk tracking
- **Added:** `roadmaps/execution-blueprint-phases-23-27.md` — phase execution plan

### Ingestion Pipeline

- **Added:** `cic-ingestion/` — full ingestion daemon with drift engine, governance audit trail,
  IR packet mapper, corpus-hash drift detection
- **Added:** `architecture/ingestion.md`
- **Added:** CIC Phase 26 — TorqueQuery adapter, NotebookLM integration spec

---

## v1.4.0 — 2026-04-10

### CIC State

- **Added:** Scheduled task state schema to `CIC_STATE.md`
- **Added:** Drift forecast model (`operations/drift-forecast.md`)
- **Added:** Cost tracking guide (`operations/cost-tracking.md`)

### Observability

- **Added:** Prometheus integration (`cic/prometheus-integration-status.md`)
- **Added:** CIC runtime observability plan (`cic/cic-runtime-observability-plan.md`)
- **Added:** Grafana dashboards and alert rules (`alert-rules.yml`, `slo-rules.yml`)

---

## v1.3.0 — 2026-01-05

### Architecture

- **Added:** Request lifecycle diagram to `CIC_SYSTEM.md`
- **Added:** `architecture/routing.md` v1 — initial routing engine documentation
- **Added:** Canary gates system (`cic/canary-gates.md`, `canary-gates-config.json`)

### Operations

- **Added:** Phase 26 loop runbook (`cic/phase-26-loop-runbook.md`)
- **Added:** Environment optimization guide (`operations/environment-optimization.md`)
- **Added:** Logging policy (`operations/logging-policy.md`)

---

## v1.2.0 — 2025-10-05

### CIC State

- **Added:** Confirmation gate state machine to `CIC_STATE.md`
- **Added:** MAAL core governance (`cic/governance.md`)
- **Added:** Batch map 1–40 status (`cic/batch-map-1-40-status.md`)

---

## v1.1.0 — 2025-10-05

### CIC State

- **Added:** Session lifecycle state machine to `CIC_STATE.md`
- **Added:** Phase 8 implementation summary

---

## v1.0.0 — 2025-08-01

### Initial Release

- **Added:** `architecture/CIC_SYSTEM.md` v1.0.0
- **Added:** `architecture/CIC_STATE.md` v1.0.0
- **Added:** `cic/index.md` — CIC operational surface
- **Added:** `docs/index.md` and `docs/index-unified.md`
- **Added:** `mkdocs.yml` — initial site configuration with Material theme

---

## Breaking Changes Index

| Version | Change | Impact |
|---|---|---|
| v2.0.0 | `ops/monitoring.md` → `operations/monitoring.md` | Nav link changed |
| v2.0.0 | Safety Evaluator added to all tool call paths | All tool calls now pass safety check |
| v1.3.0 | Canary gates added between phases | Phase promotions require gate passage |

---

## Deprecation Notices

| Item | Deprecated In | Removal Target | Replacement |
|---|---|---|---|
| `ops/monitoring.md` | v3.0.0 | v3.1.0 | `operations/monitoring.md` |
| SAFETY_EVAL_MODE: monitoring | v2.0.0 | N/A | Do not use in production |
