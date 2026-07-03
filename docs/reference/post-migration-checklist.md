---
title: "Post Migration Checklist"
summary: "# Post-Migration Verification Checklist"
created: "2026-07-03T19:43:46.088Z"
updated: "2026-07-03T19:43:46.088Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Post-Migration Verification Checklist

**Purpose:** Comprehensive validation after 8-Item Reorganization  
**Timeline:** Run in this order, pause between phases for review  
**Owner:** Chris (Operator)

---

## Phase 1: File System Verification (15 min)

### ✓ Directory Structure

- [ ] `C:\dev\docs\cic\research-skill\` exists
- [ ] `C:\dev\docs\cic\research-skill\test-results\` exists
- [ ] `C:\dev\docs\cic\vault-analysis\` exists
- [ ] `C:\dev\docs\dashboard\spec\` exists
- [ ] `C:\dev\docs\dashboard\implementation\` exists
- [ ] `C:\dev\docs\rewrite-labs\vault-mirror\` exists
- [ ] `C:\dev\docs\reference\knowledge-graph\` exists with subdirs (implementation, viewer, examples, validation)
- [ ] `C:\dev\docs\reference\memory-governance\` exists
- [ ] `C:\dev\docs\meta\` exists
- [ ] `C:\dev\toolforge\skills\` contains 6 skill directories (run-cic-phase, debug-cic-issue, etc.)

### ✓ File Counts

Count files in each directory:

```powershell
# Example: Run these to verify file counts
(Get-ChildItem -Path "C:\dev\docs\cic\research-skill" -Recurse -File).Count  # Should be ~5
(Get-ChildItem -Path "C:\dev\toolforge\skills" -Recurse -File).Count        # Should be 30+
(Get-ChildItem -Path "C:\dev\docs\meta" -File).Count                       # Should be 4+
```

Expected totals:
- [ ] research-skill: ~5 files
- [ ] vault-analysis: ~4 files
- [ ] dashboard: ~7 files combined
- [ ] rewrite-labs: ~5 files
- [ ] knowledge-graph: ~8+ files
- [ ] memory-governance: ~8 files
- [ ] meta: ~4 files
- [ ] toolforge skills: 30+ files (6 skills × ~5 files each)

### ✓ Old Location Cleanup

Verify old files removed from C:\dev\ root:

```powershell
# These should return 0 results:
Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*SKILL*.md"
Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*dashboard*.md"
Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*gap-analysis*"
Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*topology*"
Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*8-ITEMS*"
```

- [ ] No *.md deliverable files in C:\dev\ root (except CLAUDE.md)
- [ ] C:\dev\cic-research\ is empty (or contains only code/scripts)
- [ ] All organizational .md files moved to docs/

---

## Phase 2: Content Validation (20 min)

### ✓ Research Skill Files

```powershell
Test-Path "C:\dev\docs\cic\research-skill\SKILL.md"                    # TRUE
Test-Path "C:\dev\docs\cic\research-skill\test-results\test-cases.json" # TRUE
Test-Path "C:\dev\docs\cic\research-skill\test-results\iteration-1-grading.md"  # TRUE
Test-Path "C:\dev\docs\cic\research-skill\test-results\iteration-2-grading.md"  # TRUE
```

- [ ] All SKILL.md files have content (not empty)
- [ ] All test result files readable and valid JSON/MD

### ✓ Dashboard Spec Files

- [ ] `docs/dashboard/spec/specification.md` exists and contains "Observability Dashboard"
- [ ] `docs/dashboard/spec/ui-wireframes.md` exists and contains wireframe data
- [ ] `docs/dashboard/implementation/implementation-guide.md` exists

### ✓ Vault Analysis Files

- [ ] `docs/cic/vault-analysis/topology.mermaid` is valid Mermaid syntax
- [ ] `docs/cic/vault-analysis/gap-analysis.md` contains gap analysis content
- [ ] `docs/cic/vault-analysis/topology-data.json` is valid JSON

### ✓ Toolforge Skills

For each skill, verify structure:

```powershell
$skills = @("run-cic-phase", "debug-cic-issue", "monitor-phase-health", 
            "configure-cic-environment", "investigate-data-flow", "onboard-new-extractor")

