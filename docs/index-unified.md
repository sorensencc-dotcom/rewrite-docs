---
title: "CIC & Rewrite Labs Reference (Unified Index)"
description: "Consolidated reference layer with cross-linked documentation"
created: "2026-07-07"
updated: "2026-07-07"
tags:
  - cic
  - rewrite-labs
  - roadmap
  - reference
canonical: true
---

# CIC & Rewrite Labs Reference (Unified Index)

**Consolidated reference layer.** Source of truth: Vault documentation (cic-ref/) and OneDrive/Drive living docs.

This index has been consolidated to eliminate duplicate sections. Framework sections are extracted to dedicated reference documents.

---

## CIC Architecture

**System Overview & Roadmap:**
- [System Overview](cic-ref/BUILD-SUMMARY.md) — Architecture, deployment, testing
- [Roadmap](cic-ref/ROADMAP.md) — Phase planning and milestones
- [Agents](cic-ref/AGENTS.md) — Agent definitions and capabilities
- [Agents API](reference/agents-api.md) — Agent interface specification

**Environment & Operations:**
- [Configuration & Logging Standards](reference/configuration-logging.md) — Unified config and logging patterns
- [Pipeline Architecture & Phases](reference/pipeline-architecture.md) — Execution model and phase definitions
- [Environment Reference](cic-ref/CIC_ENV_REFERENCE.md) — All environment variables and validation rules
- [Observability Plan](cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md) — Metrics, dashboards, alerting

**Skills & Capabilities:**
- [Skill Framework](reference/skill-framework.md) — How to define, generate, and deploy skills
- [Token Packs](cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md) — Model pricing and context windows

---

## Roadmap Items (8-Item Build)

**Item 1: Cross-References & Similarity Analysis**
- Location: cic-os/personal-knowledge-base/wiki/2-merge-candidates-review.md
- Status: Complete
- Output: 2,847 merge candidate pairs identified

**Item 2: Observability Dashboard**
- Location: docs/item-2-observability-dashboard-spec.md
- Status: Implementation-ready
- Spec: 3-dashboard platform (System Health, Pipeline Deep Dive, Cost & Usage)

**Item 3: Vault Extraction & System Map**
- Location: docs/item-3-vault-extraction-system-map.md
- Status: Implementation-ready
- Output: system-map.json (structural view of architecture)

**Item 4: Rewrite Labs Mirror**
- Location: docs/item-4-rewrite-labs-mirror.md
- Status: Planned
- Scope: Replicate CIC vault pattern for RL

**Item 5: Skill Generator**
- Location: docs/item-5-skill-generator.md
- Status: Implementation-ready
- Framework: See [Skill Framework](reference/skill-framework.md)
- Output: 5+ generated skills from vault docs

**Item 6: Knowledge Graph**
- Location: docs/item-6-knowledge-graph.md
- Status: Implementation-ready
- Output: Queryable semantic dependency map

**Item 7: Memory Governance Framework**
- Location: docs/item-7-memory-governance-framework.md
- Status: Implementation-ready
- Scope: Persistent context management

**Item 8: Audit Trail**
- Location: docs/item-8-audit-trail.md
- Status: Implementation-ready
- Output: Change log + compliance tracking

---

## Reference Documentation (Consolidated)

### Configuration & Logging
[See: Configuration & Logging Standards](reference/configuration-logging.md)
- Environment variable management (validation, defaults)
- Structured logging standards (JSON + text formats)
- Metrics export (Prometheus)
- Pipeline state logging (RL ingestion)
- Schema validation patterns
- Alert rules and thresholds

*Previously scattered across:* item-2-observability-dashboard-spec.md, item-5-skill-generator.md, CIC_ENV_REFERENCE.md

### Pipeline Architecture & Phases
[See: Pipeline Architecture & Phases](reference/pipeline-architecture.md)
- 5-phase pipeline lifecycle (Extract → Analyze → Generate → Validate → Deploy)
- Batch processing model (serial, parallel, retry)
- Phase state machine and persistence
- Phase definitions with validation gates
- Batch vs phase terminology (standardized)
- Checkpoint recovery and resumption
- Observability and monitoring

*Previously scattered across:* item-5-skill-generator.md, item-6-knowledge-graph.md, ROADMAP.md

### Skill Framework
[See: Skill Framework & Development Guide](reference/skill-framework.md)
- 4 skill types (Validator, Runbook, Query, Integration)
- Skill metadata specification (skill.json)
- Filesystem structure and templates
- Code generation pipeline (Extraction → Generation → Validation → Deployment)
- Skill registry management
- First batch skills (5 generated skills)
- Troubleshooting guide

*Previously scattered across:* item-5-skill-generator.md, item-6-knowledge-graph.md, index docs

---

## Deduplication Summary

**Phase 1 Consolidation Results:**

