---
name: cic-knowledge-base-consolidation-inventory
description: Phase 1 Inventory — 1,000+ files categorized, scope locked, consolidation plan
metadata:
  type: meta
---

# CIC Knowledge Base Consolidation — Inventory (Phase 1)

**Date:** 2026-07-06  
**Status:** IN PROGRESS  
**Total Files Scanned:** 1,000+ (9 root + 800+ docs/ + 200+ memory/)  

---

## Summary

| Category | Count | Action | Target Path | Status |
|----------|-------|--------|-------------|--------|
| **Canonical (Keep + Consolidate)** | ~550 | Merge/organize | `docs/cic/` + subdirs | Pending |
| **Isolated (Archive Only)** | ~400 | Archive snapshot | `docs/meta/legacy-archive/` | Pending |
| **Already Correctly Placed** | ~50 | Verify + link audit | In place | Pending |
| **Toolforge Skills** | TBD | Isolate | `C:\dev\toolforge\skills/` | Pending |

**Total: ~1,000+ files to process**

---

## Root-Level Markdown Files (9 total)

| File | Type | Target | Action |
|------|------|--------|--------|
| `CLAUDE.md` | Instructions | Root | KEEP (not moved) |
| `README.md` | Project README | Root | KEEP (not moved) |
| `PHASE-26-VERIFICATION-CHECKLIST.md` | Governance | `docs/cic/governance.md` | Merge |
| `PHASE_8_IMPLEMENTATION_SUMMARY.md` | Phase-specific (historical) | Archive | Archive |
| `PHASE-8-PHASE-30-IMPLEMENTATION.md` | Phase-specific (historical) | Archive | Archive |
| `CI-CD-ROOT-CAUSE-FINDINGS.md` | Deployment analysis | `docs/deployment/ci-cd.md` | Merge |
| `RL-VAULT-SETUP.md` | Rewrite Labs | `docs/rewrite-labs/vault-setup.md` | Merge |
| `VAULT-AUTOMATION-SETUP.md` | Operations | `docs/operations/vault-automation.md` | Merge |
| `CHANGELOG.md` | Project history | Root | KEEP or merge to `docs/meta/changelog.md` |

**Gate:** All 9 root files categorized. KEEP 2, MERGE 6, ARCHIVE 1.

---

## docs/ Directory Structure (Already ~800 files)

### **✔ Already in Canonical Structure (No Migration Needed)**

#### docs/cic/ (~180 files)
**Status:** Core CIC architecture — already canonical  
- Phase 1–50 specs  
- Phase-specific implementation logs  
- Phase-specific test matrices  
- Phase-A/B/C optimization + hardening  
- Phase-D/E integration + enforcement  
- Governance: `docs/cic/governance.md`  
- Architecture: `docs/cic/architecture.md` + design, routing, ingestion  
- Contract: `docs/cic/contracts.md` (implied)  
- Observability: `docs/cic/observability.md` (implied)  
- Knowledge Graph: `docs/cic/kb-integration-summary.md` (implied)  
- TorqueQuery: `docs/cic/torquequery-*.md` (multiple)  
- Sandbox 3: `docs/cic/sandbox-3-*.md` (multiple)  

**Action:** Link audit + verify completeness. Phase 26 gates merge into `governance.md`.

#### docs/deployment/ (~10 files)
**Status:** Deployment docs — canonical  
- Docker files  
- Registry config  
- Reproducible dockerfiles  
- Convergence traces  

**Action:** Merge root-level `CI-CD-ROOT-CAUSE-FINDINGS.md` into here.

#### docs/dashboard/ (~15 files)
**Status:** Dashboard UI + cost system — canonical  
- Dashboard.md  
- Dark mode implementation  
- Command center priority matrix  
- 8-item progress tracking  
- Tier2 agents conflict map  

**Action:** Verify organization. No changes needed.

#### docs/reference/ (~50 files)
**Status:** API + reference — canonical  
- API reference  
- Agent execution  
- CLI  
- Docker  
- Kubernetes  
- Schemas  
- Services  
- Knowledge graph quick-start  
- Skill location governance  

**Action:** Verify cross-links. Consolidate duplicates if any.

#### docs/rewrite-labs/ (~15 files)
**Status:** Rewrite Labs framework — canonical  
- RL index  
- Vault setup  
- Vault mirror configuration  
- Vault sync configuration  

**Action:** Add onboarding guide + handbook after Phase 1.

