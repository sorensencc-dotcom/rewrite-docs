# Phase 5c File Removal Matrix

**Purpose:** Complete list of files/directories to remove during Phase 5c deprecation  
**Format:** Absolute paths, file counts, rationales  
**Status:** READY FOR REFERENCE DURING EXECUTION

---

## Section 1: Memory-Spine Service Removal

### Directory: `/c/dev/castironforge/services/memory-spine/`

**Size:** ~40–50 files (including .venv/)

**Contents:**
```
castironforge/services/memory-spine/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── mcp/
│   │   ├── server.ts
│   │   └── tools/
│   │       ├── memory_query.ts
│   │       ├── memory_edit.ts
│   │       └── memory_admin.ts
│   ├── store/
│   │   ├── corpus.ts
│   │   ├── versions.ts
│   │   └── [other modules]
│   ├── lib/
│   │   ├── query.ts
│   │   └── [other utilities]
│   └── client/
│       └── memory-client.ts
├── scripts/
│   ├── train-memory-v1.sh
│   ├── seed.ts
│   ├── calibrate-confidence.ts
│   ├── generate-dataset.ts
│   ├── generate-dataset-hybrid.ts
│   └── generate-dataset-llm.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── .venv/                           [Python virtualenv — ~100MB]
│   ├── Scripts/
│   ├── Lib/
│   └── [other venv files]
├── data/                            [Data directory — optional]
│   └── [memory-spine datasets]
└── [other config files]
```

**Deletion Command:**
```bash
rm -rf /c/dev/castironforge/services/memory-spine
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/castironforge/services/memory-spine && echo "✓ Deleted" || echo "✗ Failed"
```

---

### Directory: `/c/dev/castironforge/docs/memory-spine/`

**Size:** ~8 files

**Contents:**
```
castironforge/docs/memory-spine/
├── API.md
├── ACTIVATION_PLAN.md
├── AGENT_CALL_PATTERNS.md
├── DEPLOYMENT.md
├── ORCHESTRATOR_PATCH.md
├── OVERVIEW.md
├── TRAINING_PIPELINE.md
└── VERSIONING.md
```

**Deletion Command:**
```bash
rm -rf /c/dev/castironforge/docs/memory-spine
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/castironforge/docs/memory-spine && echo "✓ Deleted" || echo "✗ Failed"
```

---

### File: `/c/dev/castironforge/.mcp.json`

**Type:** Configuration file (not deleted, only modified)

**Change:** Remove "cic-memory-spine" entry from "tools" object

**Before (lines ~3–15):**
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
    // cic-memory-spine removed (deprecated Phase 5c, replaced by TorqueQuery)
  }
}
```

**Edit Command (using Edit tool):**
- Read `/c/dev/castironforge/.mcp.json`
- Remove entire "cic-memory-spine" object
- Write back

**Verification (post-edit):**
```bash
node -e "const j = JSON.parse(require('fs').readFileSync('/c/dev/castironforge/.mcp.json')); console.log(j.tools['cic-memory-spine'] ? '✗ Still present' : '✓ Removed')"
```

---

## Section 2: Operator-UI Clones Removal

### Directory: `/c/dev/rewrite-mcp/operator-ui/` (Partial Clone)

**Size:** ~15 files

**Contents:**
```
rewrite-mcp/operator-ui/
├── control-room.html
├── css/
│   ├── dashboard.css
│   ├── control-room.css
│   └── [other stylesheets]
├── js/
│   ├── agents.js
│   ├── control-plane-api.js
│   ├── metrics.js
│   ├── pipelines.js
│   └── runs.js
└── [other supporting files]
```

**Note:** This is a partial clone (5 panels) of the canonical `apps/operator-ui/` (25+ panels).

**Deletion Command:**
```bash
rm -rf /c/dev/rewrite-mcp/operator-ui
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/rewrite-mcp/operator-ui && echo "✓ Deleted" || echo "✗ Failed"
```

---

### Directory: `/c/dev/rewrite-mcp/planning-engine/apps/operator-ui/` (Full Clone)

**Size:** ~25+ files (byte-for-byte duplicate of canonical)

**Contents:** Identical to `/c/dev/rewrite-mcp/apps/operator-ui/`

**Note:** This is part of the larger `planning-engine/` full-repo clone. Delete as part of the `planning-engine/` cleanup.

**Deletion Command (if planning-engine not fully deleted):**
```bash
rm -rf /c/dev/rewrite-mcp/planning-engine/apps/operator-ui
```

**Deletion Command (if full planning-engine deletion approved):**
```bash
rm -rf /c/dev/rewrite-mcp/planning-engine
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/rewrite-mcp/planning-engine/apps/operator-ui && echo "✓ Deleted" || echo "✗ Failed"
```

---

### Directory: `/c/dev/rewrite-mcp/planning-engine/operator-ui/` (Partial Clone)

**Size:** ~15 files

**Contents:** Duplicate of `/c/dev/rewrite-mcp/operator-ui/` (5-panel set)

**Note:** This is part of the larger `planning-engine/` full-repo clone.

**Deletion Command (if planning-engine not fully deleted):**
```bash
rm -rf /c/dev/rewrite-mcp/planning-engine/operator-ui
```

**Deletion Command (if full planning-engine deletion approved):**
```bash
rm -rf /c/dev/rewrite-mcp/planning-engine
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/rewrite-mcp/planning-engine/operator-ui && echo "✓ Deleted" || echo "✗ Failed"
```

---

### Directory: `/c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui/` (Legacy Archive)

**Size:** ~15 files

**Contents:**
```
CIP/RewriteLabs/rewrite-mcp/operator-ui/
├── control-room.html
├── css/
│   └── [legacy stylesheets]
└── js/
    └── [legacy panels]
