# Naming Standard

**Governance:** CLAUDE.md §9 + Repository Policy Audit  
**Version:** 1.0.0  
**Updated:** 2026-07-09  
**Status:** Active

---

## Policy Statement

All files and directories in standard owner directories must use `lowercase-with-hyphens` naming convention. No exceptions.

**Examples:**
- ✓ `cic-system-overview.md`
- ✓ `phase-27-wave-g-completion.md`
- ✗ `CIC_System_Overview.md` (violates)
- ✗ `Phase_27_Wave_G_Completion.md` (violates)

---

## File Naming Convention

### Markdown Files (`.md`)

**Pattern:** `{topic}-{descriptor}-{category}.md` (lowercase, hyphens only)

**Parts:**
- `{topic}`: Primary subject (e.g., `cic`, `phase-27`, `governance`)
- `{descriptor}`: Optional; adds specificity (e.g., `runtime`, `observability`, `audit`)
- `{category}`: Optional; document type (e.g., `spec`, `report`, `policy`, `guide`)

**Examples:**

| File | Components | Rationale |
|------|-----------|-----------|
| `cic-governance.md` | cic + governance | Core governance doc |
| `cic-runtime-observability.md` | cic + runtime + observability | Specific subsystem |
| `phase-27-wave-g-completion.md` | phase-27 + wave-g + completion | Phase artifact |
| `phase-27-wave-g-telemetry-report.md` | phase-27 + wave-g + telemetry + report | Specific report type |
| `ownership-matrix.md` | ownership + matrix | Policy document |
| `file-lifecycle-policy.md` | file + lifecycle + policy | Policy document |
| `naming-standard.md` | naming + standard | This document |
| `skill-framework.md` | skill + framework | Architecture doc |
| `architecture-pipeline.md` | architecture + pipeline | Arch spec |

---

### Bad Examples (Non-Compliant)

| File | Issue | Fix |
|------|-------|-----|
| `CIC_SYSTEM_OVERVIEW.md` | CamelCase + UPPER_SNAKE | `cic-system-overview.md` |
| `Phase27WaveGCompletion.md` | CamelCase | `phase-27-wave-g-completion.md` |
| `CIC_RUNTIME_OBSERVABILITY_PLAN.md` | UPPER_SNAKE | `cic-runtime-observability-plan.md` |
| `SKILLAuthoring.md` | MixedCase | `skill-authoring.md` |
| `v1.0ArchitectureSpec.md` | Version prefix; MixedCase | `architecture-spec-v1-0.md` |

---

### Acronyms & Version Numbers

**Acronyms:** Lowercase in filenames
- ✓ `cic-system.md` (not `CIC_System.md`)
- ✓ `mcp-gateway.md` (not `MCP_Gateway.md`)
- ✓ `rest-api-spec.md` (not `REST_API_Spec.md`)

**Version Numbers:** Use hyphens, not dots
- ✓ `api-spec-v1-0.md` (not `api-spec-v1.0.md`)
- ✓ `schema-v2-3-1.md` (not `schema-v2.3.1.md`)

---

### Special Cases

**Dates in filenames:** Use ISO 8601 (YYYY-MM-DD) with hyphens
- ✓ `session-2026-07-09-phase-27.md`
- ✓ `incident-2026-07-08-deployment-failure.md`

**Abbreviations:** Spell out if unclear; use hyphens
- ✓ `observability-dashboard-spec.md` (clearer than `obs-dash-spec.md`)
- ✓ `token-burn-analysis.md` (clearer than `tb-analysis.md`)

**Numbers:** Always use hyphens
- ✓ `phase-27-wave-3-report.md`
- ✓ `skill-version-1-2-0-changelog.md`

---

## Directory Naming Convention

**Pattern:** `{owner}-{category}` or `{topic}` (lowercase, hyphens only)

**Examples:**

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `cic/` | CIC | Governance pipeline |
| `cic-ingestion/` | CIC | Ingestion service |
| `rewrite-mcp/` | Rewrite Labs | MCP servers |
| `toolforge/` | Toolforge | Operational skills |
| `claude-skills/` | Claude | Skill definitions |
| `docs/` | Docs | Knowledge base |
| `scripts/` | DevOps | Automation |
| `data/` | Data | Datasets |