foreach ($skill in $skills) {
  $skillPath = "C:\dev\toolforge\skills\$skill"
  Test-Path "$skillPath\skill.json"      # Should be TRUE
  Test-Path "$skillPath\src"             # Should be TRUE
  Test-Path "$skillPath\tests"           # Should be TRUE
  Test-Path "$skillPath\docs"            # Should be TRUE
  Test-Path "$skillPath\README.md"       # Should be TRUE
}
```

- [ ] All 6 skills have complete directory structure
- [ ] Each skill has skill.json (metadata)
- [ ] Each skill has src/ directory with implementation
- [ ] Each skill has tests/ directory
- [ ] Each skill has docs/ directory
- [ ] Each skill has README.md

---

## Phase 3: Cross-Reference Validation (25 min)

### ✓ Internal Links

Search for broken internal links:

```powershell
# Search for old paths in markdown files
Select-String -Path "C:\dev\docs\**\*.md" -Pattern "C:\\dev\\cic-research\\" -Recurse
Select-String -Path "C:\dev\docs\**\*.md" -Pattern "C:\\dev\\dashboard\\" -Recurse
Select-String -Path "C:\dev\docs\**\*.md" -Pattern "C:\\dev\\SKILL_" -Recurse
```

- [ ] No old file paths found in docs/
- [ ] All [[wiki-links]] point to existing vault docs
- [ ] All relative links (docs/ paths) are correct

### ✓ Vault References

Search for vault links - these should all be intact:

```powershell
Select-String -Path "C:\dev\docs\**\*.md" -Pattern "\[\[cic-ref\|" -Recurse
Select-String -Path "C:\dev\docs\**\*.md" -Pattern "\[\[rl-ref\|" -Recurse
Select-String -Path "C:\dev\docs\**\*.md" -Pattern "\[\[architecture\|" -Recurse
```

- [ ] All vault links (cic-ref, rl-ref, architecture) intact
- [ ] Vault links point to correct files in C:\dev\cic-ref\, etc.

### ✓ Cross-Document References

Manually verify 5-10 links work:

- [ ] In research-skill/SKILL.md: Check [[cic-ref/BUILD-SUMMARY]] link
- [ ] In gap-analysis.md: Check [[cic-ref/ROADMAP]] link
- [ ] In knowledge-graph docs: Check references to implementation files
- [ ] In memory-governance: Check references to CLAUDE.md template

---

## Phase 4: mkdocs Build Validation (15 min)

### ✓ mkdocs.yml Update

Before running build:

- [ ] mkdocs.yml has been updated with new navigation structure
- [ ] YAML syntax is valid (no indentation errors)
- [ ] All nav entries point to existing files

### ✓ mkdocs Build

```bash
cd C:\dev
mkdocs build --strict
```

- [ ] Build completes with 0 errors
- [ ] Build completes with 0 warnings (or expected warnings only)
- [ ] site/ directory is generated
- [ ] site/index.html exists

### ✓ mkdocs Serve

```bash
mkdocs serve
```

- [ ] Server starts successfully
- [ ] Accessible at http://localhost:8000
- [ ] Home page loads
- [ ] Navigation sidebar shows all new sections

---

## Phase 5: Manual Spot-Check (20 min)

### ✓ Test Links in Browser

Open `http://localhost:8000` and click:

**CIC Section:**
- [ ] CIC → Research Skill → SKILL.md
- [ ] CIC → Research Skill → Test Results → Iteration 1 Grading
- [ ] CIC → Vault Analysis → Gap Analysis
- [ ] CIC → Vault Analysis → Topology Map

**Dashboard Section:**
- [ ] Dashboard → Specification
- [ ] Dashboard → Implementation

**Rewrite Labs Section:**
- [ ] Rewrite Labs → Vault Mirror → Setup Guide

