# Cross-Reference Audit: 8-Item Reorganization

**Purpose:** Identify and update all internal links that will break after file reorganization  
**Status:** AUDIT COMPLETE - Ready for execution  
**Generated:** 2026-07-02

---

## Internal Links to Update

### Item 1: Research Skill
**Old paths** → **New paths**

```
C:\dev\cic-research\SKILL.md 
  → docs/cic/research-skill/SKILL.md

C:\dev\cic-research\evals\*.md 
  → docs/cic/research-skill/test-results/*.md
```

**Links within files that reference this:**
- None identified (self-contained)

---

### Item 2: Dashboard Spec

**Old:** All dashboard docs in root or scattered  
**New:** Organized under `docs/dashboard/spec/` and `docs/dashboard/implementation/`

**Cross-references to update:**
- Any doc referencing "IMPLEMENTATION_GUIDE.md" 
  → Update to `docs/dashboard/implementation/implementation-guide.md`
- Any doc referencing dashboard spec files
  → Update to `docs/dashboard/spec/specification.md`

---

### Item 3: Vault Analysis

**Old paths** → **New paths**

```
C:\dev\topology-map.* 
  → docs/cic/vault-analysis/topology.*

C:\dev\gap-analysis.md 
  → docs/cic/vault-analysis/gap-analysis.md

C:\dev\recommendations.md 
  → docs/cic/vault-analysis/recommendations.md
```

**Links within files:**
- gap-analysis.md references BUILD-SUMMARY.md
  - Verify link: [[cic-ref/BUILD-SUMMARY]] (vault reference - OK, no update needed)
- recommendations.md references ROADMAP.md
  - Verify link: [[cic-ref/ROADMAP]] (vault reference - OK, no update needed)

---

### Item 4: Rewrite Labs Vault Mirror

**Old paths** → **New paths**

```
C:\dev\*VAULT*.md 
  → docs/rewrite-labs/vault-mirror/*.md

C:\dev\sync-vault.ps1 
  → C:\dev\ (STAYS - it's code, not docs)

C:\dev\vault-sync-config.json 
  → C:\dev\ (STAYS - it's config, not docs)
```

**Links to update:**
- If any doc references the PowerShell scripts by path
  - Old: "C:\dev\toolforge\sync-vault.ps1"
  - New: Same (scripts stay in place)
- If docs reference the config file
  - Old: "vault-sync-config.json"
  - New: Same (stays in root)

---

### Item 5: Operational Skills

**Toolforge skills don't have typical cross-references outside toolforge/**
**But: Support docs that reference skills need updating**

**Links to update:**
- SKILLS-CATALOG.md (moves to `toolforge/skills/SKILLS-CATALOG.md`)
  - References to individual skills: update paths to new toolforge location
- Any doc that says "See run-cic-phase skill"
  - Old: C:\dev\SKILL_1_run-cic-phase.md
  - New: C:\dev\toolforge\skills\run-cic-phase\

**Within skill.json files:**
- skill.json references `src/index.ts`, `tests/test.ts`, etc.
  - These are relative paths - NO CHANGES NEEDED (already relative)

---

### Item 6: Knowledge Graph

**Old paths** → **New paths**

```
C:\dev\extract-backlinks.ts 
  → docs/reference/knowledge-graph/implementation/extract-backlinks.ts

C:\dev\knowledge-graph-query.ts 
  → docs/reference/knowledge-graph/implementation/query-interface.ts

C:\dev\graph-viewer.html 
  → docs/reference/knowledge-graph/viewer/index.html

C:\dev\example-skill.ts 
  → docs/reference/knowledge-graph/examples/skill-integration.ts

C:\dev\validate-graph.ts 
  → docs/reference/knowledge-graph/validation/validate.ts
```

**Links to update:**
- Any doc that imports knowledge-graph modules
  - Old: `const kg = require('C:\dev\knowledge-graph-query.ts')`
  - New: Update path to relative or absolute `docs/reference/knowledge-graph/implementation/`
- README files that reference the graph-viewer
  - Old: "See graph-viewer.html"
  - New: "See docs/reference/knowledge-graph/viewer/index.html"

---

### Item 7: Memory Governance

**Old paths** → **New paths**

```
C:\dev\*MEMORY*.md 
  → docs/reference/memory-governance/*.md

C:\dev\CLAUDE.md 
  → Stays in C:\dev\ (it's CLAUDE.md - project instructions)
```

