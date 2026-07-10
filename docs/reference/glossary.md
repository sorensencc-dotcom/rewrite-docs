> **Status:** STABLE · **Version:** 1.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Knowledge Engineering · **Review Cycle:** Quarterly

# Glossary

Platform terminology, acronyms, and domain-specific concepts for the CIC and Rewrite Labs systems.

---

## A

**Agents API**
REST API (port 3118) for agent lifecycle management — list, pause, restart, invoke, snapshot.
See [Agents API Reference](agents-api.md).

**Ashfall State**
CIC system-state document tracking phase readiness, execution posture, and system invariants.
Lives at `docs/cic/CIC_ASHFALL_STATE.md`. Updated after each phase transition.

**Audit Logger**
Immutable event log attached to every CIC session. Records every tool call, safety decision, and
state mutation with a timestamp, session ID, and outcome. Retained 90 days.

---

## C

**Canary Gate**
Automated quality checkpoint inserted between deployment phases. A gate must pass before the
next phase is promoted. Configured in `canary-gates-config.json`.

**CIC** (Cognitive Intelligence Core)
The stateful orchestration engine that powers all AI-augmented workflows in the Rewrite Labs
platform. Manages agent sessions end-to-end: reasoning, tool dispatch, skill loading, safety,
and audit. See [Architecture Overview](../architecture/overview.md).

**CIC State**
Three-tier state model: session (ephemeral), durable (cross-session), platform (read-only).
Schema defined in [CIC_STATE](../architecture/CIC_STATE.md).

**CodeFlow Harvester**
Crawl-extract-map pipeline that ingests source vault documents, normalizes them to IR Packets,
and feeds the Knowledge Graph Indexer.

**Confirmation Gate**
A safety pause inserted before consequential tool calls. The user must explicitly approve before
execution resumes. Gates expire after 15 minutes if no response.

---

## D

**Determinism**
The property that the same input always produces the same output. Enforced via the MAAL sealed
layer, SHA-256 content-addressed hashing, and reproducible execution. See [Deterministic Stack](../architecture/deterministic-stack.md).

**Drift**
Measured divergence between a document/provider and its target specification or baseline.
Three types: semantic (vector distance), structural (tree edit), reference (broken links).
See [Drift Detection](../architecture/drift.md).

**Drift Score**
A numeric value (0.0–1.0) assigned to each backend provider. Increases with SLA breaches;
decays 5% every 30 seconds. Providers over 0.5 are de-prioritized; over 0.8, routing is frozen.

**Durable Facts**
User-disclosed facts stored in CIC durable state and persisted across sessions. Written only via
`memory_durable_fact_tasks`. Never populated from emails, documents, or external content.

---

## F

**Forge Field**
The execution constraint boundary of the MAAL Sandbox. All agent operations execute inside the
forge field; nothing from outside can modify execution semantics without crossing a confirmed gate.

**FallbackChain**
Priority-ordered list of backend providers used when the primary provider fails. Each provider
has circuit states: CLOSED (healthy), OPEN (failed), HALF_OPEN (testing recovery).

---

## I

**IR Packet** (Intermediate Representation Packet)
The unified data structure used by the ingestion pipeline. Schema:
`{ source, type, id, name, metadata, content, dependencies, tags }`.
Used for both CIC phase artifacts and RL vault artifacts.

---

## K

**Knowledge Graph**
The queryable graph of concepts, phases, agents, and relationships extracted from vault docs.
280+ nodes, 600+ edges. Built by `extract-backlinks.ts`; queried via `knowledge-graph-query.ts`.
See [Knowledge Graph Reference](knowledge-graph/readme.md).

---

## L

**Local-First**
Routing policy that restricts all processing to on-device or local network providers (ollama,
llamafile, mock). Cloud backends are bypassed when `localFirst: true`. See [Routing Engine](../architecture/routing.md).

---

## M

**MAAL** (Multi-Agent Autonomous Ledger)
The governance substrate of the CIC platform. Provides deterministic execution, sealed layers,
audit trails, and immutable state ledger.

**MAAL Sandbox**
The isolated execution environment for deterministic, reproducible agent operations. Enforces
the forge field boundary and produces a cryptographic seal for each layer.

---

## O

**Orchestrator**
The reasoning engine inside the CIC runtime. Stateless per iteration. Receives user messages,
loads skills, produces structured plans, dispatches tool calls, synthesizes results.

---

## P

**Phase**
A discrete execution unit in the CIC or Rewrite Labs roadmap. Phases group deliverables,
configure canary gates, and produce seal reports. Current: Phase 27 (Wave F).

**Playbook**
An automated recovery procedure triggered by a system condition (e.g., drift spike, backend
failure). Active playbooks are tracked in `governance/cicState.json`.

---

## R

**Reference Drift**
A category of drift measuring broken file links, missing API nodes, and unresolved graph edges.
The KB sync report uses this to identify documentation broken links.

**Routing Stability Playbook**
A failover procedure that freezes routing to a known-stable backend when performance fluctuates,
preventing oscillation between degraded providers.

---

## S

**Safety Evaluator**
The CIC component that intercepts all tool calls and outbound responses. Enforces confirmation
gates, content policy, PII handling, injection detection, and memory safety.

**Sealing**
The process of generating a cryptographic hash (SHA-256) for each MAAL layer and combining them
into a system-wide seal report. Sealing locks ingestion state; sealed records cannot be modified
by the Autonomy API. See [Sealing & Verification](../operations/sealing.md).

**Skill**
A packaged capability loaded by the CIC Orchestrator at runtime. Govened by the Toolforge
catalog (Skills Registry). Skills have statuses: ACTIVE, DEPRECATED, REMOVED.

**Skill Registry**
Runtime interface to the Toolforge catalog. Validates skill status before loading; returns
structured migration errors for deprecated or removed skills.

---

## T

**TorqueQuery**
CIC Phase 26 deliverable — the query engine for the MAAL ledger. Enables structured queries
against the knowledge graph and state store.

**Toolforge**
The platform layer that governs skill authoring, versioning, testing, and registry management.
See [Skills & Toolforge](../skills/toolforge-skills-governance.md).

---

## W

**Wave**
A grouped cluster of CIC phases representing a major platform capability milestone.
Wave F = Phases 25–27: governance, ingestion autonomy, sealing, TorqueQuery.

**Working Memory**
Ephemeral key-value scratch space within a single CIC session. Destroyed on session termination.
Not persisted to durable state. Entries capped at 50 KB each.