#### docs/roadmaps/ (~80 files)
**Status:** Roadmap specs + ticket batches — canonical  
- CIC roadmap  
- Rewrite Labs roadmap  
- Unified roadmap  
- Batch 1–5 tickets  
- Phase 23–27 execution blueprint  
- Risk register  

**Action:** Consolidate duplicates. Verify no orphaned batch files.

#### docs/operations/ (~10 files)
**Status:** Operational docs — canonical  
- Cost tracking  
- Drift forecast  
- Monitoring  
- Running  
- Troubleshooting  
- Verification  
- Weekly sync  
- Autonomous image builds  
- Roadmap runner  

**Action:** Merge `VAULT-AUTOMATION-SETUP.md` here.

#### docs/implementation/ (~5 files)
**Status:** Implementation docs — canonical  
- Phase 26 architecture decision log  
- Phase 26 deployment checklist  
- Phase 26 test verification  

**Action:** Consolidate Phase 26 governance docs. Verify completeness.

#### docs/meta/ (~50 files)
**Status:** Meta/historical docs — canonical  
- Consolidation-related files  
- Build summaries  
- Reviews  
- Audits  
- Migration logs  
- Reorganization plans  
- Repo cleanup  

**Action:** Add `consolidation-inventory.md`, `consolidation-status.md`, `link-audit.md`.

#### docs/integration/ + docs/gateway/ + docs/systems/ (~10 files)
**Status:** Subsystem docs — canonical  
- API federation  
- Access layer  
- Snapshot layer  
- Seal verify  
- Adapter gateway  
- Providers  
- Systems index  

**Action:** Verify organization. Link to main docs.

#### docs/quickstart/ + docs/api/ + docs/architecture/ + docs/observability/ (~25 files)
**Status:** Reference structure — canonical  
- Installation  
- First steps  
- Data flow  
- Design  
- Drift  
- Dashboards integration  
- Monitoring  

**Action:** Verify no duplication with reference/. Consolidate if needed.

#### docs/tests/ (~5 files)
**Status:** Test docs — canonical  
- Dashboard tests  
- Feedback loop tests  
- Routing tests  

**Action:** Consider moving to `docs/reference/testing.md` or keep isolated.

#### docs/item-{2,3,5,6,7,8}-*.md (~5 files)
**Status:** Core items 2–8 spec docs — canonical  
- Observability dashboard spec  
- Vault extraction system map  
- Skill generator  
- Knowledge graph  
- Memory governance framework  
- Audit trail  

**Action:** Consolidate into appropriate sections (governance, KG, observability).

### **⚠ Needs Evaluation (Possible Cleanup)**

#### docs/cic/phase-{23..50}-*.md (~50 files)
**Status:** Phase-specific implementation docs  
**Decision:** Keep canonical phases (23–26 critical, 27+ for roadmap). Archive superseded phase-specific historical logs.  
**Action:** Per-phase review. Archive phase-specific *historical* docs, keep phase *specs*.

#### docs/meta/review-*.md, docs/meta/plan-*.md, docs/meta/migration-*.md (~30 files)
**Status:** Historical review/planning artifacts  
**Decision:** Archive most. Keep if actively referenced in CLAUDE.md or roadmap.  
**Action:** Review + archive.

---

## Memory Files (200+ in `~/.claude/projects/c--dev/memory/`)

### **Classification: Isolated (Archive Only)**

**Why:** 
- Session-specific analysis  
- Historical (prior 2026-07-03 to 2026-07-05)  
- Not part of canonical CIC reference  
- Duplicative with docs/ versions  

**Examples:**
- `ashfall-wrap-2026-07-06.md`  
- `phase-26-gates-verification-complete.md`  
- `work-summarizer-v2-complete.md`  
- `session-2026-07-05-*.md` (10+ files)  
- `phase-*-complete.md` (50+ files)  

**Action:**
- Full-content snapshot → `docs/meta/legacy-archive/memory-files-2026-07/`  
- No migration, no merging  
- Index maintained in `legacy-archive/INDEX.md`

**Gate:** All 200+ memory files archived, none lost.

---

## Toolforge Skills

**Current Status:** TBD (needs separate scan)  
**Expected Location:** `C:\dev\toolforge\skills/{skill-name}/`  
**Scope:** Per CLAUDE.md Rule 2, skills should be isolated here, not in docs/.

**Action:** Identify any skill-related docs in docs/ that should move to toolforge/.