**Reference Section:**
- [ ] Reference → Knowledge Graph
- [ ] Reference → Memory Governance

**Build Docs Section:**
- [ ] Build Docs → 8-Items Complete
- [ ] Build Docs → Build Progress

### ✓ Content Verification

For each major section, verify:

- [ ] Headers render correctly
- [ ] Code blocks are formatted properly
- [ ] Links are underlined and clickable
- [ ] Images/diagrams display (if any)
- [ ] No rendering errors

---

## Phase 6: Toolforge Integration (10 min)

### ✓ Skill Registration

Verify skills are discoverable:

```powershell
cd C:\dev\toolforge
.\run-tool.ps1 -List -Category skills
.\run-tool.ps1 -Inspect run-cic-phase
```

- [ ] All 6 skills appear in skill list
- [ ] Each skill inspection returns valid metadata
- [ ] skill.json is parseable JSON
- [ ] Entry points are correct

### ✓ Manifest Integration

- [ ] C:\dev\toolforge\manifest.json updated with new skills
- [ ] No duplicate entries
- [ ] All skills have version numbers

---

## Phase 7: Documentation Completeness (10 min)

### ✓ Index Files

Verify index/overview files exist:

- [ ] C:\dev\docs\cic\index.md (or similar)
- [ ] C:\dev\docs\dashboard\index.md
- [ ] C:\dev\docs\rewrite-labs\index.md
- [ ] C:\dev\docs\reference\index.md
- [ ] C:\dev\docs\meta\index.md

### ✓ README Files

- [ ] C:\dev\docs\cic\research-skill\README.md exists
- [ ] C:\dev\docs\cic\vault-analysis\README.md exists
- [ ] C:\dev\toolforge\skills\*/README.md exists (6 files)

### ✓ Navigation Completeness

- [ ] All Items 1-7 represented in mkdocs navigation
- [ ] Logical hierarchy (CIC, Dashboard, RL, Reference, Meta)
- [ ] No orphaned docs

---

## Phase 8: Final Validation (5 min)

### ✓ Regression Testing

Verify nothing broke:

- [ ] CLAUDE.md still in C:\dev\ root (not moved)
- [ ] Code scripts unchanged (still executable)
- [ ] Config files unchanged (still valid)
- [ ] Vault structure unchanged (cic-ref/, etc.)
- [ ] Toolforge structure intact (except new skills)

### ✓ Git Status

```bash
git status
```

- [ ] Only expected files moved/added
- [ ] No unexpected deletions
- [ ] No binary files corrupted
- [ ] Ready to commit

---

## Sign-Off Checklist

Complete all phases, then check these:

- [ ] Phase 1: File system verified ✓
- [ ] Phase 2: Content validated ✓
- [ ] Phase 3: Cross-references OK ✓
- [ ] Phase 4: mkdocs builds successfully ✓
- [ ] Phase 5: Manual spot-check passed ✓
- [ ] Phase 6: Toolforge integration verified ✓
- [ ] Phase 7: Documentation complete ✓
- [ ] Phase 8: Final validation passed ✓

### Overall Status

- [ ] **PASS** - All checks passed, ready to commit
- [ ] **FAIL** - Issues found (see notes below)

### Notes (if any issues found)

```
[Add any issues, workarounds, or next steps here]
```

---

## Rollback Plan (if needed)

If verification fails:

```bash
git reset --hard HEAD
```

This will restore all files to their original locations.

---

## Post-Verification Actions

Once all checks pass:

1. [ ] Commit changes: `git commit -m "Reorganize 8-item deliverables per mkdocs policy"`
2. [ ] Push to branch: `git push origin <branch>`
3. [ ] Update CI/CD (if necessary)
4. [ ] Notify team that docs structure has changed
5. [ ] Update any wiki/confluence links to documentation

---

**Verification Complete:** ___________  
**Verified By:** Chris  
**Date:** 2026-07-02  
**Time to Complete:** ~90 minutes  

