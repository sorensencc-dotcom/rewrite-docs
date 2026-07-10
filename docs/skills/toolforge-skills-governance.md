> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Toolforge Team · **Review Cycle:** Quarterly

# Toolforge Skills Governance Guide

---

## 1. Purpose

This guide defines the governance model for skills published to the **Toolforge Skill Registry** — the
authoritative catalog of capabilities available to CIC agents. It covers the full skill lifecycle:
authoring, review, approval, versioning, deployment, deprecation, and removal.

All skill authors, reviewers, and registry maintainers must operate within these rules. Skills that bypass
this process will not be promoted to production.

---

## 2. What Is a Skill?

A **skill** is a self-contained, versioned capability unit that a CIC agent can load and invoke. Each skill:

- Has a canonical `SKILL.md` that declares its purpose, tools, inputs, outputs, and safety constraints.
- Exposes one or more **tool declarations** that the CIC orchestration engine can call.
- Is stored in the `skills/` directory of the `rewrite-labs/cic-kb` repository.
- Is identified by a globally unique **skill slug** (e.g., `browser-use`, `analyst`, `connectors`).

Skills are **not** general-purpose code libraries. They encode operational procedures, safety constraints,
and contextual guidance that augment raw tool capabilities.

---

## 3. Skill Taxonomy

| Category | Description | Examples |
|---|---|---|
| **Core** | Platform-critical skills loaded by default | `connectors`, `scheduling-tasks` |
| **Domain** | Specialized capabilities for a specific domain | `travel`, `health-files`, `analyst` |
| **Integration** | Third-party service integrations | `box`, `dropbox`, `browser-use` |
| **Utility** | Cross-cutting helpers | `determining-location`, `determining-time` |
| **Experimental** | In active development; not production-stable | Tagged `[EXPERIMENTAL]` in registry |

---

## 4. Skill Lifecycle

PROPOSED → DRAFT → REVIEW → APPROVED → PRODUCTION → DEPRECATED → REMOVED

### 4.1 PROPOSED

- Author opens a **Skill Proposal Issue** using the `skill-proposal` issue template.
- The proposal must include: skill name, slug, category, intended use cases, tool list, and safety considerations.
- The Toolforge Team triages proposals weekly. Accepted proposals move to DRAFT.

### 4.2 DRAFT

- Author creates the skill directory: `skills/<slug>/`.
- Minimum required files: `SKILL.md` and `README.md`.
- The skill is tagged `[EXPERIMENTAL]` in the registry.
- DRAFT skills may be loaded in development environments only.

### 4.3 REVIEW

- Author opens a PR targeting `main`.
- CI gates run automatically (see §8).
- At least **two reviewers** must approve: a Skill Reviewer (domain expert) and a Safety Reviewer.
- The Toolforge Team assigns reviewers within 2 business days of PR opening.

### 4.4 APPROVED → PRODUCTION

- All CI gates pass; both reviewers have approved.
- Toolforge Team lead merges and updates the registry entry to `PRODUCTION`.
- The skill is available to all CIC agent sessions.

### 4.5 DEPRECATED

- A deprecation notice is added to `SKILL.md`.
- The registry entry is updated to `DEPRECATED`.
- Deprecated skills remain loadable for **60 days** to allow migration.
- Authors of dependent agents are notified via `#skill-deprecations`.

### 4.6 REMOVED

- After the 60-day window, the skill directory is moved to `skills/archive/<slug>/`.
- Any agent loading a removed skill receives a structured error with migration guidance.

---

## 5. Naming Conventions

### 5.1 Skill Slug

- Format: `kebab-case`, lowercase, alphanumeric and hyphens only.
- Maximum length: 32 characters. Must be globally unique within the registry.

### 5.2 Skill Directory Layout

```
skills/
<slug>/
SKILL.md          ← required
README.md         ← required
references/       ← optional
scripts/          ← optional
tests/            ← required for PRODUCTION skills
```

### 5.3 Tool Declarations

Tool names within a skill use `snake_case` and are prefixed with the skill slug when registered globally.

---

## 6. SKILL.md Specification

All eight sections are required. Safety Constraints is mandatory for any skill that accesses user data,
sends communications, executes transactions, or calls external services.

```markdown
# <Skill Display Name>

> **Slug:** <slug>
> **Version:** X.Y.Z
> **Status:** [EXPERIMENTAL | PRODUCTION | DEPRECATED]
> **Category:** [Core | Domain | Integration | Utility | Experimental]
> **Owner:** <team or individual>

## Purpose
## When to Load
## Tools
## Inputs
## Outputs
## Safety Constraints
## Reference Files
## Changelog
```

---

## 7. Versioning

Skills follow Semantic Versioning (SemVer): MAJOR.MINOR.PATCH.

| Increment | When |
|---|---|
| PATCH | Bug fixes, wording corrections — no behavioral change |
| MINOR | New tools, new optional parameters — backward compatible |
| MAJOR | Breaking changes: renamed tools, removed parameters, changed behavior |

MAJOR version bumps require a Migration Guide appended to SKILL.md and a 60-day deprecation window
for the prior major version.

---

## 8. CI Review Gates

| Check | Criteria |
|---|---|
| Markdown Lint | Zero errors |
| SKILL.md Schema | All required sections present and well-formed |
| Link Check | Zero broken links |
| Test Suite | All tests pass (PRODUCTION skills only) |
| Slug Uniqueness | Slug not already registered |
| Safety Section | Present for all flagged tool categories |

---

## 9. Safety Review Requirements

Any skill that declares tools in the following categories requires Safety Reviewer approval:

- Outbound communications (email, SMS, social posts)
- Financial transactions
- Data mutations (write, delete, move)
- Access to PII or credentials
- External API calls
- Browser automation that submits forms or completes purchases

---

## 10. Skill Loading Protocol

- Agent calls `load_skills` with `operation: 'read_file', skill_name: '<slug>', path: 'SKILL.md'`.
- Runtime validates production status; REMOVED skills return a structured error.
- Declared tools are registered in the agent's tool namespace for the session.
- All skill load events are logged with session ID, slug, version, and timestamp.

---

## 11. Registry Entry Schema

```yaml
- slug: example-skill
  display_name: Example Skill
  version: 1.0.0
  status: PRODUCTION    # EXPERIMENTAL | PRODUCTION | DEPRECATED | REMOVED
  category: Utility
  owner: rewrite-labs-eng
  description: A one-sentence description.
  added: 2025-08-01
  updated: 2026-07-09
  deprecated: null
  removed: null
```

---

## 12. Change Log

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-07-09 | Full rewrite; added safety review, registry schema, loading protocol |
| 1.3.0 | 2026-04-01 | Added SKILL.md specification |
| 1.2.0 | 2026-01-15 | Introduced 60-day deprecation window |
| 1.1.0 | 2025-11-10 | Added skill taxonomy table |
| 1.0.0 | 2025-08-01 | Initial release |
