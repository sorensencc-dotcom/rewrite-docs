# Pre-Wrap-Audit Integration Setup

**Status:** ✅ WIRED  
**Date:** 2026-07-08  
**Version:** 1.0.0

---

## Overview

Pre-wrap-audit is now integrated into Claude Code via hooks. It runs a 12-point blind-spot assessment before session termination, returning RED/YELLOW/GREEN verdicts.

**RED:** Blocks termination (critical blockers)  
**YELLOW:** Escalates for decision (important risks)  
**GREEN:** Proceeds (all checks pass)

---

## Quick Start

### Manual Audit Run

```bash
npm run audit:pre-wrap
```

Returns verdict + report. Exit codes:
- `0` = GREEN (safe to proceed)
- `1` = RED (blocked, resolve blockers)
- `2` = YELLOW (escalate for review)

### Audit + Build + Exit

```bash
npm run finish:with-audit
```

Runs audit → build → exits (if GREEN/YELLOW with acceptance).

---

## Claude Code Hook Integration

### Step 1: Configure hooks in Claude Code settings

**File:** `.vscode/settings.json` or Claude Code settings

```json
{
  "claude.hooks": {
    "before-session-end": "tsx .claude/hooks/pre-wrap-audit-handler.ts"
  }
}
```

OR edit Claude Code settings UI:
- Go to Claude Code settings
- Find "Hooks" section
- Add event: `before-session-end`
- Command: `tsx .claude/hooks/pre-wrap-audit-handler.ts`

### Step 2: Verify hook is loaded

When Claude Code starts, you'll see in the console:
```
[Claude Code] Hooks loaded:
  - before-session-end: tsx .claude/hooks/pre-wrap-audit-handler.ts
```

### Step 3: Test the hook

Type `/finish` in Claude Code. Hook should trigger:
```
🔍 [Hook] Pre-Wrap-Audit Starting
    Session: [sessionId]
    Time: [timestamp]

[Hook] Verdict: GREEN
[Hook] ✅ GREEN FLAG: Audit passed. Proceeding with session end.
```

---

## Command Reference

### `npm run audit:pre-wrap`
Run standalone audit. Prompts for 12 questions, returns verdict + report.

**Options:**
```bash
--session=SESSION_ID       # Custom session ID (default: timestamp)
--context="PROJECT"        # Project context for audit
--format=json|markdown     # Output format (default: markdown)
--no-store                 # Don't save report to .claude/sessions/
--no-block                 # Return verdict but don't exit with code
```

**Example:**
```bash
npm run audit:pre-wrap -- --session=wave-g-complete --context="Phase 27 Wave G"
```

### `npm run audit:pre-wrap:no-block`
Run audit without blocking on RED (always exit 0).

```bash
npm run audit:pre-wrap:no-block
# Returns verdict but doesn't block termination
```

### `npm run finish:with-audit`
Run audit + build + exit sequence.

```bash
npm run finish:with-audit
# Runs: audit → build → exit
# Blocks if RED, escalates if YELLOW
```

---

## Workflow Integration

### Standard Session Flow

1. **During session:** Do work, commit, test, etc.
2. **Type `/finish`:** Triggers `before-session-end` hook
3. **Hook runs audit:**
   - Prompts for 12-point questions
   - Calculates verdict (RED/YELLOW/GREEN)
   - Stores report in `.claude/sessions/[sessionId]/audit-report.json`
4. **Verdict handling:**
   - **RED:** Blocks termination. Shows blockers. Requires fixes.
   - **YELLOW:** Escalates. Shows risks. Can proceed with explicit acceptance.
   - **GREEN:** Logs success. Proceeds with termination.
5. **Session ends:** Report archived for audit trail.

### Resolving RED Flags

If audit returns RED:

```bash
# Read the report to see blockers
cat .claude/sessions/SESSION_ID/audit-report.json

# Fix the blockers (e.g., run missing tests)
npm test

# Rerun audit
npm run audit:pre-wrap
```

Repeat until GREEN.

### Accepting YELLOW Risks

If audit returns YELLOW:

```bash
# Review the risks in the report
npm run audit:pre-wrap -- --format=markdown

# If you accept the risks, proceed
npm run finish:with-audit --accept-risk
```

---

## Report Storage

Reports stored in: `.claude/sessions/[sessionId]/audit-report.json`

