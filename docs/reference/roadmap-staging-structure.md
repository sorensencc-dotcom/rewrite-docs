---
title: "Roadmap Staging Structure + Naming Convention"
summary: "Design for one-way sync: Drive/OneDrive staging folders for roadmap input, review workflow, and merge gates."
created: "2026-07-04"
updated: "2026-07-04"
tags:
  - operations
  - roadmap
  - staging
  - workflow
---

# Roadmap Staging Structure + Naming Convention

**Purpose:** Define folder structure and file naming for roadmap input, review, and merge workflows. Source: C:\dev\docs\roadmaps (canonical), Sync destination: Drive/OneDrive (read-only), Staging area: Separate folders in Drive/OneDrive (input only).

**One-way flow:** Drive/OneDrive staging → review gate → C:\dev\docs\roadmaps (manual merge).

---

## Remote Folder Structure (Drive/OneDrive)

```
/Roadmap-Staging/
├── 00-ACTIVE/                    # Items under review (current sprint)
│   ├── YYYY-MM-DD_RL-4.7-extraction-engine-v2.md
│   ├── YYYY-MM-DD_CIC-28b-autonomous-governance-audit.md
│   └── YYYY-MM-DD_SHARED-cost-forecast-q3.md
│
├── 01-RESEARCH/                  # Ideas, proposals, early drafts
│   ├── YYYY-MM-DD_potential-phase-50-ml-optimization.md
│   ├── YYYY-MM-DD_RL-future-content-delivery-v2.md
│   └── YYYY-MM-DD_gap-analysis-phase-26-triage.md
│
├── 02-APPROVED/                  # Ready to merge (passed review)
│   ├── YYYY-MM-DD_CIC-phase-30-mvp-approved.md
│   └── YYYY-MM-DD_RL-4.6-crawler-runner-ready.md
│
├── 03-MERGED/                    # Merged into unified roadmap
│   └── 2026-07-04_CIC-phase-24.5-governance-approvals.md
│
├── 04-ARCHIVED/                  # Rejected, deferred, or historical
│   ├── 2026-06-20_deprecated-phase-22.md
│   └── 2026-06-15_deferred-rl-4.7-pending-resources.md
│
└── _TEMPLATE/                    # Blank template for new items
    └── YYYY-MM-DD_TEMPLATE-system-or-phase-name.md
```

### Folder Responsibilities

| Folder | Purpose | Sync to Repo | Owner | Action |
|--------|---------|--------------|-------|--------|
| **00-ACTIVE** | Current sprint items | NO | Reviewer | Review → Approve/Reject |
| **01-RESEARCH** | Early ideas, proposals | NO | Proposer | Develop → Move to ACTIVE |
| **02-APPROVED** | Passed review, ready to merge | NO | Reviewer | Merge into unified-roadmap.md |
| **03-MERGED** | Successfully merged | NO | Maintainer | Reference only |
| **04-ARCHIVED** | Rejected or deferred | NO | Maintainer | Reference for history |
| **_TEMPLATE** | Blank form | NO | Maintainer | Use as guide |

---

## File Naming Convention

### Format
```
YYYY-MM-DD_SCOPE-PHASE_SHORT-DESCRIPTION.md
```

**Rules:**
- **YYYY-MM-DD** = date created (ISO format, UTC)
- **SCOPE** = one of: `CIC`, `RL`, `SHARED`
- **PHASE** = optional, specific phase identifier (e.g., `Phase-28b`, `RL-4.7`, `PHASE-26`)
- **SHORT-DESCRIPTION** = kebab-case, max 50 chars, descriptive noun (not verb)
- No spaces, no special chars (dash-separated only)

### Examples

✅ **Good:**
- `2026-07-04_CIC-Phase-28b_autonomous-governance-audit.md`
- `2026-07-03_RL-4.7_extraction-engine-v2.md`
- `2026-07-02_SHARED_cost-forecast-q3-2026.md`
- `2026-07-01_CIC_gap-analysis-phase-26-triage.md`

❌ **Bad:**
- `RL 4.7 New Extraction Engine V2.md` (spaces, title case)
- `CIC-28b-autonomous-governance-audit` (no date)
- `shared_costForecast` (mixed case, unclear scope)
- `2026-07-04_new_stuff.md` (vague, no scope)