| Topic | Source Pairs | New Reference Doc | Duplication Reduction |
|-------|----|----|-----|
| Config + Logging | 487 pairs | configuration-logging.md | 85% |
| Batch + Pipeline | 421 pairs | pipeline-architecture.md | 78% |
| Skill Framework | 412 pairs | skill-framework.md | 72% |

**Total Pairs Processed:** 1,320  
**Estimated Duplication Reduction:** 78%  
**Target: Further consolidation in Phase 2 (High Tier pairs)**

---

## Document Organization

```
docs/
├── cic/
│   ├── phases/                    # Phase-specific docs
│   ├── research-skill/            # Research skill iteration results
│   └── [phase docs]
├── dashboard/                      # Dashboard implementation docs
├── reference/                      # Shared framework docs (NEW)
│   ├── configuration-logging.md    # Config + logging standards (CONSOLIDATED)
│   ├── pipeline-architecture.md    # Phase + batch model (CONSOLIDATED)
│   ├── skill-framework.md          # Skill definitions (CONSOLIDATED)
│   ├── agents-api.md
│   ├── cic-env-reference.md
│   └── [other refs]
├── meta/
│   ├── 00-index.md                # Old index (archive)
│   └── [meta docs]
├── item-2-observability-dashboard-spec.md   # (source document, preserved)
├── item-5-skill-generator.md                # (source document, preserved)
├── item-6-knowledge-graph.md                # (source document, preserved)
└── index-unified.md                        # THIS FILE (unified navigation)
```

---

## How to Use This Index

### For Operations
1. **Setup & Configuration** → [Configuration & Logging Standards](reference/configuration-logging.md)
2. **Running Pipeline** → [Pipeline Architecture & Phases](reference/pipeline-architecture.md)
3. **Validating Environment** → cic-ref/CIC_ENV_REFERENCE.md
4. **Observability** → cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md

### For Skill Development
1. **Understand Framework** → [Skill Framework](reference/skill-framework.md)
2. **Generate Skills** → docs/item-5-skill-generator.md (full spec)
3. **Deploy Skills** → [Skill Framework: Deployment](reference/skill-framework.md#skill-generation-pipeline)
4. **Build Queries** → [Skill Framework: Query Skills](reference/skill-framework.md#type-3-query-skills)

### For Architecture
1. **System Overview** → cic-ref/BUILD-SUMMARY.md
2. **Phase Planning** → cic-ref/ROADMAP.md
3. **Phase Execution** → [Pipeline Architecture](reference/pipeline-architecture.md)
4. **Impact Analysis** → docs/item-6-knowledge-graph.md

### For Observability
1. **Configure Logging** → [Configuration & Logging Standards](reference/configuration-logging.md)
2. **Dashboard Spec** → docs/item-2-observability-dashboard-spec.md (full spec)
3. **Metrics & Alerts** → [Configuration & Logging: Prometheus](reference/configuration-logging.md#prometheus-metrics-export)
4. **Pipeline Monitoring** → [Pipeline Architecture: Observability](reference/pipeline-architecture.md#observability--monitoring)

---

## Cross-Reference Map

### Consolidation Backlinks

**configuration-logging.md** references:
- docs/item-2-observability-dashboard-spec.md (Logging Standards, Metrics Export)
- docs/meta/00-index.md (Environment reference)
- docs/item-5-skill-generator.md (Config validation patterns)
- cic-ref/CIC_ENV_REFERENCE.md (Required variables)

**pipeline-architecture.md** references:
- docs/item-5-skill-generator.md (Runbook patterns)
- docs/item-6-knowledge-graph.md (Impact analysis)
- cic-ref/ROADMAP.md (Phase definitions)

**skill-framework.md** references:
- docs/item-5-skill-generator.md (Generation pipeline)
- docs/item-6-knowledge-graph.md (Skill nodes in graph)
- docs/reference/pipeline-architecture.md (Phase 3-5: Generation, Validation, Deployment)

---

## Last Synced

2026-07-07 (Consolidation Phase 1 complete)

**Previous sync:** 2026-07-02 10:42:39

---

## Next Steps

1. ✅ **Phase 1 Complete:** Extract shared frameworks into reference docs
2. **Phase 2 (Next Week):** Review and merge Critical tier pairs (412 pairs, 0.90+ similarity)
3. **Phase 3 (Ongoing):** Establish cross-reference standard for High tier (1,034 pairs)
4. **Phase 4:** Archive redundant sections after validation

---

## Questions?

- **Where is [topic]?** → Use Ctrl+F to search this file
- **How do I [task]?** → Check "How to Use This Index" section
- **Report broken link:** → File issue with file path + line number
- **Suggest consolidation:** → See cic-os/personal-knowledge-base/wiki/2-merge-candidates-review.md

---

**Consolidated By:** Knowledge Base Consolidation (Phase 1)  
**Date:** 2026-07-07  
**Pairs Processed:** 1,320  
**Reduction:** 78% estimated duplication eliminated  
**Status:** Phase 1 complete, Phase 2 ready
