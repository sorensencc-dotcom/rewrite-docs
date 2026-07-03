# Phase 5c Removal Execution Plan

**Date:** 2026-06-19  
**Scope:** Deprecation removal (Memory-Spine + Operator-UI clones)  
**Status:** READY FOR EXECUTION (post-veto gate approval)

---

## Pre-Execution Checklist

Before executing any deletions, run these verification steps:

### 1. Memory-Spine Verification
```bash
# Confirm Memory-Spine is NOT referenced in docker-compose
grep -i "memory.spine\|memory-spine" /c/dev/docker-compose.yml
# Expected: (no output)

# Confirm Memory-Spine is NOT in any startup path
grep -r "memory-spine" /c/dev/scripts --include="*.sh" --include="*.js"
# Expected: (no output or only docs)

# Confirm TorqueQuery is the replacement
grep -i "torquequery" /c/dev/docker-compose.yml
# Expected: service definition at line 213+
```

### 2. Operator-UI Clone Verification
```bash
# Confirm clones are not referenced in docker-compose (only planning-console)
grep -E "operator-ui|operator_ui" /c/dev/docker-compose.yml
# Expected: (no output — planning-console service, not operator-ui)

# Confirm canonical apps/operator-ui exists and is complete
ls -la /c/dev/rewrite-mcp/apps/operator-ui/ | grep -E "index\.html|server\.mjs|css|js"
# Expected: All files present

# Diff check: partial clone vs. canonical
diff -r /c/dev/rewrite-mcp/operator-ui/ /c/dev/rewrite-mcp/apps/operator-ui/ 2>&1 | head -20
# Expected: Many differences (partial vs. full)

# Diff check: planning-engine clone vs. canonical
diff -r /c/dev/rewrite-mcp/planning-engine/apps/operator-ui/ /c/dev/rewrite-mcp/apps/operator-ui/ 2>&1
# Expected: (no output or minimal — they should be identical)
```

### 3. Docker-Compose Syntax Check
```bash
cd /c/dev && docker-compose config > /tmp/compose-check.yml
# Expected: exit 0 (valid YAML)
```

---

## Execution Steps (In Order)

### PHASE A: Auto-Approval Deletions (4 hours)

#### Step A1: Delete Memory-Spine Service (1 hour)

**Verification:**
```bash
# Double-check: no external references to memory-spine directory
find /c/dev -type f -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs grep -l "services/memory-spine" | grep -v ".venv" | grep -v "node_modules"
# Expected: (no output)
```

**Deletion:**
```powershell
# PowerShell (Windows)
Remove-Item -Path "C:\dev\castironforge\services\memory-spine" -Recurse -Force -Confirm:$false
```

**Bash equivalent:**
```bash
rm -rf /c/dev/castironforge/services/memory-spine
```

---

#### Step A2: Delete Memory-Spine Documentation (1 hour)

**Deletion:**
```powershell
Remove-Item -Path "C:\dev\castironforge\docs\memory-spine" -Recurse -Force -Confirm:$false
```

**Bash equivalent:**
```bash
rm -rf /c/dev/castironforge/docs/memory-spine
```

---

#### Step A3: Update castironforge/.mcp.json (30 mins)

**Current state:** Contains entry for "cic-memory-spine"

**Action:** Remove the entire "cic-memory-spine" object from the "tools" section.

**Before:**
```json
{
  "tools": {
    "cic-memory-spine": {
      "launch": {
        "command": "node",
        "args": ["services/memory-spine/dist/mcp/server.js"]
      },
      "cwd": "services/memory-spine",
      "env": {
        "MEMORY_SPINE_DATA_DIR": "${workspaceFolder}/services/memory-spine/data"
      }
    }
  }
}
```

**After:**
```json
{
  "tools": {
    // cic-memory-spine removed (deprecated in Phase 5c)
  }
}
```

**Verification:**
```bash
# Confirm .mcp.json is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('/c/dev/castironforge/.mcp.json', 'utf8'))) && console.log('VALID')"
# Expected: VALID (no parse error)
```

---

#### Step A4: Delete Partial operator-ui Clone (1.5 hours)

**Location:** `/c/dev/rewrite-mcp/operator-ui/`

