---
title: "Knowledge Base Operations Runbook"
description: "Query, edit, and consolidation workflows for the consolidated KB operational model"
created: "2026-07-07"
canonical: true
tags:
  - operations
  - knowledge-base
  - consolidation
  - runbook
---

# Knowledge Base Operations Runbook

**Operator-grade guide for querying, editing, and maintaining the consolidated knowledge base.**

---

## Section 1: Query Pattern

### Finding Information (Start Here)

**Workflow:** User search → index-unified.md → reference/ layer or implementation spec

**Step 1: Start at the Index**
1. Open `C:\dev\docs\index-unified.md`
2. Use Ctrl+F to search for your topic
3. Index provides high-level overview + links to detailed docs

**Step 2: Follow to Reference Layer**
- If looking for **definitions or frameworks** → navigate to `docs/reference/`
  - Example: "How do I configure logging?" → index → [Configuration & Logging Standards](reference/configuration-logging.md)
- If looking for **implementation details** → navigate to `docs/item-N-*.md`
  - Example: "How does the skill generator pipeline work?" → index → [item-5-skill-generator.md](item-5-skill-generator.md)

**Step 3: Use Backlinks for Context**
- Reference docs include "See also:" sections with backlinks
- Follow backlinks to see where the framework is used
- Example trail:
  ```
  Search: "phase lifecycle"
  ↓
  Found in: reference/pipeline-architecture.md
  ↓
  See also: item-5-skill-generator.md, item-6-knowledge-graph.md, ROADMAP.md
  ↓
  Read backlinks to understand implementation context
  ```

### Query Patterns by Role

| Role | Starting Point | Typical Navigation |
|------|---|---|
| **Operations** | index-unified.md → Configuration | reference/configuration-logging.md + CIC_ENV_REFERENCE.md |
| **Skill Dev** | index-unified.md → Skill Framework | reference/skill-framework.md → item-5-skill-generator.md |
| **Architecture** | index-unified.md → CIC Architecture | reference/pipeline-architecture.md → item-6-knowledge-graph.md |
| **Dashboard** | index-unified.md → Observability | item-2-observability-dashboard-spec.md → reference/configuration-logging.md |
| **Governance** | This file (KB-OPERATIONS.md) | CLAUDE.md → Consolidation Status |

---

## Section 2: Add New Content

### When to Create Reference Docs

**Create a reference doc when:**
- Same framework appears in 3+ files
- Framework is shared across multiple items
- Content is stable (low churn expected)
- Multiple teams need the same definition

**Example:** Configuration management was duplicated in item-2, item-5, and CIC_ENV_REFERENCE → extracted to `reference/configuration-logging.md`

### When to Add Implementation Specs

**Create implementation spec when:**
- Documenting a specific roadmap item (item-1 through item-8)
- Spec is detailed, feature-specific, or a single feature doc
- Doc won't be referenced from multiple other docs
- Implementation team owns the change

**Example:** Skill Generator spec lives in `item-5-skill-generator.md` (implementation-focused)

### Template for Reference Doc

Create new reference doc using this structure:

```markdown
---
title: "Topic Framework Name"
description: "Short description of shared framework"
created: "2026-07-07"
updated: "2026-07-07"
canonical: true
tags:
  - topic
  - framework
  - reference
backlinks:
  - docs/item-N-filename.md (Description of use case)
  - docs/item-M-filename.md (Description of use case)
---

# Topic Framework

**One-line summary:** What problem does this framework solve?

---

## Overview

Brief introduction. Link to backlinks for implementation context.

---

## Core Concepts

Main definitions and terminology. Use consistent language across all backlinked docs.

---

## [Subsection 1]

Detailed content.

---

## Troubleshooting

Common issues and solutions.

---

## See Also

- [item-N](../item-N-filename.md) — Implementation use case
- [CLAUDE.md](../../CLAUDE.md) — KB operational model
```

### Checklist: Add New Content

- [ ] **New reference doc created** in `docs/reference/` with proper frontmatter
- [ ] **Backlinks added** — frontmatter includes all source files
- [ ] **index-unified.md updated** — new doc referenced in navigation
- [ ] **Cross-references verified** — all links point to valid files
- [ ] **Markdown validated** — run `mkdocs build --strict` (no errors)
- [ ] **No broken links** — grep for old paths in docs/ (should return 0 results)
- [ ] **Tags added** — frontmatter includes `tags:` array with 3-5 keywords

---

## Section 3: Edit Existing Content