```

**Note:** Archival path (`CIP/RewriteLabs/`), predates canonical, no active references.

**Deletion Command:**
```bash
rm -rf /c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui && echo "✓ Deleted" || echo "✗ Failed"
```

---

## Section 3: Full-Repo Clone Removal (Veto-Gated)

### Directory: `/c/dev/rewrite-mcp/planning-engine/` (Full Repo Clone)

**Size:** ~1000–1500 files

**Contents:**
```
rewrite-mcp/planning-engine/
├── apps/                           [FULL COPY]
│   ├── operator-ui/                [Clone of canonical]
│   ├── [other apps]
│   └── [~100+ files]
├── tools/                          [FULL COPY]
│   ├── helm/
│   ├── prompt-telemetry/
│   ├── [other tools]
│   └── [~100+ files]
├── projects/                       [FULL COPY]
│   ├── cic/
│   ├── [other projects]
│   └── [~200+ files]
├── packages/                       [FULL COPY]
│   ├── agents/
│   ├── cic-ui/
│   ├── [other packages]
│   └── [~150+ files]
├── benchmarks/                     [FULL COPY]
│   ├── [benchmark files]
│   └── [~50+ files]
├── .github/                        [FULL COPY]
│   ├── workflows/
│   └── [~20+ files]
├── .claude/                        [FULL COPY]
│   └── [~20+ files]
├── docker-compose.yml              [DUPLICATE]
├── Dockerfile*                     [MULTIPLE DUPLICATES]
├── .env.example                    [DUPLICATE]
├── .gitignore                      [DUPLICATE]
├── [100+ more duplicated files]
```

**⚠️ CRITICAL WARNING ⚠️**

This is a full repository clone. Deletion will:
- Remove 1000+ files
- Eliminate all operator-ui clones in planning-engine/
- Remove all duplicated apps, tools, projects, packages
- Require veto gate approval (operator must confirm it's truly stale)

**Pre-deletion backup:**
```bash
tar -czf /tmp/rewrite-mcp-planning-engine-backup-$(date +%s).tar.gz /c/dev/rewrite-mcp/planning-engine
```

**Deletion Command:**
```bash
rm -rf /c/dev/rewrite-mcp/planning-engine
```

**Verification (post-delete):**
```bash
test ! -d /c/dev/rewrite-mcp/planning-engine && echo "✓ Deleted" || echo "✗ Failed"
```

**Conditional (if planning-engine NOT approved for deletion):**
- Keep `/c/dev/rewrite-mcp/planning-engine/`
- Only delete operator-ui clones within it:
  ```bash
  rm -rf /c/dev/rewrite-mcp/planning-engine/apps/operator-ui
  rm -rf /c/dev/rewrite-mcp/planning-engine/operator-ui
  ```

---

## Section 4: Configuration File Updates

### File: `/c/dev/castironforge/.mcp.json`

**Action:** Remove memory-spine entry (see Section 1 above)

### File: `/c/dev/docker-compose.yml`

**Action:** No changes required. The `planning-console` service remains; it does not reference any deprecated paths.

**Verification:**
```bash
grep -E "operator-ui|memory-spine" /c/dev/docker-compose.yml
# Expected: (no output)
```

---

## Section 5: Summary Removal Commands

### Phase A: Auto-Approval Deletions (4 hours)

```bash
# Memory-Spine service & docs
rm -rf /c/dev/castironforge/services/memory-spine
rm -rf /c/dev/castironforge/docs/memory-spine

# Operator-UI partial clone
rm -rf /c/dev/rewrite-mcp/operator-ui

# Update .mcp.json (manual edit via Edit tool)
# Remove "cic-memory-spine" entry from castironforge/.mcp.json
```

### Phase B: Veto-Gated Deletions (if approved)

```bash
# Full planning-engine clone (REQUIRES BACKUP)
tar -czf /tmp/rewrite-mcp-planning-engine-backup-$(date +%s).tar.gz /c/dev/rewrite-mcp/planning-engine
rm -rf /c/dev/rewrite-mcp/planning-engine

# OR (if planning-engine NOT deleted) — delete clones only
rm -rf /c/dev/rewrite-mcp/planning-engine/apps/operator-ui
rm -rf /c/dev/rewrite-mcp/planning-engine/operator-ui