---

## File Header Template

Every staging file **must** start with this YAML frontmatter:

```yaml
---
title: "Clear Title for This Roadmap Item"
type: "roadmap-item"  # Always this value
status: "draft"       # draft | ready-for-review | approved | merged | rejected | deferred
scope: "CIC"          # CIC | RL | SHARED
phase: "Phase-28b"    # Optional, specific phase identifier
relates_to: ["Phase-24", "RL-4.6", "governance/"]  # Links to CIC/RL/shared systems
created_by: "Chris"   # Your name
created_date: "2026-07-04"
review_ready_date: null     # Set when moving to 02-APPROVED
merged_date: null           # Set when merged into unified-roadmap.md
decision_date: null         # Set if rejected/deferred
decision: null              # "merged" | "rejected" | "deferred" | null
decision_notes: null        # Reason if rejected/deferred
---
```

### Header Field Guide

| Field | Required | Notes |
|-------|----------|-------|
| `title` | ✅ | Full, descriptive title |
| `type` | ✅ | Always `"roadmap-item"` |
| `status` | ✅ | One of: draft, ready-for-review, approved, merged, rejected, deferred |
| `scope` | ✅ | CIC, RL, or SHARED |
| `phase` | ❌ | Specific phase if known (e.g., "Phase-28b", "RL-4.7") |
| `relates_to` | ❌ | Array of related phases/systems |
| `created_by` | ✅ | Your name |
| `created_date` | ✅ | ISO date (YYYY-MM-DD) |
| `review_ready_date` | ❌ | Fill when moving to 02-APPROVED |
| `merged_date` | ❌ | Fill when merged into canonical roadmap |
| `decision_date` | ❌ | Fill if rejected/deferred |
| `decision` | ❌ | Outcome: "merged", "rejected", "deferred", or null |
| `decision_notes` | ❌ | Reason for rejection/deferral |

---

## Content Structure (Post-Header)

```markdown
---
[YAML frontmatter above]
---

# [Item Title]

## Summary
1–2 sentence summary of what this roadmap item is.

## What's Happening
Details: What phase/system, what change, why now.

## Alignment
- CIC phase: [link if applicable]
- RL phase: [link if applicable]
- Shared systems: [list if applicable]

## Timeline
- Start: [date or "immediately"]
- Milestone 1: [date + deliverable]
- End: [date or "ongoing"]

## Blockers/Dependencies
- [List blockers or dependencies on other phases]
- (Leave empty if none)

## Owner
- [Name or team]

## Notes
- [Any additional context, research, or open questions]
```

---

## Workflow: From Creation to Merge

### 1. Create (Author)
- Write new item in `/01-RESEARCH/` with status: `draft`
- Use template header
- Link to existing phases if known
- No date yet; will be filled on first review

### 2. Propose (Author → Reviewer)
- Move file to `/00-ACTIVE/` folder
- Update header: `status: "ready-for-review"`, set `review_ready_date`
- Tag reviewer (if using Slack/email integration)

### 3. Review (Reviewer)
- Read item, check alignment with unified roadmap
- Either:
  - **Approve:** Move to `/02-APPROVED/`, update `status: "approved"`
  - **Reject:** Move to `/04-ARCHIVED/`, set `status: "rejected"`, fill `decision_date` + `decision_notes`
  - **Request changes:** Comment in file, keep in `/00-ACTIVE/` (author iterates)

### 4. Merge (Maintainer)
- Move approved file to `/03-MERGED/`
- Update `status: "merged"`, set `merged_date`
- **Manually** integrate content into:
  - `C:\dev\docs\roadmaps\unified-roadmap.md` (cross-reference tables)
  - `C:\dev\docs\roadmaps\cic-roadmap.md` or `rewrite-labs-roadmap.md` (detailed phase info)
- Commit changes to git with reference to staging file: `"Merge: 2026-07-04_CIC-Phase-28b_..."`

### 5. Archive (Maintainer)
- Rejected items: Move to `/04-ARCHIVED/` with `decision_notes`
- Keep forever for historical reference

---

## Folder Setup Checklist