### Rules for Editing Reference Docs

**Backward Compatibility:**
- Preserve all section headers (backlinks depend on them)
- Don't remove content (mark as deprecated if needed)
- Update "See also:" sections if new backlinks added
- Update `updated:` timestamp in frontmatter

**Preserve Backlinks:**
- Before renaming or moving a reference doc, check index-unified.md + all backlinked item files
- Update all references to the doc
- Run mkdocs build --strict to verify links work

**Change Protocol:**
```
1. Edit content in reference doc
2. Update timestamp: updated: "2026-07-07"
3. Check all backlinked files still reference correctly
4. Run: mkdocs build --strict
5. If links broke: grep -r "old-path" docs/
6. Update all references found
7. Verify again
```

### Rules for Editing Implementation Specs

**Item Files (item-1 through item-8):**
- May add new content freely (implementation evolves)
- If referencing a reference doc, update frontmatter `backlinks:` field
- If merging with another spec, add "canonical: false" marker
- Update timestamp when significant changes made

**Deprecation Process:**
```yaml
# Mark doc as superseded:
canonical: false
deprecated: "2026-07-07"
replaced_by: "new-doc-name.md"
```

---

## Section 4: Consolidation Workflow

### Identify Consolidation Candidates

**Trigger:** Same topic appears in 3+ docs with 0.75+ similarity

**Steps:**
1. Search `cic-os/personal-knowledge-base/wiki/2-merge-candidates-review.md` (analysis layer)
2. Find high-similarity pairs (0.75+)
3. Group by topic cluster (e.g., config + logging)
4. Estimate deduplication impact

### Create Reference Doc from Duplicates

**Process:**

**Step 1: Analyze Source Docs**
```
Example: "Configuration" appears in:
  - item-2-observability-dashboard-spec.md (Logging Standards section)
  - item-5-skill-generator.md (Config validation section)
  - CIC_ENV_REFERENCE.md (Environment variables section)
→ Similarity: 78-85% (consolidate)
```

**Step 2: Extract Common Sections**
```markdown
# New doc: reference/configuration-logging.md

## Configuration Principles
(from item-5 + CIC_ENV_REFERENCE)

## Logging Standards
(from item-2 + item-5)

## Validation Rules
(from CIC_ENV_REFERENCE + item-5)

## See Also
- item-2-observability-dashboard-spec.md
- item-5-skill-generator.md
- CIC_ENV_REFERENCE.md
```

**Step 3: Update Source Docs**
- Add backlink in frontmatter pointing to new reference doc
- Remove duplicate sections from source docs
- Add cross-reference: "See [Configuration & Logging Standards](reference/configuration-logging.md)"

**Step 4: Update index-unified.md**
- Add reference doc to "Reference Documentation" section
- Update cross-reference map
- Link from related item sections

**Step 5: Verify**
```bash
# Run validation
mkdocs build --strict

# Check no broken links
grep -r "reference/configuration-logging.md" docs/
# Should return: cross-references found, no 404s
```

### Consolidation Success Criteria

✅ **New reference doc created** with complete content  
✅ **Duplicate pairs eliminated** (0 remaining copies)  
✅ **Backlinks preserved** in all source docs  
✅ **index-unified.md updated** with new navigation  
✅ **No broken links** in cross-references  
✅ **mkdocs build --strict passes** without errors

---

## Section 5: Validation Checklist

### After Every Edit

| Check | Command | Expected Result |
|-------|---------|-----------------|
| No orphaned .md files | `ls C:\dev\*.md \| grep -v CLAUDE.md \| grep -v README.md` | 0 results |
| mkdocs validates | `mkdocs build --strict` | No errors |
| Backlinks resolve | `grep -r "\[.*\](../reference/" docs/` | All paths valid |
| index-unified.md updated | Open index-unified.md | New content referenced |
| Cross-references bidirectional | Check "See Also" sections | Links point both ways |

### Link Validation Script

```bash
# Find all markdown links in docs/
for file in docs/**/*.md; do
  while IFS= read -r line; do
    if [[ $line =~ \]\(([^)]+)\) ]]; then
      path="${BASH_REMATCH[1]}"
      if [[ ! $path =~ ^http ]]; then  # Skip external links
        # Resolve relative path
        resolved_path=$(dirname "$file")/"$path"
        if [[ ! -f "$resolved_path" ]]; then
          echo "BROKEN: $file → $path"
        fi
      fi
    fi
  done < "$file"
done
```

### Before Shipping