**Subdirectories within docs/**
- `docs/cic/` — CIC architecture + docs
- `docs/reference/` — Reference material
- `docs/ops/` — Operations docs
- `docs/design-system/` — Design governance
- `docs/meta/` — Meta/governance docs
- `docs/archive/` — Archived docs

**All lowercase, hyphens only. No dots, underscores, or CamelCase.**

---

## Code File Naming (TypeScript/JavaScript)

**Pattern:** `{topic}.ts`, `{noun}-{action}.ts` (lowercase, hyphens, meaningful names)

**Examples:**
- ✓ `cic-governance.ts` (module name)
- ✓ `audit-service.ts` (service)
- ✓ `drift-detector.ts` (detector)
- ✓ `token-burn-analyzer.ts` (analyzer)
- ✗ `CICGovernance.ts` (CamelCase)
- ✗ `AuditService.ts` (CamelCase)

**React/Component Files:** Use PascalCase for React components ONLY
- ✓ `ObservabilityDashboard.tsx` (React component)
- ✓ `TokenBurnAnalyzer.tsx` (React component)
- ✗ All other files follow lowercase-hyphens

---

## Configuration & Data Files

**JSON/YAML:**
- ✓ `package.json`, `tsconfig.json`, `.gitignore` (well-known)
- ✓ `roadmap.json`, `manifest.json` (lowercase)
- ✓ `audit-config.yaml` (lowercase-hyphens)

**Env Files:**
- ✓ `.env`, `.env.example`, `.env.local` (standard)
- ✓ `.env.production`, `.env.test` (lowercase-hyphens)

---

## GitHub/Git Conventions

**Branch Names:** `{type}/{topic}` (lowercase, hyphens)
- ✓ `feature/cic-governance-audit`
- ✓ `fix/naming-standard-violations`
- ✓ `docs/archive-phase-27-logs`

**Commit Messages:** Use conventional format (keep lowercase for scopes)
- ✓ `feat(cic): add drift detection`
- ✓ `fix(naming): rename 200+ files to lowercase-hyphens`
- ✓ `docs(policy): add file lifecycle policy`

**PR Titles:** Use conventional format
- ✓ `feat(governance): implement repository policy audit`
- ✓ `refactor(docs): consolidate reference material`

---

## Enforcement

### Automated (Pre-commit Hook)

Check all new/modified files:
```powershell
audit.ps1 --check-naming
# Outputs: NAMING_VIOLATIONS.md
# Lists all files violating lowercase-hyphens standard
```

### CI/CD (GitHub Actions)

Block commits with naming violations:
```yaml
- name: Validate File Names
  run: |
    powershell scripts/audit.ps1 --check-naming
    if ($LASTEXITCODE -ne 0) {
      echo "File naming violations detected"
      exit 1
    }
```

### Manual Rename Script

Batch rename non-compliant files:
```powershell
scripts/audit/rename.ps1
# Converts CamelCase → lowercase-hyphens
# Creates commit: fix(naming): standardize 200+ files
```

---

## Migration Plan (Phase B-C)

### Phase B.1: Audit
- Run `audit.ps1 --check-naming`
- Generate NAMING_VIOLATIONS.md
- Sort by directory + file count

### Phase B.2: Approval
- Review violations with owners
- Approve batch rename

### Phase C.1: Rename
- Run `rename.ps1`
- Verify all cross-references updated (mkdocs.yml, imports, links)
- Run `mkdocs build --strict` (should pass)

### Phase C.2: Commit
- Single commit: `fix(naming): standardize file names to lowercase-hyphens`
- Includes: file renames + updated references (mkdocs.yml, imports, links)

### Phase C.3: Verify
- All tests pass
- mkdocs build passes
- git diff shows only renames (no content changes)

---

## Exceptions & Overrides

**Well-Known Names (No Change):**
- `.gitignore`, `.env`, `package.json`, `tsconfig.json`
- `README.md`, `CLAUDE.md` (root level only)
- `Dockerfile`, `Makefile`, `docker-compose.yml`

**Third-Party Files (No Change):**
- Vendored dependencies (node_modules/, etc.)
- External config files (Notefile, etc.)

**Legacy Files (Case-by-case):**
- If rename would break active imports: defer to next major version
- Document exception in file header: `<!-- LEGACY_NAME: retaining for import compatibility -->`

---

## Cross-References

- [OWNERSHIP_MATRIX.md](ownership-matrix.md) — File location rules
- [FILE_LIFECYCLE_POLICY.md](file-lifecycle-policy.md) — File creation + archival
- [CLAUDE.md](../../CLAUDE.md) — Main governance document (§9: Naming Conventions)

---

## Validation Tools

### Check Script
```powershell
scripts/audit/audit.ps1 --check-naming
```

### Rename Script
```powershell
scripts/audit/rename.ps1
```

### Verify Script
```powershell
scripts/audit/verify-renames.ps1
```

---

**Standard Owner:** CIC Governance  
**Last Updated:** 2026-07-09  
**Next Review:** 2026-10-09 (quarterly or after Phase C rename wave)
