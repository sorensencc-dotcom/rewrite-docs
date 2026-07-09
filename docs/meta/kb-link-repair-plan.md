---
title: "Knowledge Base Link Repair Plan"
summary: "Action plan for fixing broken links and cross-references in the Knowledge Base"
created: "2026-07-09"
updated: "2026-07-09"
tags:
  - kb-maintenance
  - links
---
# Knowledge Base Link Repair Plan
**Status:** DRAFT | **Date:** 2026-07-09 | **Owner:** Chris (Tier 1)

---

## Executive Summary

The kb-sync nightly identifies 72 broken links across the consolidated knowledge base. These represent design debt from the consolidation effort, not regression from your mkdocs cleanup (which validated 0 broken links).

This plan prioritizes repairs by impact: fix 22 high-priority links (roadmaps + architecture), audit 17 vault references, then clean up 8 orphaned links.

**Estimated effort:** 2–3 hours to resolve all 72 links.

---

## Priority Tiers

### TIER 1: High Priority — 22 Links (Create or Redirect)

These files are actively referenced by multiple docs. Create stubs or fix links.

#### Group 1a: Roadmap Files (13 links across 5 source files)

| Missing File | Referenced By | Action |
|---|---|---|
| `docs/roadmaps/unified-roadmap.md` | `reference/architecture.md`, `cic/index.md`, `reference/cic-rl-cross-reference.md` | Create stub + populate structure |
| `docs/roadmaps/cic-roadmap.md` | `cic/governance.md`, `reference/setup-checklist.md`, `cic/research-skill/skill.md` | Create stub + populate structure |
| `docs/roadmaps/rewrite-labs-roadmap.md` | `reference/cic-rl-cross-reference.md`, `reference/system-index-builder.md`, `reference/setup-checklist.md` | Create stub + populate structure |

**Action:**
1. Create three roadmap stubs in `docs/roadmaps/`:
   ```markdown
   # [System] Roadmap
   _Roadmap for [system]. See [PROJECT_STATE.md](../meta/PROJECT_STATE.md) for current status._
   
   - Phase 1: [description]
   - Phase 2: [description]
   ```
2. Link to them from your PROJECT_STATE or governance documents
3. Update mkdocs.yml nav to include `roadmaps/` section

---

#### Group 1b: Architecture Documentation (9 links across 4 source files)

| Missing File | Referenced By | Action |
|---|---|---|
| `docs/architecture/overview.md` | `reference/handbook.md`, `cic/index.md`, `reference/system-index-builder.md` | Create from existing `reference/architecture.md` patterns |
| `docs/architecture/routing.md` | `reference/services.md`, `reference/cic-rl-cross-reference.md` | Create or link to existing routing docs |
| `docs/architecture/deterministic-stack.md` | `api/seal-verify.md` | Create or consolidate with existing architecture |

**Action:**
1. Review `docs/reference/architecture.md` — this may be the source material for `architecture/overview.md`
2. Create stub in `docs/architecture/overview.md` that consolidates or references the reference layer
3. For `routing.md`: search for existing routing documentation in codebase and link/reference it
4. For `deterministic-stack.md`: consolidate with existing determinism/seal documentation

---

### TIER 2: Medium Priority — 17 Links (Audit + Redirect)

These are external vault references (`cic-ref/`, `rl-ref/`) that shouldn't be markdown hyperlinks.

#### Analysis: Vault Reference Pattern

**Files affected:**
- `reference/setup-checklist.md` (6 refs)
- `reference/implementation-setup.md` (2 refs)
- `cic/research-skill/skill.md` (5 refs)
- `reference/post-migration-checklist.md` (1 ref)
- `reference/toolforge.md` (4 refs) — partially overlaps with Group 1b

**Problematic targets:**
- `cic-ref/roadmap`, `cic-ref/build-summary`, `cic-ref/cic_env_reference`, `cic-ref/...`
- `rl-ref/roadmap`, `rl-ref/system-overview`, `rl-ref/agents`, `rl-ref/...`
- Malformed template: `rl-ref/" + $_.name.replace('.md','') + "` (PowerShell syntax, not markdown)

**Action:**
1. **For each file with vault refs:**
   - Open the markdown file
   - Identify the context of the vault reference (is it a step in a setup process? A code example? An external system reference?)
   - Replace with one of:
     - **Plain-text reference:** `(See cic-ref/build-summary for more info)`
     - **Code comment:** If in an example, move to `// Reference: cic-ref/build-summary`
     - **"See Also" section:** Add to end: `See also: cic-ref/ vault for full implementation details`

2. **Fix the malformed template in `reference/setup-checklist.md`:**
   ```
   OLD: rl-ref/" + $_.name.replace('.md','') + "
   NEW: (See rl-ref/ for system overviews)
   ```

3. **Add a note to CLAUDE.md:**
   - Document that `cic-ref/` and `rl-ref/` are architectural references outside the docs/ hierarchy
   - These should appear as plain text, not markdown links

---

### TIER 3: Low Priority — 8 Links (Clean + Archive)

These are orphaned or abstract references from earlier consolidation phases.

#### Orphaned References

