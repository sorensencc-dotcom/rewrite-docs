# Ownership Matrix

**Governance:** CLAUDE.md §2 + Repository Policy Audit  
**Version:** 1.0.0  
**Updated:** 2026-07-09  
**Status:** Active

---

## Standard Directories (8)

All project files must reside in one of these directories, per CLAUDE.md §2.

| Directory | Owner | Purpose | Files | Status |
|-----------|-------|---------|-------|--------|
| `cic/` | CIC Governance | Governance pipeline, audit services, observation | 11 | ✓ |
| `cic-ingestion/` | CIC Ingestion | Autonomy API server, memory/retention, Caveman compression | 80 | ✓ |
| `rewrite-mcp/` | Rewrite Labs | MCP servers, multi-tenant architecture | 940 | ✓ |
| `toolforge/` | Operator Tools | Operational skills, CLI utilities, dashboards | 134 | ✓ |
| `claude-skills/` | Claude Skills | Skill definitions, validation, contribution pipeline | 3,379* | ✓ |
| `scripts/` | DevOps | Operational helpers, Docker, CI/CD automation | 17 | ✓ |
| `data/` | Data Team | Extracted datasets, roadmap JSON, CI artifacts | TBD | AUDIT |
| `docs/` | Knowledge Team | Authoritative KB (mkdocs), architecture specs, guides | 442 | ✓ |

**\* claude-skills includes vendored dependencies; ~400 actual source files**

---

## Orphaned Directories → Standard Mapping

Files currently orphaned must be **moved** to their owner directory per this matrix.

### MOVE TO DOCS/ (Documentation)

| Orphaned Dir | Owner | Destination | Files | Rationale |
|--------------|-------|-------------|-------|-----------|
| `cic-ref/` | Docs | `docs/reference/` | 6 | Reference material |
| `cic-research/` | Docs | `docs/reference/cic-research/` | 3 | Research docs |
| `cic-runtime/` | Docs | `docs/cic/runtime.md` | 2 | Runtime architecture |
| `cic-ui/` | Docs | `docs/ui/` | 2 | UI documentation (or delete if legacy) |
| `rl-ref/` | Docs | `docs/reference/rewrite-labs/` | 15 | Rewrite Labs reference |
| `design-system/` | Docs | `docs/design-system/` | 12 | Design governance |
| `observability/` | Docs | `docs/ops/observability/` | 6 | Operations/observability docs |
| `charlie-deep-research/` | Docs | `docs/archive/research/deep-research-2026/` | 18 | Archive (historical) |

---

### MOVE TO TOOLFORGE/ (Operational Skills)

| Orphaned Dir | Owner | Destination | Files | Rationale |
|--------------|-------|-------------|-------|-----------|
| `TheFoundry/` | Toolforge | `toolforge/skills/the-foundry/` | 14 | Roadmap compiler; operational skill |
| `roadmap-runner/` | Toolforge | `toolforge/skills/roadmap-runner/` | 2 | Roadmap validation; operational skill |

---

### MOVE TO CIC/ or CIC-INGESTION/ (Core Services)

| Orphaned Dir | Owner | Destination | Files | Rationale |
|--------------|-------|-------------|-------|-----------|
| `services/` | TBD (Audit) | `cic/` or `cic-ingestion/` | 17 | Unclear; audit during Phase B |

---

### MOVE TO DATA/ (Datasets & Exports)

| Orphaned Dir | Owner | Destination | Files | Rationale |
|--------------|-------|-------------|-------|-----------|
| `outputs/` | Data | `data/exports/` | 7 | Extracted datasets |

---

### MOVE TO DOCS/META/ (Meta/Operations)

| Orphaned Dir | Owner | Destination | Files | Rationale |
|--------------|-------|-------------|-------|-----------|
| `docs-manager/` | Docs | `docs/meta/` | 1 | Meta tooling |
| `docs-rag/` | Docs | `docs/meta/rag/` | 3 | Meta tooling |

---

### ARCHIVE (Historical/Reference Only)

| Orphaned Dir | Owner | Destination | Files | Rationale |
|--------------|-------|-------------|-------|-----------|
| `castironforge/` | Archive | `docs/archive/projects/castironforge/` | 32 | Legacy genealogy project; archive or delete per Phase A decision |
| `claude-config-backup/` | N/A | **DELETE** | 24 | Stale backup; no retention rationale |

---

### EXCLUDE FROM GIT (Gitignored, No Action)

| Dir | Files | Status | Rationale |
|-----|-------|--------|-----------|
| `CIP/` | 1,100 | ✓ Gitignored | Build output; already ignored |
| `node_modules/` | N/A | ✓ Gitignored | Dependencies |
| `dist/`, `build/`, `.next/`, `coverage/` | N/A | ✓ Gitignored | Build artifacts |
| `.history/` | 42 | ✓ Gitignored | Editor cache |

---

### EXCLUDE FROM TRACKING (Should Be Gitignored)

| Dir | Files | Action | Rationale |
|-----|-------|--------|-----------|
| `.planning/` | 6 | Add to .gitignore | Volatile scratch; not source |

---

## Detailed Owner Responsibilities

### CIC Governance (`cic/`)
**Files:** ~11 (governance, audit, observation)  
**Responsibilities:**
- Maintain CLAUDE.md + related governance docs
- Run quarterly compliance audits
- Own file lifecycle policy + enforcement
- Maintain ownership matrix (this doc)