**Checklist:**
- [ ] All new reference docs have frontmatter with `canonical: true`
- [ ] All source docs updated with backlinks
- [ ] index-unified.md "See Also:" sections added
- [ ] No duplicate content between reference + source docs
- [ ] All links verified (mkdocs build --strict)
- [ ] CLAUDE.md updated if new KB rules added
- [ ] Timestamp updated in all modified files

---

## Section 6: Troubleshooting

### Broken Link? → Check File Path

**Error:** "404: [reference/config-logging.md](reference/config-logging.md) not found"

**Solution:**
1. Open `C:\dev\docs\reference\` in explorer
2. Verify exact filename matches (e.g., `configuration-logging.md` not `config-logging.md`)
3. Check relative path syntax:
   - Same folder: `[link](other-file.md)`
   - Up one level: `[link](../other-file.md)`
   - Nested folders: `[link](../reference/file.md)`
4. Update link in source doc
5. Run `mkdocs build --strict` to verify

### Can't Find Topic? → Start at index-unified.md

**Problem:** "I'm looking for information about [topic] but don't know where it is"

**Solution:**
1. Open `C:\dev\docs\index-unified.md`
2. Ctrl+F search for topic (e.g., "phase", "logging", "skill")
3. If found: click link to relevant section
4. If not found: check "How to Use This Index" section
5. If still not found: topic may be archived (check cic-os/personal-knowledge-base/wiki/)

### Duplicate Content Exists? → Use Consolidation Workflow

**Problem:** "Configuration standards are documented in 3 files with almost identical content"

**Solution:**
1. Follow "Section 4: Consolidation Workflow" above
2. Create reference doc extracting common content
3. Update source docs with cross-references + backlinks
4. Verify with mkdocs build --strict
5. Run link validation to confirm no duplicates remain

### merge-candidates Report Outdated? → It Analyzes wiki/, Not docs/

**Problem:** "merge-candidates-review.md shows 2,847 pairs, but I only see 3 in docs/"

**Explanation:**
- `merge-candidates-review.md` is **historical analysis layer** (analyzes all content)
- `docs/` is **operational layer** (actively maintained)
- Phase 1 consolidation processed ~1,320 pairs → 3 reference docs created
- Phase 2 hard-linked ~412 pairs → bidirectional cross-references added
- Remaining pairs in merge-candidates are either:
  - Low-priority (0.50-0.75 similarity)
  - Already consolidated through backlinks (not merged)
  - Archived content (still in wiki/, not in docs/)

**To regenerate analysis:**
- Run `python3 C:\dev\cic-os\personal-knowledge-base\sync.py`
- Re-analyze merge candidates (may show updated pair counts)
- Do NOT overwrite docs/ with analysis results

---

## Section 7: Common Workflows

### Workflow A: Add a New Framework Doc

**Trigger:** "I need to document a shared pattern used across 3+ files"

**Steps:**
1. Create reference doc in `docs/reference/` with template (Section 2)
2. Extract common content from source files
3. Update source docs: add frontmatter backlinks + "See also:" cross-references
4. Update `docs/index-unified.md` to reference new doc
5. Run `mkdocs build --strict`
6. Verify no broken links (grep -r)
7. Commit with message: "docs: add reference/{topic}.md framework"

**Time estimate:** 1-2 hours per framework doc

### Workflow B: Update Configuration Standards

**Trigger:** "Configuration validation rules changed, need to update KB"

**Steps:**
1. Open `docs/reference/configuration-logging.md`
2. Update "Configuration Principles" section
3. Update timestamp in frontmatter
4. Update `docs/index-unified.md` cross-reference if scope changed
5. Check backlinks: do item files need updates? (grep -r "configuration")
6. Run `mkdocs build --strict`
7. Commit with message: "docs(config): update validation rules"

**Time estimate:** 15-30 minutes

### Workflow C: Fix Broken Link

**Trigger:** "mkdocs build --strict returned link error"

**Steps:**
1. Note the file and line number from error
2. Open file and find broken link
3. Check target file path (is it correct? does file exist?)
4. Update link to correct relative path
5. Re-run `mkdocs build --strict`
6. Commit with message: "docs: fix broken link in [file]"

**Time estimate:** 5-10 minutes

### Workflow D: Migrate Old Doc to Reference Layer

**Trigger:** "docs/meta/00-index.md has content that should be in reference/"

**Steps:**
1. Read old doc and identify sections worth preserving
2. Create new reference doc in `docs/reference/` with that content
3. Add "See also:" backlinks to reference doc
4. Update `docs/index-unified.md` to link to new doc instead of old
5. Mark old doc as deprecated (add `canonical: false`, `replaced_by:` fields)
6. Run `mkdocs build --strict`
7. Commit with message: "docs: migrate [topic] to reference layer"

**Time estimate:** 30-60 minutes

---

## Frontmatter Reference

### For Reference Docs

```yaml
---
title: "Display Name of Framework"
description: "One-line description of what this framework covers"
created: "2026-07-07"
updated: "2026-07-07"
canonical: true
tags:
  - topic
  - framework
  - reference