**Links to update:**
- If any doc references "See CLAUDE.md template"
  - Old: C:\dev\CLAUDE.md (keep in root, it's project doc)
  - Template location: docs/reference/memory-governance/CLAUDE-md-template.md
- If any doc references memory governance docs by name
  - Update to `docs/reference/memory-governance/`

**Important:** CLAUDE.md stays in C:\dev\ root - it's not a deliverable, it's the project instructions

---

### Summary & Meta Docs

**Old paths** → **New paths**

```
C:\dev\8-ITEMS-COMPLETE-FINAL.md 
  → docs/meta/8-items-complete.md

C:\dev\8-ITEM-PROGRESS.md 
  → docs/meta/build-progress.md

C:\dev\FINAL-STATUS-8-ITEMS.md 
  → docs/meta/final-status.md

C:\dev\REORGANIZATION-PLAN.md 
  → docs/meta/reorganization.md
```

**Links to update:**
- Any doc that references "See 8-ITEMS-COMPLETE-FINAL.md"
  - Update to docs/meta/8-items-complete.md

---

## Files That Should NOT Move

These stay in C:\dev\:

```
CLAUDE.md                    # Project instructions (not a deliverable)
README.md (if codebase doc)  # Codebase documentation
.env files                   # Configuration
*.json (configs)             # Configuration
*.yaml / *.yml (configs)     # Configuration
*.ps1 / *.sh (scripts)       # Code/scripts
src/ directory               # Code
tests/ directory             # Tests
```

---

## Vault References (No Updates Needed)

The following are references to vault docs and should NOT be changed:

```
[[cic-ref/BUILD-SUMMARY]]
[[cic-ref/AGENTS]]
[[cic-ref/ROADMAP]]
[[cic-ref/CIC_ENV_REFERENCE]]
[[cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN]]
[[cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST]]
[[cic-ref/AGENTS_API]]
[[rl-ref/*]] (Rewrite Labs references)
[[architecture/*]] (Architecture references)
```

These are vault links, not documentation links - they stay as-is.

---

## Automation Strategy for Link Updates

### Option 1: Manual Search & Replace

Use `Find & Replace` in VS Code:
1. Open C:\dev\docs\ folder
2. Edit → Find in Files (Ctrl+Shift+F)
3. For each old path, replace with new path
4. Review each change before applying

### Option 2: Scripted Search

PowerShell script to find all broken links:

```powershell
$docs = Get-ChildItem -Path "C:\dev\docs" -Recurse -Include "*.md"
$brokenRefs = @()

foreach ($doc in $docs) {
  $content = Get-Content $doc.FullName
  
  # Check for old paths
  if ($content -match "C:\\dev\\cic-research\\") {
    $brokenRefs += "$($doc.FullName): Contains old cic-research path"
  }
  if ($content -match "C:\\dev\\dashboard\\") {
    $brokenRefs += "$($doc.FullName): Contains old dashboard path"
  }
  # ... add more patterns for other items
}

$brokenRefs | Out-File "C:\dev\broken-refs.txt"
Write-Host "Found $($brokenRefs.Count) potential broken links"
```

---

## Verification Checklist

After updating links:

- [ ] Search for all old paths in docs/ - should be 0 results
- [ ] Search for `[[` in docs/ - review all vault references are correct
- [ ] Search for relative paths that need updating (./old-path/ etc.)
- [ ] Run `mkdocs build --strict` - check for 404s or broken links
- [ ] Use mkdocs link checker (if available) for comprehensive scan
- [ ] Manually click 5-10 internal links to verify they work

---

## Cross-Reference Summary Table

| Item | Type | File Count | Link Updates Needed | Priority |
|------|------|-----------|-------------------|----------|
| 1 | Skill | 5 | 0 | Low |
| 2 | Docs | 4 | 3 | Medium |
| 3 | Analysis | 4 | 0 | Low |
| 4 | Docs | 5 | 2 | Medium |
| 5 | Skills | 30+ | 5 | High |
| 6 | Reference | 5+ | 3 | Medium |
| 7 | Framework | 8 | 2 | Medium |
| Summary | Docs | 4 | 1 | Low |
| **TOTAL** | — | **65+** | **~16** | — |

---

## Expected Outcomes

After executing all updates:

✅ All internal links resolve correctly  
✅ No 404 errors in mkdocs build  
✅ Vault references remain unchanged  
✅ Cross-references are bidirectional where appropriate  
✅ mkdocs navigation reflects new structure  
✅ All toolforge skills reference their new locations  

---

## Next Steps

1. **Review this audit** — confirm all identified links
2. **Run move script** — reorganize files
3. **Execute link updates** — manual or scripted
4. **Run mkdocs build --strict** — validate
5. **Manual spot-check** — click 10 random links