# Legacy archive
rm -rf /c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui
```

---

## Section 6: Batch PowerShell Execution

For Windows execution via PowerShell:

```powershell
# Phase A: Auto-Approval (requires no veto gate)
Write-Host "Phase A: Deleting auto-approval items..."

# Memory-Spine
Remove-Item -Path "C:\dev\castironforge\services\memory-spine" -Recurse -Force -Confirm:$false
Remove-Item -Path "C:\dev\castironforge\docs\memory-spine" -Recurse -Force -Confirm:$false

# Operator-UI partial clone
Remove-Item -Path "C:\dev\rewrite-mcp\operator-ui" -Recurse -Force -Confirm:$false

Write-Host "Phase A: Complete"

# .mcp.json update (manual via Edit tool or nano/vim if available)
Write-Host "Update .mcp.json: Remove cic-memory-spine entry"

# Phase B: Veto-Gated (if approved)
Write-Host "Phase B: Awaiting veto approval..."

# If approved for full deletion:
# Backup first
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
tar -czf "C:\tmp\rewrite-mcp-planning-engine-backup-$timestamp.tar.gz" "C:\dev\rewrite-mcp\planning-engine"

# Delete
Remove-Item -Path "C:\dev\rewrite-mcp\planning-engine" -Recurse -Force -Confirm:$false

# Legacy archive
Remove-Item -Path "C:\dev\CIP\RewriteLabs\rewrite-mcp\operator-ui" -Recurse -Force -Confirm:$false

Write-Host "Phase B: Complete"
```

---

## Section 7: Post-Deletion Verification Checklist

After executing all deletions, run these checks:

```bash
# 1. Confirm all target directories deleted
test ! -d /c/dev/castironforge/services/memory-spine && echo "✓ memory-spine" || echo "✗ memory-spine"
test ! -d /c/dev/castironforge/docs/memory-spine && echo "✓ memory-spine docs" || echo "✗ memory-spine docs"
test ! -d /c/dev/rewrite-mcp/operator-ui && echo "✓ operator-ui partial" || echo "✗ operator-ui partial"
test ! -d /c/dev/rewrite-mcp/planning-engine/apps/operator-ui && echo "✓ planning-engine/apps/operator-ui" || echo "✗ planning-engine/apps/operator-ui"
test ! -d /c/dev/rewrite-mcp/planning-engine/operator-ui && echo "✓ planning-engine/operator-ui" || echo "✗ planning-engine/operator-ui"
test ! -d /c/dev/CIP/RewriteLabs/rewrite-mcp/operator-ui && echo "✓ CIP/RewriteLabs/operator-ui" || echo "✗ CIP/RewriteLabs/operator-ui"

# 2. Confirm canonical operator-ui still exists
test -d /c/dev/rewrite-mcp/apps/operator-ui && echo "✓ Canonical operator-ui present" || echo "✗ Canonical operator-ui missing"

# 3. Docker-compose syntax check
cd /c/dev && docker-compose config > /tmp/compose-check.yml && echo "✓ docker-compose valid" || echo "✗ docker-compose invalid"

# 4. Search for orphaned references
echo "Orphaned memory-spine references:"
grep -r "memory-spine\|services/memory-spine" /c/dev --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -v "node_modules" | grep -v ".venv" || echo "  (none found)"

echo "Orphaned operator-ui references (should only be in apps/):"
grep -r "operator-ui\|operator_ui" /c/dev/rewrite-mcp --include="*.ts" --include="*.js" --include="*.yml" 2>/dev/null | grep -v "apps/operator-ui" | grep -v "node_modules" | grep -v ".claude" || echo "  (none found)"

# 5. Git status
cd /c/dev && git status --short | grep -E "^ D |^D " | wc -l
echo "Deleted files ready for commit (above)"
```

---

## Section 8: File Count Summary

| Category | Phase | Count | Size | Status |
|----------|-------|-------|------|--------|
| Memory-Spine service | A | ~40 | ~200 MB | DELETE |
| Memory-Spine docs | A | ~8 | ~100 KB | DELETE |
| operator-ui partial (rewrite-mcp/) | A | ~15 | ~500 KB | DELETE |
| operator-ui full clone (planning-engine/apps/) | B | ~25 | ~1 MB | DELETE (veto-gated) |
| operator-ui partial (planning-engine/) | B | ~15 | ~500 KB | DELETE (veto-gated) |
| operator-ui legacy (CIP/RewriteLabs/) | B | ~15 | ~500 KB | DELETE (veto-gated) |
| planning-engine full clone | B | ~1000+ | ~500 MB | DELETE (veto-gated) |
| **TOTAL** | **A+B** | **~1100+** | **~700+ MB** | — |

---

**Status:** READY FOR REFERENCE DURING PHASE 5c EXECUTION

**Next:** Execute phases A → B per `/c/dev/PHASE_5C_REMOVAL_PLAN.md`
