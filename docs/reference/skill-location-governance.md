# Skill-Location Governance (Phase 2)

**Policy:** All skills must live in `C:\dev\toolforge\skills\{skill-name}/`

**Documentation:** CLAUDE.md § Documentation & Skills Policy, RULE 2

## Enforcement Points

### 1. Claude Code Write/Edit (PreToolUse Hook)

**Location:** `C:\Users\soren\.claude\hooks\skill-location-gate.js`

**Registration:** `~/.claude/settings.json` → `PreToolUse` hook

**Trigger:** Any Write or Edit tool call targeting `skill.json`

**Action:** 
- If path not in `C:/dev/toolforge/skills/`, block with error
- Display policy citation + required structure
- Exit code 1 (prevents tool execution)

**Example Error:**
```
❌ BLOCKED: skill.json must live in C:\dev\toolforge\skills\{skill-name}\
   Current path: C:\Users\soren\.claude\skills\my-skill\skill.json
   Policy: CLAUDE.md § Documentation & Skills Policy, RULE 2
   Required structure:
     toolforge/skills/{name}/
     ├── skill.json
     ├── README.md
     ├── src/
     ├── tests/
     └── docs/
```

### 2. Git Pre-Commit Hook

**Location:** `.git/hooks/pre-commit` (manual installation, not tracked in git)

**Trigger:** Any attempt to commit staged `skill.json` file

**Scan:** `git diff --cached --name-only --diff-filter=A` for `skill.json` outside `toolforge/skills/`

**Action:**
- If misplaced `skill.json` found in staged commits, block commit
- Display list of misplaced files
- Display policy citation + required structure
- Exit code 1 (commit fails)

**Note:** `.git/hooks/` is internal to git and not tracked in version control. Setup is preserved locally.

## Installation & Testing

### Verify PreToolUse Hook

```powershell
# Check settings.json registration
Get-Content ~/.claude/settings.json | ConvertFrom-Json | 
  Select-Object -ExpandProperty hooks | 
  Select-Object -ExpandProperty PreToolUse
```

Expected: Two hooks in PreToolUse array (git-ai checkpoint + skill-location-gate)

### Test Pre-Commit Hook

```bash
# Create test skill.json in wrong location
mkdir -p /tmp/test-skill
touch /tmp/test-skill/skill.json

# Stage it
git add /tmp/test-skill/skill.json

# Attempt commit (should fail)
git commit -m "test: misplaced skill"
# Error: BLOCKED: skill.json must live in toolforge/skills/{name}/
```

## Stragglers (One-Time Scan Results)

Existing skills in `~/.claude/skills/` (not in toolforge):

| Path | Status | Action |
|------|--------|--------|
| `roadmap-validator/skill.json` | Duplicate (in toolforge) | Safe to delete |
| `work-summarizer/skill.json` | Old v1 copy | Superseded by Stage 1 migration |
| `work-summarizer-v2/*` | v2.0.0 archive | Delete post-Stage-5 validation |

## How It Works

### PreToolUse Hook Flow

```
User Write/Edit → Claude Code tool invocation
         ↓
PreToolUse hook fires
         ↓
skill-location-gate.js runs
         ↓
Check: Is tool Write or Edit?
     ├─ No → allow, exit 0
     └─ Yes → Check: Is file skill.json?
           ├─ No → allow, exit 0
           └─ Yes → Check: Path in toolforge/skills/?
                 ├─ Yes → allow, exit 0
                 └─ No → BLOCK, display error, exit 1
         ↓
Tool execution blocked or allowed
```

### Pre-Commit Hook Flow

```
User git commit
         ↓
Pre-commit hook fires
         ↓
Scan staged files: git diff --cached --name-only --diff-filter=A
         ↓
For each file:
  ├─ Is it skill.json?
  │  ├─ No → continue
  │  └─ Yes → Is it in toolforge/skills/?
  │       ├─ Yes → continue
  │       └─ No → Add to misplaced list
         ↓
Any misplaced files found?
     ├─ No → continue, exit 0 (allow commit)
     └─ Yes → BLOCK, display list + policy, exit 1 (reject commit)
         ↓
Commit succeeds or fails
```

## Future: Phase 2 Extended (Out of Scope)

The original Phase 2 plan included three components:

1. ✅ **PreToolUse hook** — Implemented
2. ✅ **Pre-commit hook** — Implemented
3. ✅ **One-time sweep** — Completed (stragglers identified above)

**Out of scope (future consideration):**
- Full "Skills Policy Agent" with 6-criteria weighted scoring (see `skills-policy-agent-requirement.md`)
- Exception registry for special cases
- Automated promotion workflows from `~/.claude/skills/` to `toolforge/skills/`

---

**Status:** Phase 2 complete (2026-07-03)  
**Last Updated:** 2026-07-03
