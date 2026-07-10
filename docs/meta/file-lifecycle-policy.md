# File Lifecycle Policy

**Governance:** CLAUDE.md §1–12 + Repository Policy Audit Plan  
**Version:** 1.0.0  
**Updated:** 2026-07-09  
**Status:** Active

---

## Policy Statement

All files in the repository must follow a defined lifecycle: creation → use → archival (or deletion). Files without explicit retention rationale shall be archived or deleted after 90 days of inactivity.

---

## File Stages

### Stage 1: Creation
**Criteria:** File is created for active use (feature, bug fix, documentation, operational task)

**Required:**
- Purpose documented in file header or commit message
- Ownership assigned (CLAUDE.md §2 or owner comment)
- Destination directory correct per OWNERSHIP_MATRIX.md
- Naming follows NAMING_STANDARD.md (lowercase-with-hyphens)

**Example:**
```markdown
# Phase 27 Wave G Telemetry
**Owner:** CIC Governance  
**Purpose:** Multi-wave aggregation telemetry for Phase 27 completion  
**Retention:** 90 days from completion (archive to docs/archive/phases/)  
**Created:** 2026-07-01
```

---

### Stage 2: Active Use
**Duration:** Indefinite (until no longer needed)

**Criteria:**
- File is referenced in active code/tests
- File is updated at least once per 90 days OR marked as stable with explicit 1-year+ retention
- File is discoverable via mkdocs nav (if documentation)
- File has clear ownership

**Governance:**
- Stable system docs (CLAUDE.md, architecture.md): **1-year+ retention**
- Active feature/bug docs (PHASE_*.md, incident reports): **90-day review cycle**
- Session logs, research artifacts: **30-day inactivity → archive**

---

### Stage 3: Archival
**Trigger:** File reaches end-of-life but has historical/reference value

**Criteria:**
- No changes in 90 days (for active-use docs) OR completion of phase/project
- Stakeholder confirms archival is safe
- File moved to `docs/archive/{category}/{filename}`
- Original location replaced with redirect comment (optional)

**Archive Categories:**
```
docs/archive/
├── phases/          # Completed phase documentation
├── research/        # Historical research/exploration
├── incidents/       # Resolved incident reports
├── projects/        # Archived projects (castironforge, old experiments)
└── sessions/        # Session completion summaries
```

**Archival Metadata:**
```markdown
<!-- ARCHIVED 2026-07-09 -->
<!-- Category: phases -->
<!-- Reason: Phase 27 complete; historical reference only -->
<!-- Retention: 2-year archive window -->
<!-- See also: [Phase 28 Status](../phases/phase-28-status.md) -->
```

---

### Stage 4: Deletion
**Trigger:** File no longer has research, historical, or reference value

**Criteria:**
- Archived for ≥1 year (unless explicitly temporary)
- Stakeholder confirms deletion is safe (not needed for audit trail, compliance)
- Not referenced in active code/docs
- Commit message documents reason + date of archival

**Safe-to-Delete Categories:**
- Local build artifacts (gitignored: CIP/, dist/, build/, .next/)
- Stale backups (CLAUDE.original.md, config-backup/, etc.)
- Duplicate/orphaned files (duplicated CLAUDE.md, deprecated skill versions)
- Session scratch files (temporary exploration, proof-of-concept)

**Unsafe-to-Delete Categories:**
- Audit trail docs (incident reports, approval manifests)
- Compliance docs (security policies, access logs)
- Historical roadmaps (used for phase audits, re-planning)
- Dependencies (referenced in active code)

---

## Review Cycle

### Monthly Review
**Owned by:** CIC Governance (cic/governance-pipeline)

**Tasks:**
1. Scan for files > 90 days inactive: `lifecycle-check.ps1`
2. Flag archive candidates in ARCHIVE_CANDIDATES.md
3. Notify owners; solicit retention rationale
4. Move approved archives to docs/archive/

### Quarterly Audit
**Owned by:** CIC Governance

