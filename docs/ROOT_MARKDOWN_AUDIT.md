# Root-Level Markdown Audit — Files to Relocate

**Audit date:** 2026-07-01  
**Total files at root:** 96 markdown files  
**Status:** ❌ Major mkdocs structure violation

---

## Summary

MkDocs projects should **NOT** have 96 markdown files at the repo root. These should be:
- Organized into `docs/` subdirectories per type
- Indexed in `mkdocs.yml` nav section
- Moved or archived per the structure map

---

## Files by Category & Recommended Location

### Documentation (Should be in `docs/`)
**Count:** ~60 files  
**Action:** Move to appropriate docs/ subfolder

| File | Current | Recommended | Reason |
|------|---------|-------------|--------|
| CLAUDE.md | Root | Skip/Archive | Project instructions (keep at root, not docs) |
| README.md | Root | Keep at root | Standard git repo convention |
| BUILD-SUMMARY.md | Root | `docs/reference/` | Build/deployment reference |
| BUILD-SUMMARY.md | Root | `docs/reference/build-summary.md` | Lookup table |
| DEPLOYMENT.md | Root | `docs/operations/deployment.md` | Operations guide |
| DEPLOYMENT_FIXES_COMPLETED.md | Root | `docs/reference/` | Completion report |
| DOCKER-QUICKSTART.md | Root | `docs/quickstart/docker.md` | Setup guide |
| DOCKER-BUILD-SUMMARY.md | Root | `docs/reference/docker-build.md` | Reference |
| DOCKER.md | Root | `docs/operations/docker-setup.md` | Operations |
| GITHUB-ACTIONS-PROCESS.md | Root | `docs/operations/ci-cd.md` | Operations/CI guide |
| GOVERNANCE.md | Root | `docs/reference/governance.md` | Governance reference |
| INTEGRATION_GUIDE.md | Root | `docs/implementation/integration.md` | Implementation guide |
| CIC_MAAL_AUDIT_OVERVIEW.md | Root | `docs/architecture/cic-maal-audit.md` | Architecture deep-dive |
| CIC_ENV_REFERENCE.md | Root | `docs/reference/environment.md` | Environment reference (merge) |
| TORQUEQUERY_BUILD_SUMMARY.md | Root | `docs/reference/torquequery.md` | TorqueQuery reference |
| TORQUEQUERY_QUICKSTART.md | Root | `docs/quickstart/torquequery.md` | TorqueQuery setup |

### Project Planning/Status (Should be in `docs/reference/` or archived)
**Count:** ~25 files  
**Action:** Archive to `archive/` or consolidate into reference

| File | Status | Action |
|------|--------|--------|
| PHASE_*.md | Historical | Archive to `docs/archive/phases/` |
| PHASE-*.md | Historical | Archive to `docs/archive/phases/` |
| PLAN*.md | Historical | Archive to `docs/archive/plans/` |
| *_COMPLETION_REPORT.md | Historical | Archive to `docs/archive/completions/` |
| *_PROGRESS.md | Status snapshot | Archive |
| SANDBOX_*.md | Status snapshot | Archive |
| SESSION_*.md | Session notes | Archive |

### Reviews/Analysis (Archive only, not documentation)
**Count:** ~10 files  
**Action:** Archive to `archive/reviews/`

| File | Type |
|------|------|
| GIT-REVIEW.md | Git review |
| REVIEW.md | Generic review |
| REVIEW-28a*.md | Numbered reviews |
| *-REVIEW.md | Various reviews |
| competitive-teardown-REVIEW.md | Market analysis |
| vscode-integration-REVIEW.md | Integration review |

### Temporary/Session Files (Delete or archive)
**Count:** ~5 files  
**Action:** Archive to `archive/temp/`

| File | Type |
|------|------|
| 2026-06-27.md | Session date |
| task.md | Ad-hoc task |
| TEST.md | Temporary test |
| walkthrough.md | Session walkthrough |
| SYNC_ANALYSIS.md | Sync analysis |

