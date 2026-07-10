> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Knowledge Engineering · **Review Cycle:** Quarterly

# KB-OPERATIONS

---

## 1. Purpose

This document defines the authoritative rules, workflows, and responsibilities for creating, modifying,
validating, and retiring content in the CIC + Rewrite Labs Knowledge Base (KB). All contributors —
engineers, technical writers, and product owners — must follow these rules. Deviation requires an
approved exception tracked in the KB issue log.

---

## 2. Scope

These operations apply to all content in the `docs/` directory of the `rewrite-labs/cic-kb` repository,
including:

- Architecture documents
- Skill governance guides
- Operational runbooks
- Reference material (glossary, API docs, changelogs)

Content outside `docs/` (e.g., root-level config files such as `mkdocs.yml`) is managed by the Platform
Engineering team under the Change Management process.

---

## 3. Roles and Responsibilities

| Role | Responsibilities |
|---|---|
| **KB Owner** | Final approval authority for all KB changes. Assigns reviewers. Signs off on deprecations and archival. |
| **KB Contributor** | Authors and edits documents. Runs local validation. Responds to review feedback. |
| **KB Reviewer** | Subject-matter expert who reviews content accuracy, completeness, and compliance with this guide. |
| **KB Automation** | CI pipeline that runs linting, link checking, schema validation, and build checks on every PR. |

---

## 4. Document Lifecycle

DRAFT → REVIEW → APPROVED → STABLE → DEPRECATED → ARCHIVED

### 4.1 DRAFT

- Document exists in a feature branch.
- May be incomplete. Must be clearly marked with the `DRAFT` status badge.
- No consumer should rely on DRAFT content.

### 4.2 REVIEW

- PR is open. KB Automation checks have passed.
- At least one KB Reviewer is assigned.
- The author responds to all review comments before merge.

### 4.3 APPROVED → STABLE

- KB Owner has approved the PR.
- All CI checks pass.
- PR is merged to `main`. The document status badge is updated to `STABLE`.

### 4.4 DEPRECATED

- A newer document supersedes this one.
- The deprecated document is updated with a `DEPRECATED` badge and a `> See Also:` link to the replacement.
- Deprecated documents remain indexed for 90 days, then move to `ARCHIVED`.

### 4.5 ARCHIVED

- Moved to `docs/archive/` following the [File Movement Protocol](file-movement-protocol.md).
- Excluded from primary navigation but retained for lineage.
- The KB Owner records the archival date and reason in the document header.

---

## 5. Authoring Rules

### 5.1 File Naming

Follow the [Naming Conventions](naming-conventions.md) document exactly. Key rules:

- Filenames use **kebab-case** for all new documents. Legacy ALL-CAPS names (e.g., `KB-OPERATIONS.md`,
  `CIC_SYSTEM.md`) are grandfathered; do not rename without a file movement RFC.
- No spaces, special characters, or version numbers in filenames.
- Extensions: `.md` for all prose documents; `.yml` for config.

### 5.2 Document Header

Every document must begin with the following YAML-like header block rendered as a blockquote:

```markdown
> **Status:** [STABLE | DRAFT | DEPRECATED | ARCHIVED]
> **Version:** X.Y.Z
> **Updated:** YYYY-MM-DD
> **Owner:** [Team or individual name]
> **Review Cycle:** [Monthly | Quarterly | Annual | On-change]
```

### 5.3 Content Requirements

- **Headings:** Use ATX-style headings (#, ##, ###). Maximum depth: ####.
- **Tables:** Every table must have a header row. Cells must be single-line.
- **Code blocks:** Always specify the language (```yaml, ```python, etc.).
- **Admonitions:** Use MkDocs Material admonitions (!!! note, !!! warning, !!! danger) for callouts.
- **Links:** Use relative paths for internal links. No raw URLs in prose; use named links.
- **Images:** Store in docs/assets/images/. Use descriptive alt text.

### 5.4 Prohibited Content

The following must never appear in KB documents:

- Passwords, API keys, tokens, or credentials (even example/fake ones without clear EXAMPLE annotation)
- Personally identifiable information (PII) of any individual
- Unreferenced claims (assertions without a source or owner)
- Duplicate content — if a fact lives in Document A, Document B links to it, not copies it

---

## 6. Review Gates

Every PR must pass all of the following before merge:

| Gate | Automated? | Criteria |
|---|---|---|
| Markdown Lint | ✅ Yes | Zero lint errors (.markdownlint.yml rules) |
| Link Check | ✅ Yes | Zero broken internal or external links |
| Build Check | ✅ Yes | mkdocs build --strict exits 0 |
| Schema Validation | ✅ Yes | Document header present and well-formed |
| KB Reviewer Approval | ❌ Manual | At least 1 subject-matter reviewer approves |
| KB Owner Sign-off | ❌ Manual | Required for: new documents, deprecations, archival, structural nav changes |

---

## 7. File Movement Protocol

Moving, renaming, or retiring a file is a structured operation. See [File Movement Protocol](file-movement-protocol.md)
for the full procedure. Summary:

- Open a File Movement RFC issue using the issue template.
- KB Owner approves the RFC.
- Contributor executes the move on a dedicated branch.
- Add a redirect rule in mkdocs.yml for any renamed/moved page.
- Update all internal links pointing to the old path.
- Merge after all gates pass.
- Never delete a file without KB Owner approval. Move to docs/archive/ instead.

---

## 8. Validation Workflows

### 8.1 Local Validation (Pre-commit)

```bash
# Install dependencies
pip install mkdocs-material mkdocs-minify-plugin

# Serve locally and verify rendering
mkdocs serve

# Run strict build
mkdocs build --strict

# Run markdownlint
markdownlint docs/

# Run link checker
lychee docs/ --offline
```

### 8.2 CI Pipeline (Automated on PR)

The GitHub Actions workflow `.github/workflows/kb-validate.yml` runs on every PR to main:

- **lint** — markdownlint with project ruleset
- **links** — lychee link checker (external links on schedule only)
- **build** — mkdocs build --strict
- **schema** — Python script validates document header presence and format
- **nav-check** — Verifies all files in docs/ appear in mkdocs.yml nav

### 8.3 Scheduled Checks

Weekly (Sunday 02:00 UTC):

- Full external link check
- Stale document report (documents not updated in >180 days flagged for review)
- Orphan file report (files in docs/ missing from nav)

---

## 9. KB Metrics

| Metric | Target |
|---|---|
| Mean time from DRAFT to STABLE | ≤ 5 business days |
| Broken link count | 0 |
| Documents overdue for review | ≤ 5% of total |
| Orphaned files | 0 |
| PR review turnaround | ≤ 2 business days |

---

## 10. Escalation

Escalate to the KB Owner via #kb-governance.

If unresolved within 24 hours, escalate to the Rewrite Labs Engineering Director.

For security-sensitive content (exposed credentials, PII), treat as a P1 incident and follow the
Incident Response runbook immediately.

---

## 11. Change Log

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-07-09 | Full rewrite for unified CIC + RL architecture |
| 1.2.1 | 2026-03-15 | Added scheduled checks section |
| 1.2.0 | 2026-01-10 | Added KB metrics table |
| 1.1.0 | 2025-11-01 | Introduced REVIEW stage to lifecycle |
| 1.0.0 | 2025-08-01 | Initial release |
