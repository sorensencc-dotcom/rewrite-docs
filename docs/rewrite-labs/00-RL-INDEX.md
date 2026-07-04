---
title: "00 RL INDEX"
summary: "# CIC & Rewrite Labs Integrated Reference Vault"
created: "2026-07-03T19:43:46.103Z"
updated: "2026-07-03T19:43:46.103Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC & Rewrite Labs Integrated Reference Vault

**Dual-system read-only reference layer.** Source of truth: OneDrive/Drive living docs for both CIC and RL.

---

## CIC Reference Architecture

### Core Systems
- [[cic-ref/BUILD-SUMMARY|CIC System Overview]] — 5-layer architecture: Source → Analyzer → CIC → Dashboard
- [[cic-ref/ROADMAP|CIC Roadmap]]

### Components
- [[cic-ref/AGENTS|CIC Agents]] — Agent framework and implementations
- [[cic-ref/AGENTS_API|Agents API]] — Agent communication protocols
- [[cic-ref/CIC_ENV_REFERENCE|Environment Configuration]]

### Operations
- [[cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN|Observability Plan]] — Metrics, dashboards, monitoring
- [[cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST|Token Packs]] — Token pack specifications and catalogs

---

## Rewrite Labs Reference Architecture

### Status: ✅ Synced (first sync 2026-07-04)

RL reference vault is populated from the confirmed source. (Status legend: ✅ Done · 🔄 In Progress · 📋 Planned · 💡 Potential · ⛔ Deprecated)

**Source Location:** ✅ GitHub — `sorensencc-dotcom/rewrite-mcp` (branch `main`; local clone `c:\dev\rewrite-mcp`)  
**Local Destination:** `C:\dev\rl-ref\` (14 docs, 5 sections)  
**Sync Status:** ✅ First sync complete; manifest-driven (`rl-vault-manifest.json` + `scripts/rl-vault-sync.js`); canonical index at `C:\dev\rl-ref\index.md`  

> RL-4.x phase status (build vs runner) is tracked in the [Rewrite Labs Roadmap](../roadmaps/rewrite-labs-roadmap.md).

### Synced Sections (see `rl-ref/index.md` for the full generated list)
- **Roadmaps** — `rl-ref/docs/rewrite-labs/REWRITE_LABS_ROADMAP.md`, `rl-ref/docs/roadmaps/master-roadmap.md`
- **RL System Overview** — `rl-ref/docs/internal/rewrite_labs_overview.md` (pipeline: Discovery → Harvester → Redesign → Outreach → Delivery)
- **Architecture** — `rl-ref/docs/architecture/` (overview, drift, ingestion, routing, analyzer integration)
- **CIC Integration** — `rl-ref/docs/cic/rewrite_labs_cic_fusion_layer.md`, repomix-harvester integration
- **UI Pipeline** — `rl-ref/docs/rewrite/` (blueprint + release checklist)

📋 Still unsynced (no source docs exist yet): RL Agents deep-dive, RL Observability, RL Environment — add to the manifest when written in rewrite-mcp.

**Setup Guide:** See [[RL-VAULT-SETUP|RL Vault Setup Documentation]]

---

## Architectural Patterns & Design

### CIC Design Patterns
Location: `architecture/cic-patterns/`
- Extraction pipeline patterns
- Token optimization strategies
- Observability design
- Agent orchestration

### Rewrite Labs Design Patterns
Location: `architecture/rl-patterns/`
- Generation pipeline patterns
- Content synthesis strategies
- Quality assurance frameworks
- Workflow automation

### Cross-System Analysis
- Extraction vs. Generation Approaches
- Token Management Comparison
- Runtime Observability Strategies
- Agent Architecture Differences

---

## Quick Reference: Key Comparisons

### Extraction vs. Generation
| Aspect | CIC | Rewrite Labs |
|--------|-----|--------------|
| Primary Function | Extract & catalog information | Generate & synthesize content |
| Core Pipeline | `cic-ref/BUILD-SUMMARY` | `rl-ref/[RL Architecture]` |
| Token Strategy | `cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST` | `rl-ref/[RL Token Mgmt]` |
| Agent Model | `cic-ref/AGENTS` | `rl-ref/[RL Agents]` |

### Observability
| System | Reference |
|--------|-----------|
| CIC | `cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN` |
| RL | `rl-ref/[RL Observability]` |

---

## Sync Status

**CIC Last Synced:** 2026-07-02 10:42:39  
**RL Last Synced:** Pending configuration  
**Index Last Updated:** 2026-07-02  

### Configuration Files
- Sync Script: See `RL-VAULT-SETUP.md` for configuration
- Architecture: Populate `architecture/` folders as needed

---

## How to Use This Vault

1. **Single-System Query:** Reference `cic-ref/` or `rl-ref/` directly
2. **Cross-System Comparison:** Use Quick Reference table above
3. **Design Patterns:** Browse `architecture/cic-patterns/` or `architecture/rl-patterns/`
4. **Setup/Configuration:** See `RL-VAULT-SETUP.md`

---

## Document Locations

```
C:\dev\
├── 00-INDEX.md                 # Original CIC-only index
├── 00-RL-INDEX.md              # This file (dual-system index)
├── RL-VAULT-SETUP.md           # Setup and sync configuration
├── cic-ref/                    # CIC reference documents (synced)
│   ├── BUILD-SUMMARY.md
│   ├── AGENTS.md
│   ├── AGENTS_API.md
│   ├── CIC_ENV_REFERENCE.md
│   ├── CIC_RUNTIME_OBSERVABILITY_PLAN.md
│   ├── CIC_TOKEN_PACK_v2_0_FULL_LIST.md
│   └── ROADMAP.md
├── rl-ref/                     # RL reference documents (synced)
│   └── [Awaiting sync]
└── architecture/               # Design patterns and decisions
    ├── cic-patterns/           # CIC architectural patterns
    └── rl-patterns/            # RL architectural patterns
```

---

## Next Steps

1. **Confirm RL Documentation Source**
   - Location: OneDrive, Google Drive, GitHub, or other
   - Update `RL-VAULT-SETUP.md` with actual source path

2. **Enable RL Sync**
   - Update sync script/configuration
   - Test with sample RL document
   - Enable automated sync

3. **Populate Architecture Folders**
   - Add CIC design pattern documents
   - Add RL design pattern documents
   - Create cross-system comparison docs

4. **Update Quick Reference**
   - Add RL-specific sections as they become available
   - Update comparison table with actual document links

---

**Access:** sorensencc@gmail.com  
**Last Modified:** 2026-07-02