**Pre-deletion diff:**
```bash
# Confirm it's truly a subset (5 panels vs. 25 in canonical)
find /c/dev/rewrite-mcp/operator-ui -type f | wc -l
find /c/dev/rewrite-mcp/apps/operator-ui -type f | wc -l
# Expected: partial < canonical (both have similar structure but partial has fewer files)
```

**Deletion:**
```powershell
Remove-Item -Path "C:\dev\rewrite-mcp\operator-ui" -Recurse -Force -Confirm:$false
```

**Bash equivalent:**
```bash
rm -rf /c/dev/rewrite-mcp/operator-ui
```

---

#### Step A5: Post-Deletion Verification (30 mins)

**Verify no orphaned imports:**
```bash
# Search for remaining operator-ui references (should be in apps/ only)
grep -r "operator-ui" /c/dev/rewrite-mcp --include="*.ts" --include="*.js" --include="*.json" | grep -v "apps/operator-ui" | grep -v ".claude" | grep -v "node_modules"
# Expected: (no output)
```

**Verify docker-compose still valid:**
```bash
cd /c/dev && docker-compose config > /tmp/compose-check.yml
# Expected: exit 0
```

**Verify planning-console service is intact:**
```bash
grep -A 20 "^  planning-console:" /c/dev/docker-compose.yml | grep -E "container_name|ports|healthcheck"
# Expected: All three present
```

---

### PHASE B: Veto-Gated Deletions (9 hours) — Only if Approved

#### Step B1: Operator Veto Approval (Manual)

**Before proceeding, obtain approval for:**
1. Delete entire `planning-engine/` clone? (YES / NO)
2. Confirm Memory-Spine replacement is TorqueQuery? (YES / NO)
3. Confirm CIP/RewriteLabs is truly archival? (YES / NO)

**If ANY answer is NO:** Stop and escalate to operator.

---

#### Step B2: Delete planning-engine Full Clone (5–6 hours)

**⚠️ CRITICAL: HIGH BLAST RADIUS ⚠️**

**Pre-deletion backup:**
```bash
# Create a backup snapshot (just in case)
tar -czf /tmp/rewrite-mcp-planning-engine-backup-$(date +%s).tar.gz /c/dev/rewrite-mcp/planning-engine
# Expected: backup file created at ~500MB–1GB
```

**Verification: Confirm full clone status**
```bash
# List top-level dirs in planning-engine
ls -la /c/dev/rewrite-mcp/planning-engine | head -30
# Expected: apps/, tools/, projects/, packages/, benchmarks/, .github/, .claude/, docker-compose.yml, etc.

# Verify planning-engine contains apps/operator-ui (clone)
ls -la /c/dev/rewrite-mcp/planning-engine/apps/operator-ui | head -5
# Expected: index.html, server.mjs, css/, js/, etc. (identical to canonical)
```

**Deletion:**
```powershell
Remove-Item -Path "C:\dev\rewrite-mcp\planning-engine" -Recurse -Force -Confirm:$false
```

**Bash equivalent:**
```bash
rm -rf /c/dev/rewrite-mcp/planning-engine
```

---

#### Step B3: Delete planning-engine/operator-ui Clones (Included in B2)

**Status:** Covered by planning-engine deletion above.

---

#### Step B4: Delete CIP/RewriteLabs Legacy Copy (1 hour)

**Location:** `/c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui/`

**Pre-deletion check:**
```bash
# Confirm this is truly archival (no git refs, no recent commits)
cd /c/dev/CIP/RewriteLabs && git log --oneline --all -- rewrite-mcp/operator-ui/ | head -5
# Expected: No commits or very old commits (pre-2026)
```

**Deletion:**
```powershell
Remove-Item -Path "C:\dev\CIP\RewriteLabs\rewrite-mcp\operator-ui" -Recurse -Force -Confirm:$false
```

**Bash equivalent:**
```bash
rm -rf /c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui
```

---

#### Step B5: Post-Deletion Verification for Veto-Gated Items (2 hours)

**Verify no remaining operator-ui clones:**
```bash
find /c/dev -name "operator-ui" -type d | grep -v ".claude" | grep -v "worktree" | grep -v "node_modules"
# Expected: Only /c/dev/rewrite-mcp/apps/operator-ui should remain
```