### In Drive (or OneDrive equivalent):

- [ ] Create `/Roadmap-Staging/` folder
- [ ] Create `/00-ACTIVE/` subfolder
- [ ] Create `/01-RESEARCH/` subfolder
- [ ] Create `/02-APPROVED/` subfolder
- [ ] Create `/03-MERGED/` subfolder
- [ ] Create `/04-ARCHIVED/` subfolder
- [ ] Create `/_TEMPLATE/` subfolder
- [ ] Add `_TEMPLATE/YYYY-MM-DD_TEMPLATE-system-or-phase-name.md` (blank with frontmatter)
- [ ] Share folders with review team (read/write for ACTIVE, RESEARCH; read-only for others)
- [ ] Document folder structure in shared wiki/doc (link back here)

### Permissions

| Folder | Chris | Team | External |
|--------|-------|------|----------|
| 00-ACTIVE | ✅ RW | ✅ RW | ❌ |
| 01-RESEARCH | ✅ RW | ✅ RW | ❌ |
| 02-APPROVED | ✅ RW | ✅ RO | ❌ |
| 03-MERGED | ✅ RW | ✅ RO | ❌ |
| 04-ARCHIVED | ✅ RW | ✅ RO | ❌ |
| _TEMPLATE | ✅ RW | ✅ RO | ❌ |

---

## Validation Checklist

Before staging a new file, verify:

- [ ] File is named: `YYYY-MM-DD_SCOPE-PHASE_description.md`
- [ ] YAML frontmatter is present and valid
- [ ] `status` is one of: draft, ready-for-review, approved, merged, rejected, deferred
- [ ] `created_by` and `created_date` are filled
- [ ] Title matches filename description
- [ ] Links to CIC/RL phases are accurate
- [ ] Blockers section is filled (or marked as none)
- [ ] Content is under 2000 words (keep items focused)

---

## Example File

**Filename:** `2026-07-04_CIC-Phase-28b_autonomous-governance-audit.md`

```yaml
---
title: "CIC Phase 28b: Autonomous Governance Audit"
type: "roadmap-item"
status: "draft"
scope: "CIC"
phase: "Phase-28b"
relates_to: ["Phase-24", "Phase-26", "governance/"]
created_by: "Chris"
created_date: "2026-07-04"
review_ready_date: null
merged_date: null
decision_date: null
decision: null
decision_notes: null
---

# CIC Phase 28b: Autonomous Governance Audit

## Summary
Phase 28b adds automated governance auditing to the CIC runtime, detecting policy violations and generating compliance reports without human intervention.

## What's Happening
Building on Phase-24 (approval gates) and Phase-26 (TorqueQuery), Phase 28b automates the audit loop: detect drift, flag violations, generate reports, propose rollbacks.

## Alignment
- CIC phase: Phase-24 (approval gates), Phase-26 (TorqueQuery), governance layer
- RL phase: RL-4.4 (EntitlementSet gates) feeds audit signals
- Shared systems: governance orchestration, drift detection

## Timeline
- Start: 2026-07-15
- Milestone 1 (drift detection): 2026-07-29
- Milestone 2 (audit reports): 2026-08-12
- End: 2026-08-26

## Blockers/Dependencies
- Requires Phase-24 approval gates (✅ done)
- Requires Phase-26 TorqueQuery search (✅ in progress)
- Depends on drift detection framework (✅ done)

## Owner
- Chris (primary), engineering team (implementation)

## Notes
- Timing aligns with Q3 governance compliance window
- Automation reduces manual audit burden by ~60%
- May inform future Phase 30 (ML-driven remediation)
```

---

## Summary

**Folder structure:** 5 active folders (ACTIVE, RESEARCH, APPROVED, MERGED, ARCHIVED) + 1 template folder

**Naming:** `YYYY-MM-DD_SCOPE-PHASE_description.md` (unique, sortable, descriptive)

**Header:** Standardized YAML with status tracking, dates, owner, and decision fields

**Workflow:** draft → review → approve → merge (or reject → archive)

**Permissions:** Read/write for active work, read-only for completed/archived

**Next:** Set up folders in Drive/OneDrive, test with template file, then we can design the sync script.

