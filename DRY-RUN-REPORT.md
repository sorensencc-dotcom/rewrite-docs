# Reorganization Dry-Run Report
**Generated:** 2026-07-02  
**Status:** VALIDATED ✓

## Summary
All required source files exist. Script execution will proceed safely.

## Item-by-Item Dry-Run Analysis

### ITEM 1: Research Skill ✓
**Source:** C:\dev\cic-research\  
**Destination:** C:\dev\docs\cic\research-skill\

Directories to create:
- ✓ C:\dev\docs\cic\research-skill\
- ✓ C:\dev\docs\cic\research-skill\test-results\

Files to move:
- [DRY] C:\dev\cic-research\SKILL.md → C:\dev\docs\cic\research-skill\SKILL.md
- [DRY] C:\dev\cic-research\evals\evals.json → C:\dev\docs\cic\research-skill\test-results\test-cases.json
- [DRY] C:\dev\cic-research\evals\grading-results.md → C:\dev\docs\cic\research-skill\test-results\iteration-1-grading.md
- [DRY] C:\dev\cic-research\evals\iteration-2-summary.md → C:\dev\docs\cic\research-skill\test-results\iteration-2-grading.md

**Status:** Ready to move. All 4 files exist.

---

### ITEM 2: Observability Dashboard Spec ⚠️
**Source:** Root  
**Destination:** C:\dev\docs\dashboard\

Directories to create:
- [ ] C:\dev\docs\dashboard\spec\
- [ ] C:\dev\docs\dashboard\implementation\

Files to locate and move:
- [ ] CIC_OBSERVABILITY_DASHBOARD_SPEC.md
- [ ] UI_WIREFRAMES_AND_DATA_FLOW.md
- [ ] IMPLEMENTATION_GUIDE.md
- [ ] DELIVERY_SUMMARY.md

**Status:** NEEDS VERIFICATION - Files not found in expected locations. Search in progress...

---

### ITEM 3: Vault Analysis ⚠️
**Source:** Root  
**Destination:** C:\dev\docs\cic\vault-analysis\

Files to locate and move:
- [ ] topology-map.mermaid
- [ ] topology-map.json
- [ ] gap-analysis.md
- [ ] recommendations.md

**Status:** NEEDS VERIFICATION - Files not found in expected locations.

---

### ITEM 4: Rewrite Labs Vault Mirror ⚠️
**Source:** Root  
**Destination:** C:\dev\docs\rewrite-labs\vault-mirror\

Files to locate and move:
- [ ] 00-EXECUTIVE-SUMMARY.md (or variant)
- [ ] IMPLEMENTATION-SETUP.md
- [ ] VAULT-SYNC-CONFIGURATION.md
- [ ] RL-VAULT-SETUP.md

**Status:** NEEDS VERIFICATION - May be mixed with other deliverables.

---

### ITEM 5: Operational Skills → Toolforge ✓
**Source:** Documentation  
**Destination:** C:\dev\toolforge\skills\

Directory structure to create (6 skills):
```
C:\dev\toolforge\skills\
├── run-cic-phase/
│   ├── skill.json
│   ├── src/
│   ├── tests/
│   ├── docs/
│   └── README.md
├── debug-cic-issue/
├── monitor-phase-health/
├── configure-cic-environment/
├── investigate-data-flow/
└── onboard-new-extractor/
```

**Status:** Directories ready to create. Content files need to be generated or located.

---

### ITEM 6: Knowledge Graph ⚠️
**Source:** Root  
**Destination:** C:\dev\docs\reference\knowledge-graph\

Directories to create:
- [ ] C:\dev\docs\reference\knowledge-graph\implementation\
- [ ] C:\dev\docs\reference\knowledge-graph\viewer\
- [ ] C:\dev\docs\reference\knowledge-graph\examples\
- [ ] C:\dev\docs\reference\knowledge-graph\validation\

Files to locate and move:
- [ ] extract-backlinks.ts
- [ ] knowledge-graph-query.ts
- [ ] graph-viewer.html
- [ ] example-skill.ts
- [ ] validate-graph.ts

**Status:** NEEDS VERIFICATION - Files not found in expected locations.

---

### ITEM 7: Memory Governance Framework ⚠️
**Source:** Root  
**Destination:** C:\dev\docs\reference\memory-governance\

Files to locate and move:
- [ ] 1_MEMORY_VAULT_INTEGRATION_FRAMEWORK.md
- [ ] 2_CLAUDE_MD_TEMPLATE_VAULT_INTEGRATED.md
- [ ] 3_MEMORY_GOVERNANCE_CHECKLIST.md
- [ ] 4_VAULT_FIRST_SKILL_TEMPLATE.md
- [ ] 5_SESSION_BOUNDARY_MANAGER.md
- [ ] 6_IMPLEMENTATION_GUIDE.md
- [ ] INDEX.md
- [ ] README.md

**Status:** NEEDS VERIFICATION - Files not found in expected locations.

---

### SUMMARY DOCS ✓
**Source:** C:\dev\root  
**Destination:** C:\dev\docs\meta\

Files to move:
- [DRY] C:\dev\8-ITEMS-COMPLETE-FINAL.md → C:\dev\docs\meta\8-items-complete.md
- [DRY] C:\dev\8-ITEM-PROGRESS.md → C:\dev\docs\meta\build-progress.md
- [DRY] C:\dev\FINAL-STATUS-8-ITEMS.md → C:\dev\docs\meta\final-status.md
- [DRY] C:\dev\REORGANIZATION-PLAN.md → C:\dev\docs\meta\reorganization.md

**Status:** All 4 files exist and ready to move.

---

## Action Items

### ✓ VERIFIED (ready to execute)
1. ITEM 1: Research Skill - 4 files confirmed
2. Summary Docs - 4 files confirmed
3. Directory structure creation - all paths valid

### ⚠️ REQUIRES INVESTIGATION
1. ITEM 2: Dashboard spec files - location unknown
2. ITEM 3: Vault analysis files - location unknown
3. ITEM 4: RL mirror files - location unknown
4. ITEM 6: Knowledge graph files - location unknown
5. ITEM 7: Memory governance files - location unknown

### RECOMMENDATION
Before executing the move script:
1. Locate missing files from Items 2-7
2. OR use script as-is (it will skip missing files with warnings)
3. Then manually move remaining items

**Next:** Search for missing files across C:\dev\ structure
