---
title: "Reorganization"
summary: "# 8-Item Deliverables Reorganization Plan"
created: "2026-07-03T19:43:45.897Z"
updated: "2026-07-03T19:43:45.897Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# 8-Item Deliverables Reorganization Plan

**Goal:** Move all deliverables from C:\dev\ root to proper mkdocs + toolforge structure  
**Status:** IN PROGRESS  
**Last Updated:** 2026-07-02

---

## Reorganization Mapping

### Item 1: Research Skill
**Source:** C:\dev\cic-research/  
**Destination:** C:\dev\docs\cic\research-skill\

Files to move:
- SKILL.md → SKILL.md
- evals/evals.json → test-results/test-cases.json
- evals/grading-results.md → test-results/iteration-1-grading.md
- evals/iteration-2-summary.md → test-results/iteration-2-grading.md
- README.md (create) → README.md (usage, examples)

---

### Item 2: Observability Dashboard Spec
**Source:** Dashboard spec files  
**Destination:** C:\dev\docs\dashboard\

Create subdirs:
- C:\dev\docs\dashboard\spec\
- C:\dev\docs\dashboard\implementation\

Files to move:
- CIC_OBSERVABILITY_DASHBOARD_SPEC.md → spec/specification.md
- UI_WIREFRAMES_AND_DATA_FLOW.md → spec/ui-wireframes.md
- IMPLEMENTATION_GUIDE.md → implementation/implementation-guide.md
- DELIVERY_SUMMARY.md → spec/summary.md

---

### Item 3: Vault Analysis
**Source:** Topology analysis files  
**Destination:** C:\dev\docs\cic\vault-analysis\

Files to move:
- topology-map.mermaid → topology.mermaid
- topology-map.json → topology-data.json
- gap-analysis.md → gap-analysis.md
- recommendations.md → recommendations.md
- README.md (create) → README.md (overview)

---

### Item 4: Rewrite Labs Vault Mirror
**Source:** RL vault mirror docs  
**Destination:** C:\dev\docs\rewrite-labs\vault-mirror\

Files to move:
- 00-EXECUTIVE-SUMMARY.md → executive-summary.md
- IMPLEMENTATION-SETUP.md → setup.md
- VAULT-SYNC-CONFIGURATION.md → configuration.md
- RL-VAULT-SETUP.md → rl-setup.md
- Plus 5 additional guide docs

Scripts stay in C:\dev\:
- sync-vault.ps1 (stays in root, referenced from docs)
- sync-vault.sh (stays in root, referenced from docs)
- vault-sync-config.json (stays in root)

---

### Item 5: Operational Skills → TOOLFORGE
**Source:** 6 skill files (41K+ words)  
**Destination:** C:\dev\toolforge\skills\ (6 subdirectories)

Each skill gets: skill.json, src/, tests/, docs/, README.md

#### Skill 1: run-cic-phase
- C:\dev\toolforge\skills\run-cic-phase\
  - skill.json (metadata)
  - src/index.ts (implementation)
  - tests/test.ts (test suite)
  - docs/USAGE.md (usage guide)
  - README.md (quick ref)

#### Skill 2: debug-cic-issue
- C:\dev\toolforge\skills\debug-cic-issue\
  - (same structure as above)

#### Skill 3: monitor-phase-health
- C:\dev\toolforge\skills\monitor-phase-health\

#### Skill 4: configure-cic-environment
- C:\dev\toolforge\skills\configure-cic-environment\

#### Skill 5: investigate-data-flow
- C:\dev\toolforge\skills\investigate-data-flow\

#### Skill 6: onboard-new-extractor
- C:\dev\toolforge\skills\onboard-new-extractor\

Supporting docs:
- SKILLS-CATALOG.md → docs/skills/catalog.md
- VALIDATION-CHECKLIST.md → toolforge/skills/VALIDATION-CHECKLIST.md
- INTEGRATION-GUIDE.md → toolforge/skills/INTEGRATION-GUIDE.md

---

### Item 6: Knowledge Graph
**Source:** Knowledge graph library files  
**Destination:** C:\dev\docs\reference\knowledge-graph\

Files to move:
- extract-backlinks.ts → implementation/extract-backlinks.ts
- knowledge-graph-query.ts → implementation/query-interface.ts
- graph-viewer.html → viewer/index.html
- example-skill.ts → examples/skill-integration.ts
- validate-graph.ts → validation/validate.ts
- Plus 5 comprehensive guides → docs/

README.md (create) → Quick start + architecture overview

---

### Item 7: Memory Governance Framework
**Source:** Memory + vault fusion docs (77K+ words)  
**Destination:** C:\dev\docs\reference\memory-governance\

Files to move:
- 1_MEMORY_VAULT_INTEGRATION_FRAMEWORK.md → framework.md
- 2_CLAUDE_MD_TEMPLATE_VAULT_INTEGRATED.md → CLAUDE-md-template.md
- 3_MEMORY_GOVERNANCE_CHECKLIST.md → checklist.md
- 4_VAULT_FIRST_SKILL_TEMPLATE.md → skill-template.md
- 5_SESSION_BOUNDARY_MANAGER.md → session-manager.md
- 6_IMPLEMENTATION_GUIDE.md → implementation.md
- INDEX.md → index.md
- README.md → overview.md

---

### Summary Docs
**Source:** C:\dev\  
**Destination:** C:\dev\docs\meta\

Files to move:
- 8-ITEMS-COMPLETE-FINAL.md → 8-items-complete.md
- 8-ITEM-PROGRESS.md → build-progress.md
- FINAL-STATUS-8-ITEMS.md → final-status.md
- REORGANIZATION-PLAN.md → reorganization.md

---

## Files to DELETE from C:\dev\ root

After moving, these files should be removed from C:\dev\ (they're now in docs/):
- *.md files (except CLAUDE.md, README.md if part of codebase)
- All Item 1-8 deliverable markdown files

Keep in C:\dev\ root:
- Code files (*.ts, *.js, *.py, *.sh, *.ps1 - the scripts/implementations)
- Config files (*.json, *.yaml, *.yml - not documentation)
- CLAUDE.md (project instructions)
- Any README.md that's part of the codebase (not deliverables)

---

## Execution Checklist

- [ ] Item 1: Move cic-research → docs/cic/research-skill/
- [ ] Item 2: Move dashboard spec → docs/dashboard/
- [ ] Item 3: Move vault analysis → docs/cic/vault-analysis/
- [ ] Item 4: Move RL mirror → docs/rewrite-labs/vault-mirror/
- [ ] Item 5: Create skills in toolforge/skills/ (6 skills × 5 files each)
- [ ] Item 6: Move knowledge graph → docs/reference/knowledge-graph/
- [ ] Item 7: Move memory governance → docs/reference/memory-governance/
- [ ] Summary: Move summary docs → docs/meta/
- [ ] Cleanup: Remove .md files from C:\dev\ root
- [ ] Verify: Check all paths exist and files are in correct locations
- [ ] Update: Run mkdocs build to verify docs/ structure
- [ ] Validate: Run toolforge skill validation on new skills

---

## Notes

- Item 5 requires creating skill.json files with proper metadata for each skill
- Some files may need renaming for consistency (e.g., spec docs)
- Keep scripts (*.ps1, *.sh, *.ts implementation) in their functional locations
- All .md documentation goes to docs/ or toolforge/
- Update any internal cross-references after move

---

**Next Step:** Execute moves according to this plan

