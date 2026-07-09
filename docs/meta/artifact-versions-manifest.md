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

### Artifact 4: Governance Package v1.0

| Field | Value |
|-------|-------|
| **Title** | Governance Package v1.0 — Claude Instructions + Global Rules (Bidirectional Hyperlinks) |
| **Class** | Class 1 (Strategy Artifact) |
| **Status** | FINALIZED ✅ |
| **Version** | 1.0 |
| **Created** | 2026-07-08 |
| **Tier 1 Approved** | 2026-07-08 |
| **URL** | https://claude.ai/code/artifact/4602a236-4774-466c-86f3-4e83d593e645 |
| **Content** | Governance documents finalized with bidirectional hyperlinks. Documents 3 critical conflicts resolved (Active Assumptions scope, Design System mandate, Tier 1 pre-auth alignment). Hyperlink coverage verified. Governance health: 🟢 PRODUCTION READY. |
| **Supersedes** | Governance Audit Report v1.0 |
| **Related Files** | c:\dev\docs\meta\claude-project-instructions-artifact-first.md, c:\dev\docs\meta\global-operating-rules-cic-rewrite-labs.md |

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