**Tasks:**
1. Validate mkdocs nav references all active docs
2. Identify orphaned files (not in nav, not in archive)
3. Check for policy violations (wrong dir, bad naming, missing ownership)
4. Generate COMPLIANCE_REPORT.md

---

## Policies by Category

### SYSTEM Docs (stable)
**Location:** `docs/{category}/`  
**Retention:** 1+ years (unless superseded)  
**Update Cycle:** Infrequently (quarterly or on major arch change)  
**Archival:** Move to `docs/archive/{category}/` if superseded

**Examples:**
- docs/pipeline-architecture.md
- docs/cic/governance-pipeline.md
- docs/skills/skill-framework.md

---

### STATE Docs (volatile)
**Location:** `docs/meta/`  
**Retention:** 90 days from last update  
**Update Cycle:** Frequently (daily/weekly)  
**Archival:** Move to `docs/archive/sessions/` after 90 days

**Examples:**
- docs/meta/cic-ashfall-state.md
- docs/meta/cic-deployment-status.md

---

### Living Docs (external authority)
**Location:** OneDrive/Drive (not in git)  
**Retention:** Managed by external owner  
**Rule:** Never inline Living Docs into CLAUDE.md; always link

---

### Session/Phase Logs
**Location:** Temporary: `docs/sessions/{date}-{title}.md` or orphaned dir  
**Retention:** 90 days from completion  
**Archival:** Move to `docs/archive/phases/{phase-num}-{title}.md`

**Examples:**
- cic-ingestion/PHASE_27_INTEGRATION.md → docs/archive/phases/phase-27-integration.md
- rewrite-mcp/PHASE_44.3_COMPLETION_SUMMARY.md → docs/archive/phases/phase-44-3-completion.md

---

### Research/Exploration Docs
**Location:** Orphaned: cic-research/, charlie-deep-research/, etc.  
**Retention:** 90 days from completion (or explicit "retain for reference" header)  
**Archival:** Move to `docs/archive/research/{topic}.md`

**Examples:**
- charlie-deep-research/ → docs/archive/research/deep-research-2026-q2/
- cic-research/ → docs/archive/research/cic-runtime-analysis/

---

## Enforcement

### Automated (Monthly)
```powershell
# Find files > 90 days inactive
lifecycle-check.ps1 → ARCHIVE_CANDIDATES.md

# Flag policy violations
ownership-check.ps1 → UNOWNED_FILES.md
```

### Manual (Quarterly)
```powershell
# Full compliance audit
audit.ps1 → COMPLIANCE_REPORT.md
```

### CI/CD (Pre-commit)
- Validate all files follow NAMING_STANDARD.md
- Warn if new files lack ownership comment
- Check mkdocs.yml nav includes all docs/

---

## Exceptions & Overrides

**Explicit Retention:** Add header to file:
```markdown
<!-- RETAINED_UNTIL: 2027-07-09 -->
<!-- REASON: Compliance audit trail; legal hold -->
```

**Stable (No Archival):** Add header:
```markdown
<!-- STABLE: 2-year retention -->
<!-- CATEGORY: Architecture -->
```

**Temporary:** Add header:
```markdown
<!-- TEMPORARY: Session artifact -->
<!-- DELETE_AFTER: 2026-07-20 -->
```

---

## Ownership Assignment

Every file must have an owner (except gitignored artifacts):

```markdown
<!-- OWNER: cic -->
<!-- CATEGORY: governance -->
```

Valid owners: `cic`, `cic-ingestion`, `rewrite-mcp`, `toolforge`, `scripts`, `data`, `docs`, `claude-skills`

See OWNERSHIP_MATRIX.md for dir-to-owner mapping.

---

## Cross-References

- [OWNERSHIP_MATRIX.md](ownership-matrix.md) — Maps all dirs to owners
- [NAMING_STANDARD.md](naming-standard.md) — File naming conventions
- [CLAUDE.md](../../CLAUDE.md) — Main governance document

---

**Policy Owner:** CIC Governance  
**Last Reviewed:** 2026-07-09  
**Next Review:** 2026-10-09 (quarterly)