backlinks:
  - docs/item-2-observability-dashboard-spec.md (Use case description)
  - docs/item-5-skill-generator.md (Use case description)
---
```

### For Item/Implementation Docs

```yaml
---
title: "Item N: Feature Name"
description: "What this item delivers"
created: "2026-07-07"
updated: "2026-07-07"
canonical: false
tags:
  - roadmap
  - item-n
  - feature
backlinks:
  - docs/index-unified.md (Roadmap navigation)
  - docs/reference/skill-framework.md (Framework definitions)
---
```

### For Deprecated Docs

```yaml
---
title: "[DEPRECATED] Old Doc Name"
description: "Why this is deprecated"
created: "2026-06-01"
deprecated: "2026-07-07"
replaced_by: "reference/new-doc-name.md"
canonical: false
---
```

---

## Success Criteria

**KB Operations are working well when:**

✅ New user can find information in <5 minutes (via index-unified.md)  
✅ Operator can edit reference doc and backlinks stay intact  
✅ `mkdocs build --strict` passes with zero errors  
✅ Consolidation candidates identified and processed in phases  
✅ No orphaned .md files in `C:\dev\` root  
✅ Cross-references are bidirectional (link both ways)  
✅ No duplicate sections between reference + source docs  
✅ CLAUDE.md stays current with KB operational rules

---

## Questions & Support

### "How do I [task]?"
→ Search this file for "[task]" or check the Common Workflows section

### "Which doc should I edit?"
→ Is it a shared framework or definition? → `docs/reference/`  
→ Is it a specific roadmap item or feature? → `docs/item-N-*.md`  
→ Is it system overview or planning? → `cic-ref/` or OneDrive/Drive living docs

### "Report a broken link"
→ File issue with: file path, line number, broken link path, expected target

### "Suggest a new reference doc"
→ Check merge-candidates-review.md for consolidation candidates  
→ Follow Section 4 (Consolidation Workflow) to propose and create

---

## References

- **Consolidation Status:** See CLAUDE.md "Knowledge Base Operational Model" section
- **Phase 1 Results:** docs/consolidation-report.md
- **Phase 2 Results:** docs/phase-2-consolidation-report.md
- **Navigation Hub:** docs/index-unified.md
- **Validation Config:** mkdocs.yml (site config + nav structure)

---

**Last updated:** 2026-07-07  
**Phase 1 & 2 Complete** — Authoritative layer: docs/  
**Next:** Phase 3+ consolidation (High tier pairs, 0.70-0.89 similarity)

---

## Checklists

### Pre-Commit Validation

```
Before committing KB changes:

□ No new .md files in C:\dev\ root (except CLAUDE.md, README.md)
□ mkdocs build --strict passes (run in terminal)
□ All new links verified (click or grep test)
□ Frontmatter valid YAML (no syntax errors)
□ Timestamp updated in modified files
□ Backlinks added to/from reference docs
□ index-unified.md updated if scope changed
□ No duplicate content vs. reference layer
□ Commit message includes [docs] prefix
```

### New Reference Doc Checklist

```
Before creating new reference doc:

□ Topic appears in 3+ files (consolidation candidate)
□ Extracted content is stable (low churn expected)
□ No better home in existing reference docs
□ Have identified all source files to backlink

When creating:

□ File placed in C:\dev\docs\reference/
□ Frontmatter complete (title, description, tags, backlinks)
□ "See also:" section with all backlinks
□ Filename lowercase-with-hyphens.md
□ Content organized into clear sections
□ Examples provided for each major topic

After creation:

□ index-unified.md updated with link
□ All source docs updated with backlinks
□ mkdocs build --strict passes
□ Links verified (grep + manual check)
□ CLAUDE.md KB rules checked (if new pattern)
```

---

**For emergency issues:** Check Troubleshooting section or revert to last known-good git commit.