**Key Files:**
- cic/governance-pipeline.ts
- cic/audit-services/
- docs/meta/file-lifecycle-policy.md (this owner)

---

### CIC Ingestion (`cic-ingestion/`)
**Files:** ~80 (autonomy API, memory, retention)  
**Responsibilities:**
- Maintain AutonomyAPIServer.ts + related APIs
- Manage Caveman compression pipeline
- Maintain ingestion tests + documentation

**Key Files:**
- cic-ingestion/src/AutonomyAPIServer.ts
- cic-ingestion/tests/
- cic-ingestion/ARCHITECTURE.md

**Note:** ARCHITECTURE.md, OPERATIONS.md, SECURITY.md should move to docs/cic-ingestion/ per FILE_LIFECYCLE_POLICY.md Phase C remediation.

---

### Rewrite Labs MCP (`rewrite-mcp/`)
**Files:** ~940 (MCP servers, multi-tenant)  
**Responsibilities:**
- Maintain MCP server implementations
- Manage multi-tenant gateway
- Maintain MCP documentation + specs

**Key Files:**
- rewrite-mcp/src/mcp-gateway.ts
- rewrite-mcp/docs/
- rewrite-mcp/CHANGELOG.md

**Note:** PHASE_*.md files should move to docs/archive/phases/ per FILE_LIFECYCLE_POLICY.md.

---

### Toolforge (`toolforge/`)
**Files:** ~134 (operational skills, utilities)  
**Responsibilities:**
- Maintain 13 operational skills (ASHFALL Phase 1)
- Validate skill structure (skill.json, src/index.ts, tests/, docs/)
- Maintain toolforge governance + contributor guide

**Key Files:**
- toolforge/skills/{skill-name}/
- toolforge/GOVERNANCE.md
- toolforge/OPERATOR_GUIDE.md

**Adding files:** Must follow toolforge/TOOL_CREATION_GUIDE.md structure.

---

### Claude Skills (`claude-skills/`)
**Files:** ~3,379 (includes ~400 source + ~3,000 vendored)  
**Responsibilities:**
- Maintain skill definitions + validation
- Manage skill contribution pipeline
- Maintain skills documentation + conventions

**Key Files:**
- claude-skills/src/
- claude-skills/SKILL_PIPELINE.md
- claude-skills/CONTRIBUTING.md

---

### Scripts & DevOps (`scripts/`)
**Files:** ~17 (CI/CD, operational helpers)  
**Responsibilities:**
- Maintain deployment + build scripts
- Manage Docker + container configs
- Maintain CI/CD workflow definitions

**Key Files:**
- scripts/deploy.sh, build.sh, etc.
- scripts/docker/
- .github/workflows/

---

### Data (`data/`)
**Files:** TBD (datasets, roadmap JSON, artifacts)  
**Responsibilities:**
- Manage extracted datasets
- Store roadmap JSON + CI outputs
- Archive exported data for analysis

**Key Files:**
- data/exports/
- data/roadmap-*.json
- data/ci-artifacts/

**Note:** Audit in Phase B to clarify scope + populate.

---

### Knowledge Base (`docs/`)
**Files:** ~442 (KB, architecture, guides)  
**Responsibilities:**
- Maintain authoritative KB (mkdocs)
- Manage doc consolidation + cross-links
- Run `mkdocs build --strict` validation
- Maintain index-unified.md + navigation

**Key Files:**
- docs/index.md (nav root)
- docs/index-unified.md (discovery hub)
- docs/meta/ (meta docs, this file)
- docs/reference/, docs/cic/, docs/ops/, etc.

---

## Directory Checklist (New Files)

When creating files in any standard dir, verify:

- [ ] **Location:** Correct owner directory (not root, not orphaned)
- [ ] **Naming:** Follows NAMING_STANDARD.md (lowercase-with-hyphens.md)
- [ ] **Ownership:** File header includes `<!-- OWNER: {dir-name} -->`
- [ ] **Category:** File header includes `<!-- CATEGORY: {category} -->`
- [ ] **Retention:** File header includes retention policy (or links to policy doc)
- [ ] **mkdocs nav:** If docs/, add to mkdocs.yml nav
- [ ] **Backlinks:** If docs/, add "See also:" cross-references
- [ ] **No duplicates:** Avoid duplicate CLAUDE.md, ROADMAP.md, etc.

---

## Audit & Enforcement

### Monthly (Automated)
```powershell
ownership-check.ps1
# Outputs: UNOWNED_FILES.md
# Lists all files without owner comment
```

### Quarterly (Manual)
```powershell
audit.ps1
# Outputs: COMPLIANCE_REPORT.md
# Validates ownership matrix accuracy
```

### CI/CD (Pre-commit Hook)
- Verify new files in correct owner directory
- Warn if owner header missing
- Block if file in root (except CLAUDE.md, README.md)

---

## Cross-References

- [FILE_LIFECYCLE_POLICY.md](file-lifecycle-policy.md) — Creation → use → archival
- [NAMING_STANDARD.md](naming-standard.md) — File naming conventions
- [CLAUDE.md](../../CLAUDE.md) — Main governance document (§2: Directory Structure)

---

**Matrix Owner:** CIC Governance  
**Last Updated:** 2026-07-09  
**Next Review:** 2026-10-09 (quarterly)
