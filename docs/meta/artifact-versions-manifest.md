# Artifact Versions Manifest

**Purpose:** Track all published artifacts by URL, version, status, and approval. Artifacts are discoverable/restorable via this manifest.

**Last Updated:** 2026-07-08  
**Manifest Version:** 1.0

---

## Governance Session 2026-07-08 (Phase 27 Governance Finalization)

### Artifact 1: Governance Audit Report

| Field | Value |
|-------|-------|
| **Title** | Governance Audit Report |
| **Class** | Class 2 (Research Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.0 |
| **Created** | 2026-07-08 |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/03bb9c9a-3b63-44ed-9e90-d46068cc2314 |
| **Content** | Conflict audit: Claude Instructions v1.0 vs. Global Operating Rules v1.3. 3 critical conflicts identified + hyperlink gaps + improvement roadmap. |
| **Superseded By** | Governance Package v1.0 (consolidated) |

---

### Artifact 2: Drift Incident Report DRIFT-2026-07-08-001

| Field | Value |
|-------|-------|
| **Title** | Drift Incident Report DRIFT-2026-07-08-001 |
| **Class** | Class 4 (Operational Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.0 |
| **Created** | 2026-07-08 |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/1f03e777-6b7d-444e-92f7-b223b7283c83 |
| **Severity** | MEDIUM |
| **Content** | Protocol violation: Committed Class 1 artifacts (governance docs) to git without Tier 1 confirmation (commit d520d09). Violations: §3.3 (Confirmation Gate Protocol), §2.1 (Artifact-First), §2.2 (Draft-by-Default). |
| **Resolution** | CLOSED — Tier 1 retroactively approved commit d520d09 |

---

### Artifact 3: Drift Incident Report DRIFT-2026-07-08-002

| Field | Value |
|-------|-------|
| **Title** | Drift Incident Report DRIFT-2026-07-08-002 |
| **Class** | Class 4 (Operational Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.0 |
| **Created** | 2026-07-08 |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/e60ba47 |
| **Severity** | MEDIUM |
| **Content** | Protocol violation: Created governance-artifacts-index.md + added to mkdocs.yml without artifact workflow. Same violations as DRIFT-2026-07-08-001. |
| **Resolution** | CLOSED — Tier 1 retroactively approved mkdocs nav addition (commit e60ba47) |

---

### Artifact 4: Claude Project Instructions v1.0 (HTML)

| Field | Value |
|-------|-------|
| **Title** | Claude Project Instructions — Artifact-First Operator Workflow v1.0 |
| **Class** | Class 1 (Strategy Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.0 |
| **Created** | 2026-07-08 |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/84ee50ca-5da9-4f2e-8301-d7a2ae0e2021 |
| **Format** | HTML (Cast Iron Charlie design system) |
| **Content** | Governance document defining Claude's behavioral defaults, output standards, reasoning protocols, operator interaction model, and safety rules for CIC + Rewrite Labs. 10 sections covering purpose, behavioral defaults, operator interaction, artifact production, memory, reasoning modes, drift prevention, safety, session startup, and document governance. |
| **Related Files** | c:\dev\docs\meta\claude-project-instructions-artifact-first.md (markdown source) |

---

### Artifact 5: Global Operating Rules v1.3 (HTML)

| Field | Value |
|-------|-------|
| **Title** | Global Operating Rules — CIC + Rewrite Labs v1.3 |
| **Class** | Class 1 (Strategy Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.3 |
| **Created** | 2026-07-08 |
| **Amended** | July 8, 2026 (v1.1 → v1.2 → v1.3) |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/47c478e8-fe55-4c88-bfe1-ac9e681c9a9f |
| **Format** | HTML (Cast Iron Charlie design system) |
| **Content** | System governance charter for CIC + Rewrite Labs. Defines architecture, memory governance, terminology, structured output taxonomy (Classes 1–5), reasoning modes (6 modes), daily operator automation, drift prevention, safety boundaries, design standards, and document governance. 11 sections covering all aspects of the unified content production environment. |
| **Related Files** | c:\dev\docs\meta\global-operating-rules-cic-rewrite-labs.md (markdown source) |

---

### Artifact 6: Governance Package v1.0

| Field | Value |
|-------|-------|
| **Title** | Governance Package v1.0 — Claude Instructions + Global Rules (Bidirectional Hyperlinks) |
| **Class** | Class 1 (Strategy Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.0 |
| **Created** | 2026-07-08 |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/4602a236-4774-466c-86f3-4e83d593e645 |
| **Content** | Summary artifact documenting improvements to Claude Instructions v1.0 + Global Rules v1.3. Resolves 3 critical conflicts (Active Assumptions scope, Design System mandate, Tier 1 pre-auth alignment). Verifies hyperlink coverage and governance health. Status: 🟢 PRODUCTION READY. |
| **Supersedes** | Governance Audit Report v1.0 (consolidated) |
| **Related Files** | Claude Instructions v1.0 (HTML), Global Operating Rules v1.3 (HTML) |

---

## Artifact Storage & Recovery

**Artifact URLs are not persistent.** If a link is lost:

1. Find the artifact in this manifest
2. Use the URL to retrieve it from claude.ai
3. If URL is dead, contact Tier 1 for archive recovery

**Filesystem equivalents (where applicable):**
- Governance Package v1.0 → Stored as files in c:\dev\docs\meta\
- Drift Incidents → Reference only (no filesystem backup needed; logged in manifest)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-08 | Initial manifest. 4 governance artifacts documented. |

---

**Manifest Owner:** Tier 1 (Chris)  
**Next Update:** When new artifacts are created  
**Review Cadence:** Quarterly (sync with governance review cycle)