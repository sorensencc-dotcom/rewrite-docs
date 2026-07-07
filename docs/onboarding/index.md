---
name: onboarding-index
description: CIC Knowledge Base Onboarding guide — getting started with the system
metadata:
  type: onboarding
---

# CIC Onboarding Guide

Welcome to CIC (Governance and Compliance Infrastructure). This guide introduces the core concepts and helps you get started quickly.

## What is CIC?

CIC is a comprehensive governance, routing, and federation architecture built on:
- **Deterministic Pipeline:** Phases 1–27+ with strict sequencing and verification gates
- **Multi-Layered Architecture:** Access, Federation, Snapshot, and Seal layers
- **Autonomous Services:** Memory, Governance, and Observability systems
- **Knowledge-First Design:** Integrated knowledge graph and drift detection

## Quick Navigation

- **[Getting Started](../quickstart/index.md)** — Installation and first steps
- **[Architecture Overview](../architecture/overview.md)** — System design and components
- **[CIC Core Docs](../cic/index.md)** — Phases, governance, contracts
- **[Deployment](../reference/docker.md)** — Docker, Kubernetes, CI/CD
- **[Developer Handbook](../reference/handbook.md)** — Coding standards, workflows

## Core Concepts

### Phases (1–27+)
CIC execution flows through numbered phases, each with:
- Specification (contracts, schemas, validation)
- Implementation (code, tests, verification)
- Canary gates (monitoring, rollback policies)
- Production deployment

**Key phases:**
- **Phases 1–4:** MAAL + SPL/RL foundation + integration + canary gates
- **Phases 5–7:** TorqueQuery, cost system, hardening
- **Phases 8–20:** Core features, scaling, optimization
- **Phases 23–27:** Autonomy stack (memory, governance, observability, TorqueQuery)
- **Phases 28+:** Evolution, advanced features

### Governance Layer
Enforces policies, approval gates, and compliance across all operations:
- Data handling and retention
- Audit logging (immutable trail)
- Sensitive data protection
- Compliance requirements

### Knowledge Graph
Extracts, indexes, and manages knowledge from code, docs, and runtime behavior:
- Relationship extraction
- Cross-service dependency mapping
- Automated documentation generation

### Observability
Unified metrics, logging, and dashboards:
- Real-time monitoring
- Cost tracking and attribution
- Drift detection and forecasting

## Documentation Structure

| Section | Contents |
|---------|----------|
| **CIC Core** | Phases, governance, architecture, contracts |
| **Deployment** | Docker, Kubernetes, registry, CI/CD |
| **Rewrite Labs** | Skill framework, generation patterns, testing |
| **Reference** | API, schemas, CLI, toolforge, handbook |
| **Operations** | Monitoring, cost tracking, troubleshooting |
| **Roadmaps** | Phase specs, tickets, risk registers |

## Getting Help

- Check the [Architecture Overview](../architecture/overview.md) for system design
- Browse [Reference Docs](../reference/schemas.md) for APIs and schemas
- Review [Troubleshooting Guide](../operations/troubleshooting.md) for common issues
- Consult the [Developer Handbook](../reference/handbook.md) for coding standards

---

**Next step:** Read the [Getting Started guide](../quickstart/index.md).