---

## Consolidated Move Plan

### Phase 1: Quick Relocations (Docs)
```bash
# Quickstart guides
mv DOCKER-QUICKSTART.md → docs/quickstart/docker.md
mv TORQUEQUERY_QUICKSTART.md → docs/quickstart/torquequery.md

# Operations
mv DEPLOYMENT.md → docs/operations/deployment.md
mv DOCKER.md → docs/operations/docker-setup.md
mv GITHUB-ACTIONS-PROCESS.md → docs/operations/ci-cd.md

# Reference
mv BUILD-SUMMARY.md → docs/reference/build-summary.md
mv GOVERNANCE.md → docs/reference/governance.md
mv TORQUEQUERY_BUILD_SUMMARY.md → docs/reference/torquequery-build.md
mv TORQUEQUERY_MCP_REFERENCE.md → docs/reference/torquequery-api.md

# Implementation
mv INTEGRATION_GUIDE.md → docs/implementation/integration.md
mv CIC_TOKEN_PACK*.md → docs/implementation/token-pack.md (consolidate)

# Architecture
mv cic_maal_audit_overview.md → docs/architecture/cic-maal-audit.md
mv CIC_RUNTIME_OBSERVABILITY_PLAN.md → docs/architecture/observability.md
```

### Phase 2: Archive Historical Files
```bash
mkdir -p archive/phases archive/plans archive/completions archive/reviews archive/temp

# Archive all PHASE_*.md and PHASE-*.md
mv PHASE*.md → archive/phases/

# Archive all PLAN*.md
mv PLAN*.md → archive/plans/

# Archive completion reports
mv *_COMPLETION_REPORT.md → archive/completions/
mv *_COMPLETION.md → archive/completions/

# Archive reviews
mv *-REVIEW.md → archive/reviews/
mv REVIEW*.md → archive/reviews/

# Archive session/temp files
mv 2026-*.md → archive/temp/
mv task.md → archive/temp/
mv TEST.md → archive/temp/
mv SYNC_ANALYSIS.md → archive/temp/
```

### Phase 3: Consolidation
```
Merge similar files:
- CIC_ENV_REFERENCE.md + docs/reference/environment.md
- TORQUEQUERY_*.md → single torquequery.md with sections
- CIC_TOKEN_PACK_*.md → single token-pack.md
```

---

## Files That Should Stay at Root

```
README.md                   (standard git convention)
CLAUDE.md                   (project instructions, not docs)
CLAUDE.original.md          (backup)
LICENSE.md                  (if applicable)
CONTRIBUTING.md             (if applicable)
.github/                    (workflows, issue templates)
```

---

## Result After Cleanup

### Root-level files: **~5–10** (instead of 96)
```
c:\dev\
├── README.md              ✓ Standard
├── CLAUDE.md              ✓ Project instructions
├── LICENSE.md             ✓ Legal
├── CONTRIBUTING.md        ✓ Contribution guide
└── docs/                  ✓ Organized by type
    ├── quickstart/
    ├── architecture/
    ├── gateway/
    ├── cic/
    ├── dashboard/
    ├── tests/
    ├── batches/
    ├── api/
    ├── operations/
    ├── implementation/    (NEW)
    ├── reference/
    └── archive/           (NEW — historical files)
```

---

## MkDocs Compliance

✓ All documentation discoverable via nav  
✓ No stray markdown at root  
✓ Clear folder taxonomy  
✓ Future docs placed correctly by default  
✓ Historical files archived, not cluttering

---

## Next Steps

1. Create `docs/archive/` directory structure
2. Run Phase 1 moves (docs relocations)
3. Run Phase 2 moves (archive historical)
4. Run Phase 3 consolidations (merge similar files)
5. Verify `mkdocs build` succeeds
6. Update this audit to "COMPLETE"

---

**Estimated effort:** 30 minutes  
**Risk level:** Low (file moves, no code changes)  
**Blocking:** None (can proceed with development, archive cleanup can follow)