| Source File | Broken Target | Issue | Action |
|---|---|---|---|
| `reference/knowledge-graph/readme.md` | `wiki-links`, `concept` | Abstract page references; no physical files | Remove or replace with context-specific link |
| `reference/post-migration-checklist.md` | `wiki-links` | Abstract reference to wiki metadata | Remove; consolidate with docs/ structure |
| `cic/kb-integration-summary.md` | `cic/overview.md`, `cic/agents.md` | Subdoc refs that don't exist | Check if these should be `../reference/` links instead |
| `reference/services.md` | `../integration/index.md`, `../systems/index.md` | Directories exist but index.md missing | Create `docs/integration/index.md`, `docs/systems/index.md` stubs |

**Action:**
1. **For abstract references (wiki-links, concept):** Delete and add a note like:
   ```markdown
   <!-- Removed broken reference: wiki-links — consolidated into docs/ structure -->
   ```

2. **For missing index files:** Create minimal stubs in `docs/integration/` and `docs/systems/`:
   ```markdown
   # [System] Index
   _Overview of [system] components and architecture._
   ```

3. **For subdoc references:** Search for `cic/overview.md`, `cic/agents.md` elsewhere in codebase:
   - If they exist elsewhere, update the link path
   - If they don't exist, check if they're covered by `reference/` docs

---

## Implementation Checklist

### Phase 1: Roadmaps & Architecture (Tier 1 — 22 links)
**Timeline:** 30–45 min

- [ ] Create `docs/roadmaps/unified-roadmap.md` (stub)
- [ ] Create `docs/roadmaps/cic-roadmap.md` (stub)
- [ ] Create `docs/roadmaps/rewrite-labs-roadmap.md` (stub)
- [ ] Create or consolidate `docs/architecture/overview.md`
- [ ] Create or reference `docs/architecture/routing.md`
- [ ] Create or reference `docs/architecture/deterministic-stack.md`
- [ ] Update `mkdocs.yml` nav to include new sections
- [ ] Run `mkdocs build --strict` — verify 0 errors
- [ ] Run `python sync.py` — check that roadmap + architecture links now resolve

### Phase 2: Vault References (Tier 2 — 17 links)
**Timeline:** 45–60 min

- [ ] Open `reference/setup-checklist.md` → audit each `cic-ref/`, `rl-ref/` link → replace with plain text
- [ ] Fix PowerShell template string: `rl-ref/" + $_.name.replace...` → plain text
- [ ] Open `reference/implementation-setup.md` → replace vault refs with plain text
- [ ] Open `cic/research-skill/skill.md` → replace vault refs with plain text
- [ ] Open `reference/post-migration-checklist.md` → replace vault refs with plain text
- [ ] Open `reference/toolforge.md` → replace vault refs with plain text
- [ ] Add note to CLAUDE.md documenting vault reference policy
- [ ] Run `python sync.py` — check that vault references no longer appear as broken links

### Phase 3: Orphaned Links (Tier 3 — 8 links)
**Timeline:** 15–30 min

- [ ] Open `reference/knowledge-graph/readme.md` → remove abstract references
- [ ] Open `reference/post-migration-checklist.md` → remove `wiki-links` reference
- [ ] Open `cic/kb-integration-summary.md` → fix or remove `cic/overview.md`, `cic/agents.md`
- [ ] Create `docs/integration/index.md` (stub)
- [ ] Create `docs/systems/index.md` (stub)
- [ ] Run `mkdocs build --strict` — verify 0 errors
- [ ] Run `python sync.py` — confirm all 72 links resolved or converted to plain text

### Validation
- [ ] `mkdocs build --strict` → exit code 0, 0 warnings
- [ ] `python cic-os/personal-knowledge-base/sync.py` → 0 broken links
- [ ] `kb-sync-nightly-with-artifact.py` → 0 broken links in next nightly run
- [ ] Git commit with message: "KB repair: resolve 72 broken links (roadmaps, vault refs, orphaned)"

---

## Success Criteria

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| mkdocs strict build | 0 errors ✓ | 0 errors ✓ | Already met |
| KB sync broken links | 72 | 0 | After Phase 3 |
| Roadmap files created | 0/3 | 3/3 | Phase 1 |
| Vault refs converted | 0/17 | 17/17 | Phase 2 |
| Orphaned links cleaned | 0/8 | 8/8 | Phase 3 |

---

## Notes

- **No regression:** Your mkdocs cleanup remains valid (0 broken links in the docs/ -> mkdocs validation pathway).
- **Consolidation artifact:** The 72 links expose a different validation layer (docs/ -> wiki consolidation). This is healthy: it surfaces design debt early.
- **Architectural decision:** Vault refs (cic-ref/, rl-ref/) should never be markdown hyperlinks. Document this in CLAUDE.md Memory.
- **Future prevention:** Add pre-commit check to sync.py validation in CI/CD pipeline.

---

## References

- Sync Report: `cic-os/personal-knowledge-base/_integration/sync-report.json`
- Interactive Artifact: `cic-os/personal-knowledge-base/_integration/kb-sync-interactive-report.html`
- mkdocs Config: `mkdocs.yml`
- Memory Governance: `CLAUDE.md` (Section 3)

---

**KB Link Repair Plan** | v1.0 | 2026-07-09 | Class 1 Strategy Artifact