---

## Deprecated / To Archive

### **Work-Summarizer Docs**
- `work-summarizer-v2-complete.md` (memory)  
- `session-2026-07-04-work-summarizer-stage-2-complete.md` (memory)  
- `phase-work-summarizer-stage-2-complete.md` (docs/)  

**Action:** Archive (full content snapshot).

### **Phase-Specific Historical Docs**
- `PHASE_8_IMPLEMENTATION_SUMMARY.md` (root)  
- `PHASE-8-PHASE-30-IMPLEMENTATION.md` (root)  
- `phase-1-*-complete.md` (50+ memory files)  
- `phase-23-2-23-3-complete.md` (memory)  
- Multiple `phase-X-implementation-log.md`, `phase-X-completion.md`  

**Action:** Archive unless actively referenced in Phase 26+ roadmap.

### **Superseded Infrastructure Docs**
- `ci-cd-fix-root-cause-2026-07-05.md` (memory)  
- `session-2026-06-28-automation-complete.md` (memory)  
- `integration-test-fix-session-2026-06-22.md` (memory)  

**Action:** Archive if no active reference.

---

## Onboarding Guide + Developer Handbook (New)

**Scope Lock Confirmation:**
- ✔ Onboarding guide → `docs/onboarding/` (NEW)  
- ✔ Developer handbook → `docs/reference/handbook.md` (NEW)  

**Files to Create:**
- `docs/onboarding/index.md` — CIC 101  
- `docs/onboarding/quickstart.md` — Setup + first steps  
- `docs/onboarding/architecture-overview.md` — System overview  
- `docs/reference/handbook.md` — Coding standards, workflows  

**Action:** Create stubs after Phase 2 (structure design).

---

## Link Audit Tracking

**Placeholder for Phase 4 (Validation):**
- [ ] Scan all docs for wiki/ references → 0 expected  
- [ ] Scan for root-path references → 0 expected  
- [ ] Scan for broken internal links → 0 expected  
- [ ] Test mkdocs build --strict → PASS expected  
- [ ] Test mkdocs search → All docs indexed  

---

## Next Steps

### **Phase 2: Target Structure Design**
- Finalize mkdocs.yml nav structure  
- Confirm canonical + isolated + conditional boundaries  
- Create directory stubs  

### **Phase 3: Content Migration (Waves A–F)**
- Wave A: Core architecture (days 1–2)  
- Wave B: Governance + compliance (days 2–3)  
- Wave C: Observability + deployment (days 3–4)  
- Wave D: Skills + rewrite labs (days 4–5)  
- Wave E: API + dashboard (days 5–6)  
- Wave F: Cleanup + linking (days 6–7)  

### **Phase 4: Validation + Testing**
- Link audit  
- Terminology audit  
- Reference audit  
- Build audit  
- Search audit  
- Rendering audit  

### **Phase 5: Rollback + Archive**
- Legacy wiki snapshot  
- Redirects (if applicable)  
- CLAUDE.md update  
- Zero broken references verification  

---

## Issues + Risks

| Issue | Risk Level | Mitigation |
|-------|-----------|-----------|
| **1,000+ files to categorize** | HIGH | Automated script to scan + categorize. Manual spot-check sample. |
| **Duplication across docs/ + memory/** | MEDIUM | Archive strategy (full snapshot). No data loss. |
| **Phase-specific historical docs** | MEDIUM | Clear decision: archive unless actively referenced. Per-phase review. |
| **mkdocs.yml not locked yet** | MEDIUM | Phase 2 (structure design) addresses this. |
| **Cross-link breakage** | MEDIUM | Phase 4 (link audit) catches this. |
| **Memory file loss** | LOW | Full-content snapshot in `legacy-archive/`. |

---

## Approval Gate (Phase 1 Complete)

**Checklist:**
- [ ] All 1,000+ files categorized  
- [ ] Root-level files mapped (9 files)  
- [ ] docs/ structure verified (~800 files)  
- [ ] Memory files classified as "archive only" (~200 files)  
- [ ] Onboarding + handbook flagged as "create new"  
- [ ] Toolforge skills identified (separate scan TBD)  
- [ ] Risks + mitigations documented  
- [ ] Phase 2 (structure design) ready to begin  

**Phase 1 Gate:** All items above completed → Proceed to Phase 2.

---

*Inventory Status: IN PROGRESS → PHASE 2 PENDING COMPLETION*