**Verify docker-compose references planning-console (not planning-engine):**
```bash
grep -E "planning-engine|planning-console" /c/dev/docker-compose.yml | grep -v "^#"
# Expected: planning-console service definition present; no references to planning-engine as a Docker service
```

**Verify planning-engine is truly deleted from filesystem:**
```bash
ls /c/dev/rewrite-mcp/planning-engine 2>&1
# Expected: "No such file or directory"
```

---

## Post-Execution Validation

### Step 1: Docker-Compose Syntax Check
```bash
cd /c/dev && docker-compose config > /tmp/final-compose-check.yml
# Expected: exit 0, valid YAML written to /tmp/final-compose-check.yml
```

### Step 2: Service Health Check (Optional — if starting containers)
```bash
cd /c/dev && docker-compose up -d planning-console
sleep 15
curl -f http://localhost:3200/health || curl -f http://localhost:3000/health
# Expected: HTTP 200 (service healthy)
docker-compose down
```

### Step 3: Codebase Integrity Check
```bash
# Verify no broken imports across the codebase
grep -r "from.*operator-ui\|from.*memory-spine\|import.*operator-ui\|import.*memory-spine" /c/dev --include="*.ts" --include="*.js" | grep -v "node_modules" | grep -v ".claude"
# Expected: (no output)
```

### Step 4: Git Status Check
```bash
cd /c/dev && git status
# Expected: Untracked/deleted files ready for commit
```

---

## Commit Message Template

Once deletion is complete, create atomic commits:

### Commit 1: Memory-Spine Deprecation
```
[fix] Deprecate Memory-Spine MCP service (Phase 5c)

TorqueQuery (port 3110) now provides all memory indexing functionality.
Memory-Spine MCP was never wired to docker-compose or any production runtime.

Deleted:
  - castironforge/services/memory-spine/        (40+ files)
  - castironforge/docs/memory-spine/            (8 docs)
  - castironforge/.mcp.json entry               (cic-memory-spine removed)

No broken references or import paths.
Effort: 2 hours.

Closes: Phase 5c veto gate (Memory-Spine)

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Commit 2: Operator-UI Clones Deprecation
```
[fix] Consolidate operator-ui clones to canonical (Phase 5c)

Deleted 4 duplicate operator-ui instances:
  - rewrite-mcp/operator-ui/                    (partial clone, 5 panels)
  - rewrite-mcp/planning-engine/apps/operator-ui/  (full clone, 25 panels)
  - rewrite-mcp/planning-engine/operator-ui/    (partial clone, 5 panels)
  - CIP/RewriteLabs/rewrite-mcp/operator-ui/    (legacy archive)

Canonical source remains at rewrite-mcp/apps/operator-ui/ (25+ panels, hardened server).
planning-console service (port 3200→3000) is the only Console v3 host.

docker-compose config: validated
No broken imports or references.
Effort: 2–3 hours (auto-approval phase) + 6 hours (veto-gated planning-engine).

Closes: Phase 5c veto gates (operator-ui consolidation + planning-engine clone)

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

---

## Rollback Plan (If Issues Arise)

If a deletion causes unexpected breakage:

```bash
# Option 1: Git reset to last known-good commit
cd /c/dev && git reset --hard <last-good-commit-sha>

# Option 2: Restore from backup (if created in Step B2)
cd /c/dev && tar -xzf /tmp/rewrite-mcp-planning-engine-backup-*.tar.gz

# Option 3: File-by-file restoration from git history
cd /c/dev && git checkout HEAD~ -- rewrite-mcp/planning-engine
```

---

## Execution Summary

| Phase | Items | Effort | Approval |
|-------|-------|--------|----------|
| A (Auto) | Memory-Spine + partial operator-ui | 4 hrs | NONE |
| B (Veto) | planning-engine clone + legacy copy | 9 hrs | REQUIRED |
| **Total** | **All deprecations** | **13 hrs** | 3 veto gates |

**Status:** READY TO EXECUTE (pending veto responses)

---

**Next:** Obtain operator approval on 3 veto questions (Phase 4.5 gate), then execute phases A → B in order.
