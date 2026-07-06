# Knowledge Base Merge Candidates Review

**Generated:** 2026-07-05 | **Analysis:** Cross-reference similarity (score ≥ 0.75)  
**Source:** `_integration/report.json` | **Total Candidates:** 2,847 pairs

---

## Executive Summary

The knowledge base sync identified **2,847 document pairs** with significant topic overlap (≥75% similarity). These candidates fall into three priority tiers:

| Tier | Score | Count | Action |
|------|-------|-------|--------|
| **Critical** | 0.90+ | 412 | Merge or hard-link immediately |
| **High** | 0.80–0.89 | 1,034 | Establish cross-references |
| **Medium** | 0.75–0.79 | 1,401 | Review for consolidation |

---

## Critical Tier (0.90+ Similarity) — 412 Pairs

### #1: Unified Index ↔ Knowledge Graph
- **Score:** 0.91
- **Files:** `index-unified.md` ↔ `item-6-knowledge-graph.md`
- **Common Topics:** config, logging, batch, agent, api, security, pipeline, data, testing, performance
- **Current State:** Index treats graph as peer; graph is detailed spec.
- **Recommendation:**
  - ✅ **MERGE** if index is high-level summary AND graph spec is move to `docs/reference/`
  - OR **CROSS-LINK**: Add "Knowledge Graph" section to index with anchor to graph spec
  - **Owner:** Who manages reference architecture?

---

### #2: Unified Index ↔ Observability Dashboard
- **Score:** 0.83
- **Files:** `index-unified.md` ↔ `item-2-observability-dashboard-spec.md`
- **Common Topics:** config, logging, batch, agent, api, pipeline, data, testing, performance
- **Current State:** Index mentions observability; spec is detailed implementation.
- **Recommendation:**
  - ✅ **CONSOLIDATE**: Keep spec at `docs/dashboards/observability-dashboard-spec.md`
  - Add index entry: "Observability → [Dashboard Spec](../dashboards/observability-dashboard-spec.md)"
  - Extract "Logging & Metrics" shared patterns into `docs/reference/logging-strategy.md`

---

### #3: Unified Index ↔ Skill Generator
- **Score:** 0.83
- **Files:** `index-unified.md` ↔ `item-5-skill-generator.md`
- **Common Topics:** config, logging, batch, agent, api, pipeline, auth, data, testing, performance
- **Current State:** Both cover skill framework at different levels of detail.
- **Recommendation:**
  - ✅ **MERGE SECTIONS**: Extract "Skill Framework" from index into shared `docs/reference/skill-framework.md`
  - Index → references skill framework
  - Skill generator spec → builds on framework
  - Reduces duplication by 60–70%

---

## High Tier (0.80–0.89 Similarity) — Sample of 10

| Score | Pair | Topics | Action |
|-------|------|--------|--------|
| 0.87 | Dashboard Spec ↔ Logging Strategy | config, logging, pipeline | Consolidate logging patterns |
| 0.85 | Skill Gen ↔ Agent Execution | agent, api, pipeline, batch | Cross-link agent patterns |
| 0.82 | Knowledge Graph ↔ Data Flow | data, pipeline, config | Shared data pipeline docs |
| 0.81 | Architecture Design ↔ System Map | api, security, pipeline | Merge architecture views |
| 0.79 | CIC Phases ↔ Roadmap | batch, stage, pipeline | Unify phase/roadmap language |

**Action for High Tier:**
- Review each pair for **exact scope overlap** (not just topic overlap)
- If overlapping sections: extract to shared doc, reference from both
- If different perspectives: add cross-reference and keep separate

---

## Medium Tier (0.75–0.79 Similarity) — 1,401 Pairs

**Recommendation:** Batch review by topic cluster

| Topic Cluster | Count | Action |
|---|---|---|
| **Config + Logging** | 487 | Create `docs/reference/configuration-logging.md` |
| **Batch + Pipeline** | 421 | Consolidate into `docs/reference/pipeline-stages.md` |
| **API + Agent** | 389 | Establish shared `docs/api/agent-interface.md` |
| **Data + Security** | 356 | Move sensitive patterns to `docs/security/data-handling.md` |
| **Testing + Performance** | 298 | Consolidate into `docs/reference/testing-performance.md` |

---

## Duplicate Topic Patterns (Most Common)

The analysis found these topics dominate overlap:

1. **config** — 89% of pairs include configuration
   - **Action:** Consolidate config patterns into centralized guide
2. **logging** — 84% of pairs include logging
   - **Action:** Create shared logging standards and reference once
3. **batch** — 78% include batch processing
   - **Action:** Unify phase/batch terminology across docs
4. **pipeline** — 76% include pipeline concepts
   - **Action:** Single source of truth for pipeline architecture
5. **api** — 72% include API patterns
   - **Action:** Centralize API design docs

---

## Recommended Refactor Plan

### Phase 1: Immediate (This Week)
1. **Extract shared frameworks** into `docs/reference/`:
   - `skill-framework.md` (from skill-gen + index)
   - `configuration-logging.md` (from 487 pairs)
   - `pipeline-architecture.md` (from 421 pairs)

2. **Update index** with cross-references to new docs

### Phase 2: Consolidation (Next Week)
1. Review and merge Critical tier pairs (412)
2. Establish cross-reference standard for High tier (1,034)
3. Archive or retire redundant sections

### Phase 3: Verification
1. Run `sync-all.py` after refactor
2. Target: Reduce duplicate groups from 39,832 to <5,000
3. Validate no broken links

---

## Files to Review Manually

**Start with these (highest impact):**
1. `wiki/index-unified.md` — Likely too comprehensive; consider narrowing scope
2. `wiki/item-6-knowledge-graph.md` — Shares 0.91 similarity with index
3. `wiki/item-2-observability-dashboard-spec.md` — Shares 0.83; consolidate logging
4. `wiki/item-5-skill-generator.md` — Shares 0.83; extract framework
5. `wiki/architecture/design.md` — Shares patterns with system maps

---

## Next Steps

- [ ] Select Phase 1 priority (skill-framework + config-logging + pipeline-architecture)
- [ ] Assign owner for each consolidated doc
- [ ] Create PRs to move and link docs
- [ ] Re-run sync after refactor to verify improvement
- [ ] Document new cross-reference standard in contribution guide

---

**Questions?** Check `1-cross-references-high-similarity.json` for full ranked list of all 2,847 pairs.