**Structure:**
```json
{
  "verdict": "GREEN",
  "sessionId": "session-1720000000000",
  "timestamp": "2026-07-08T...",
  "coreAnswers": { "1": "...", "2": "...", ... },
  "extendedAnswers": { "5": "...", "6": "...", ... },
  "assessment": {
    "blockers": [],
    "risks": [],
    "ready": ["..."],
    "reasoning": "...",
    "nextSteps": [...]
  },
  "stored": true
}
```

---

## Questions (12-Point Audit)

### Core Questions (4)
1. **Confidence gap:** Unverified code, evidence gaps?
2. **Missing context:** Unknown substate, stakeholders?
3. **Load-bearing assumptions:** What if I'm wrong?
4. **Verification checklist:** MUST/SHOULD/NICE-TO-HAVE done?

### Extended Fields (8)
5. **Dependencies:** External systems, failure modes?
6. **Regression surface:** Backwards compat, silent failures?
7. **Documentation accuracy:** Docs vs code match?
8. **Rollback readiness:** Backup exists, tested?
9. **Known unknowns:** Untested areas, edge cases?
10. **Stakeholder alignment:** Approvals done?
11. **Data integrity:** Migrations, corruption, backups?
12. **Security surface:** Auth, validation, secrets?

---

## Verdict Rules

### RED FLAG (Block Termination)
- Unexecuted code (jest never ran)
- Unknown state (submodule dirty, uncommitted changes)
- Unchecked MUST items (verification incomplete)
- Stakeholder not approved
- Security vulnerability exposed
- Data integrity risk (corruption, no backup)

### YELLOW FLAG (Escalate for Decision)
- Regression not tested
- Rollback not tested
- Load testing incomplete
- Documentation mismatch
- Too many unknowns

### GREEN FLAG (Proceed)
- No blockers detected
- All verifications done
- Stakeholders aligned
- Ready for deployment

---

## Troubleshooting

### Hook not triggering

**Check 1:** Hook configured in settings?
```bash
# Look for hooks section in Claude Code settings
# Should have: "before-session-end": "tsx .claude/hooks/pre-wrap-audit-handler.ts"
```

**Check 2:** File exists?
```bash
ls .claude/hooks/pre-wrap-audit-handler.ts
```

**Check 3:** npm scripts available?
```bash
npm run audit:pre-wrap
# Should show audit prompts
```

### Audit command fails

```bash
# Check skill files exist
ls toolforge/skills/pre-wrap-audit/src/index.ts

# Run with debug
npm run audit:pre-wrap 2>&1 | head -20

# Check TypeScript compilation
npx tsc --noEmit .claude/hooks/pre-wrap-audit-handler.ts
```

### Report not storing

```bash
# Check directory permissions
mkdir -p .claude/sessions
chmod 755 .claude/sessions

# Run audit manually with storage
npm run audit:pre-wrap -- --session=test-session
```

---

## Integration Checklist

- [x] Pre-wrap-audit skill built + tested
- [x] CLI wrapper created (`scripts/pre-wrap-audit.ts`)
- [x] Hook handler created (`.claude/hooks/pre-wrap-audit-handler.ts`)
- [x] package.json scripts added
- [x] Documentation complete
- [ ] Wire into Claude Code settings (user action)
- [ ] Test on first /finish command
- [ ] Monitor for false positives in YELLOW flags

---

## Next Steps

1. **Today:** Configure hook in Claude Code settings
2. **Test:** Type `/finish` and verify hook runs
3. **Monitor:** Check first few audit results for FP rate
4. **Refine:** Adjust verdict rules if needed
5. **Rollout:** Enable for team (Chris, on-call)

---

## Related Files

- **Skill:** `toolforge/skills/pre-wrap-audit/`
- **CLI:** `scripts/pre-wrap-audit.ts`
- **Handler:** `.claude/hooks/pre-wrap-audit-handler.ts`
- **Hook Config:** `.claude/hooks/pre-wrap-audit.json`
- **ASHFALL Integration:** `toolforge/skills/ashfall/` (Phase 3.5)
- **Memory:** `.claude/projects/c--dev/memory/pre-wrap-audit-skill-complete-2026-07-08.md`

---

**Questions?** See `toolforge/skills/pre-wrap-audit/docs/USAGE.md` for detailed workflow guide.
