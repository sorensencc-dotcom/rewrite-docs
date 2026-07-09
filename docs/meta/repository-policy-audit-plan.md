---
title: "Repository Policy & Audit Framework — Skeleton Plan"
summary: "**Status:** Planning"
updated: "2026-07-09"
tags:
  - meta
---
# Repository Policy & Audit Framework — Skeleton Plan

**Status:** Planning  
**Priority:** Medium  
**Phase:** Post-Phase 27  
**Estimated Effort:** 2-3 weeks

---

## Problem Statement

Current state:
- Logging policy created (7/8/2026) — solves logs only
- No unified repo governance/audit structure
- Scattered policies (mkdocs, .claude/, CLAUDE.md, skills/, docs/)
- No automated compliance checking
- Unclear ownership/accountability per directory

Scope:
- File organization standards
- Directory ownership & retention
- Artifact lifecycle (create → use → archive → delete)
- Audit automation
- Compliance reporting

---

## Proposed Framework

### 1. Policy Layer

#### 1.1 Directory Ownership Matrix
```
Path                      Owner         Purpose            Retention
─────────────────────────────────────────────────────────────────────
/docs/                    Content Team  Authoritative KB   Permanent
/docs/operations/logs/    Ops Team      Operational logs   Category-based*
/toolforge/skills/        Skill Team    Operational skills Permanent (versioned)
/cic-ingestion/           Dev Team      Service code       Permanent (git)
/data/                    Data Team     Artifacts/outputs  Project-based
/scripts/                 Ops Team      Automation         Permanent
/.claude/                 System        Claude config      Session-based
.bak, .tmp, .cache        System        Temporary          Auto-purge
```

#### 1.2 File Lifecycle Policies
- **Create:** where + naming convention + ownership
- **Use:** access patterns + modification rules
- **Archive:** compression + storage + discovery
- **Delete:** retention expiry + notification

#### 1.3 Audit Categories
- File location compliance
- Naming convention adherence
- Ownership clarity
- Retention policy enforcement
- Orphaned/stale detection

---

### 2. Audit Layer

#### 2.1 Automated Checks

**Script: `scripts/repo-audit.ps1`**

```
Check: File Location Compliance
  - .log files in /logs/* (not root)
  - .md docs in /docs/* (not root)
  - Skills in /toolforge/skills/* (not scattered)
  - Config in root or .claude (not /config/, /setup/, etc.)

Check: Naming Convention
  - Lowercase-with-hyphens for files
  - {component}-{type}-{date}.ext for logs
  - skill-name format for skills

Check: Ownership Clarity
  - Files have owner annotation (comment, spreadsheet, or sidebar)
  - Stale files have deprecation markers

Check: Retention Compliance
  - Logs >retention deleted or archived
  - Test artifacts cleaned up
  - Build outputs cleared

Check: Orphan Detection
  - Directories with no active commits >90 days
  - Unlinked documentation
  - Dead symlinks
```

#### 2.2 Reporting

**Output: `docs/operations/repo-audit-report.md`**
- Compliance % by category
- Findings (violations, warnings, suggestions)
- Timeline for remediation
- Ownership gaps

---

### 3. Integration Points

#### 3.1 mkdocs
- Add "Repository Standards" section
- Link to policy docs
- Embed audit report

#### 3.2 CI/CD
- Pre-commit hook: check file location + naming
- Weekly cron: full audit + report generation
- Slack notification on findings

#### 3.3 Governance
- Monthly audit review (ops standup)
- Escalate critical violations
- Archive old audit reports

---

### 4. Phases

**Phase A: Policy Codification (Week 1)**
- Define ownership matrix (spreadsheet → markdown)
- Codify file lifecycle rules
- Create audit category taxonomy

**Phase B: Audit Tooling (Week 1-2)**
- Write `scripts/repo-audit.ps1`
- Create `docs/operations/repo-standards.md`
- Add to mkdocs nav

**Phase C: Baseline Audit (Week 2)**
- Run initial audit
- Generate findings report
- Identify critical violations

**Phase D: Remediation (Week 2-3)**
- Fix ownership gaps
- Move misplaced files
- Archive/delete stale content

**Phase E: Automation (Week 3)**
- Add CI hook
- Schedule weekly cron
- Set up Slack notifications

---

### 5. Success Criteria

- [ ] 95%+ file location compliance
- [ ] 100% ownership clarity (no unowned dirs)
- [ ] Automated audit running weekly
- [ ] Monthly audit review cadence
- [ ] <10 outstanding violations

---

### 6. Known Unknowns

- **Retention for /data/** — project-dependent, needs mapping
- **Ownership for legacy dirs** — may need consolidation
- **Archive strategy** — tar.gz location + long-term storage
- **Compliance tooling** — integrate with existing monitoring?

---

### 7. Dependencies

- Logging policy (✅ 7/8/2026)
- Skill framework documentation
- Directory ownership mapping (TBD)
- CI/CD hook infrastructure (exists?)

---

### 8. Risks

- **Policy too strict** → developer friction
- **Too much automation** → false positives
- **Ownership disputes** → escalations needed
- **Legacy debt** → high remediation cost

---

## Next Steps

1. Schedule alignment meeting (Ops + Dev leads)
2. Refine ownership matrix
3. Decide: Phase A start date
4. Assign: Audit tooling owner

**Parking Lot:** Long-term archival strategy, compliance dashboard, cross-repo policies
