# Vault Implementation Setup Instructions

## Status: Ready to Deploy

**Created:** 2026-07-02  
**Status:** All infrastructure created and ready for RL documentation sync  
**CIC Status:** Synced and operational  
**RL Status:** Configuration ready, awaiting documentation source confirmation

---

## What Was Created

### 1. Folder Structure
✓ `C:\dev\cic-ref\` - CIC reference documents (populated)  
✓ `C:\dev\rl-ref\` - RL reference documents (empty, ready)  
✓ `C:\dev\architecture\` - Design patterns folder (empty, ready)  
  - `architecture\cic-patterns\` - CIC patterns (ready)  
  - `architecture\rl-patterns\` - RL patterns (ready)

### 2. Documentation Files Created
✓ `00-RL-INDEX.md` - Dual-system vault index with cross-references  
✓ `RL-VAULT-SETUP.md` - RL vault setup and configuration guide  
✓ `VAULT-SYNC-CONFIGURATION.md` - Complete sync configuration guide  
✓ `IMPLEMENTATION-SETUP.md` - This file  

### 3. Sync Scripts Created
✓ `sync-vault.ps1` - PowerShell sync script for Windows  
✓ `sync-vault.sh` - Bash sync script for Linux/macOS/WSL  
✓ `vault-sync-config.json` - Configuration template for both systems

### 4. Features Included
✓ Dual-vault support (CIC + RL)  
✓ Multiple source types (OneDrive, Google Drive, GitHub, local)  
✓ Dry-run capability for safe testing  
✓ Comprehensive logging  
✓ Architecture folder management  
✓ Index file auto-update with timestamps  
✓ Cross-system query support  

---

## Deployment Checklist

### Phase 1: Verify Installation ✓

- [x] Folder structure created (`cic-ref/`, `rl-ref/`, `architecture/`)
- [x] Documentation files present
- [x] Sync scripts available
- [x] Configuration template created

### Phase 2: Determine RL Documentation Location

**Action Required:** You must complete this step

Options:

**Option A: OneDrive/SharePoint**
- Location: `https://microsoft.sharepoint.com/sites/.../Shared Documents/RL Docs`
- Action:
  1. Confirm exact folder path
  2. Get OneDrive folder ID or direct path
  3. Update `vault-sync-config.json`:
     ```json
     "source": "onedrive://drive-id/folder-id"
     ```
  4. Set up Microsoft Graph API credentials (if needed)

**Option B: Google Drive**
- Location: `https://drive.google.com/drive/folders/...`
- Action:
  1. Confirm folder ID
  2. Update `vault-sync-config.json`:
     ```json
     "sourceType": "googledrive",
     "source": "gdrive://folder-id"
     ```
  3. Set up Google OAuth credentials

**Option C: GitHub Repository**
- Location: `https://github.com/...`
- Action:
  1. Confirm repository and path
  2. Update `vault-sync-config.json`:
     ```json
     "sourceType": "github",
     "source": "github://owner/repo/path"
     ```
  3. Set up GitHub token if private repo

**Option D: Local Folder**
- Location: `C:\path\to\rl\docs` or network share
- Action:
  1. Verify folder is accessible
  2. Update `vault-sync-config.json`:
     ```json
     "sourceType": "local",
     "source": "C:\\path\\to\\rl\\docs"
     ```

### Phase 3: Configure Sync Script

**File:** `C:\dev\vault-sync-config.json`

**Steps:**

1. Open configuration file
2. Locate the `RewriteLabs` vault section:
   ```json
   {
     "name": "RewriteLabs",
     "source": "PENDING_CONFIRMATION",  // REPLACE THIS
     "destination": "C:\\dev\\rl-ref",
     "enabled": false,  // SET TO true WHEN READY
     "sourceType": "onedrive"  // ADJUST IF NEEDED
   }
   ```

3. Update fields:
   - `source`: Replace with actual RL docs location
   - `sourceType`: Adjust based on source (onedrive, googledrive, github, local)
   - `enabled`: Change to `true` when ready to sync
   - `patterns`: Adjust file patterns if needed (default: `["*.md"]`)

4. Save file

**Example - OneDrive Source:**
```json
{
  "name": "RewriteLabs",
  "description": "Rewrite Labs Reference Documentation",
  "source": "onedrive://12345-abc-def-ghi/jkl-mno-pqr",
  "destination": "C:\\dev\\rl-ref",
  "enabled": true,
  "sourceType": "onedrive",
  "patterns": ["*.md"],
  "syncSchedule": "daily"
}
```

### Phase 4: Test Sync (Before Enabling)

**Windows (PowerShell):**

```powershell
cd C:\dev

# Test with dry-run (no changes made)
.\sync-vault.ps1 -System rl -DryRun -Verbose

# Review output and logs
Get-Content vault-sync.log -Tail 50
```

**Linux/macOS (Bash):**

```bash
cd /dev

# Make script executable
chmod +x sync-vault.sh

# Test with dry-run
./sync-vault.sh --system rl --dry-run --verbose

# Review logs
tail -50 vault-sync.log
```

**Expected Output:**
```
[2026-07-02 HH:MM:SS] [INFO] === Vault Sync Started ===
[2026-07-02 HH:MM:SS] [INFO] System: rl | DryRun: True
[2026-07-02 HH:MM:SS] [INFO] Checking RewriteLabs structure...
[2026-07-02 HH:MM:SS] [INFO] Syncing RewriteLabs from [source]...
[2026-07-02 HH:MM:SS] [WARNING] [Appropriate message for your source type]
[2026-07-02 HH:MM:SS] [INFO] === Vault Sync Completed ===
```

### Phase 5: First Real Sync

Once dry-run succeeds and configuration is correct:

**Windows:**
```powershell
.\sync-vault.ps1 -System rl
```

**Linux/macOS:**
```bash
./sync-vault.sh --system rl
```

**Verify:**
```powershell
# Check RL folder populated
Get-ChildItem C:\dev\rl-ref
```

### Phase 6: Enable Automated Sync

**Windows Task Scheduler:**

```powershell
# Create scheduled task (Run as Administrator)
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-File C:\dev\sync-vault.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 06:00

Register-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -TaskName "Vault Sync - CIC & RL" `
    -Description "Daily sync of reference documentation"
```

**Linux/macOS Cron:**

```bash
# Edit cron schedule
crontab -e

# Add line (daily at 6 AM):
0 6 * * * cd /dev && ./sync-vault.sh >> vault-sync.log 2>&1
```

### Phase 7: Populate Architecture Folders

Create CIC and RL architecture pattern documents:

**CIC Patterns:** `C:\dev\architecture\cic-patterns\`
- `cic-extraction-pipeline.md` - Extraction workflow
- `cic-token-optimization.md` - Token management patterns
- `cic-agent-orchestration.md` - Agent coordination

**RL Patterns:** `C:\dev\architecture\rl-patterns\`
- `rl-generation-pipeline.md` - Generation workflow
- `rl-content-synthesis.md` - Content generation patterns
- `rl-quality-assurance.md` - QA frameworks

**Cross-System:** `C:\dev\architecture\`
- `extraction-vs-generation-comparison.md` - Side-by-side analysis
- `token-strategy-comparison.md` - Token handling differences
- `architecture-patterns-index.md` - Pattern reference guide

### Phase 8: Update Index Files

**Update `00-RL-INDEX.md`:**

Once RL docs are synced:
1. Replace placeholder sections with actual document links
2. Update Quick Reference table with real paths
3. Verify all links work

Example before/after:

**Before:**
```markdown
### Planned Sections
- **RL System Overview** — [Awaiting sync]
```

**After:**
```markdown
### Rewrite Labs Reference Architecture
- [[rl-ref/SYSTEM-OVERVIEW|RL System Overview]] — Generation architecture
- [[rl-ref/AGENTS|RL Agents]] — Agent framework
```

---

## File Verification Checklist

After setup, verify these files exist:

```
C:\dev\
├── [x] 00-INDEX.md                        (Original CIC index)
├── [x] 00-RL-INDEX.md                    (Dual-system index)
├── [x] RL-VAULT-SETUP.md                 (Setup guide)
├── [x] VAULT-SYNC-CONFIGURATION.md       (Configuration guide)
├── [x] IMPLEMENTATION-SETUP.md            (This file)
├── [x] vault-sync-config.json            (Configuration)
├── [x] sync-vault.ps1                    (PowerShell script)
├── [x] sync-vault.sh                     (Bash script)
├── [x] cic-ref/                          (CIC docs folder)
│   ├── [x] BUILD-SUMMARY.md
│   ├── [x] AGENTS.md
│   ├── [x] AGENTS_API.md
│   ├── [x] CIC_ENV_REFERENCE.md
│   ├── [x] CIC_RUNTIME_OBSERVABILITY_PLAN.md
│   ├── [x] CIC_TOKEN_PACK_v2_0_FULL_LIST.md
│   └── [x] ROADMAP.md
├── [x] rl-ref/                           (RL docs folder - ready)
└── [x] architecture/                     (Design patterns)
    ├── [x] cic-patterns/
    └── [x] rl-patterns/
```

---

## Quick Start Guide (After Setup)

### For Regular Users

**Check documentation:**
```powershell
# View CIC docs
Get-ChildItem C:\dev\cic-ref

# View RL docs
Get-ChildItem C:\dev\rl-ref

# Browse vault index
notepad C:\dev\00-RL-INDEX.md
```

**Run sync (if you have admin access):**
```powershell
C:\dev\sync-vault.ps1
```

### For Administrators

**Review sync status:**
```powershell
Get-Content C:\dev\vault-sync.log -Tail 20
```

**Trigger manual sync:**
```powershell
# Sync both systems
.\sync-vault.ps1

# Sync just RL
.\sync-vault.ps1 -System rl

# Test before syncing
.\sync-vault.ps1 -DryRun -Verbose
```

**Check automated schedule:**
```powershell
Get-ScheduledTask -TaskName "Vault Sync*"
```

---

## Cross-System Query Examples

Once fully configured, enable queries like:

**1. Compare Extraction vs. Generation**
```
"How does CIC's extraction approach (cic-ref/BUILD-SUMMARY) 
 differ from RL's generation approach (rl-ref/ARCHITECTURE)?"
```

**2. Token Management Strategies**
```
"Compare token optimization in CIC (cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST)
 vs. RL's token strategy (rl-ref/TOKEN-MANAGEMENT)"
```

**3. Runtime Observability**
```
"What observability patterns do CIC (cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN)
 and RL (rl-ref/OBSERVABILITY) use?"
```

**4. Agent Architecture**
```
"How do CIC agents (cic-ref/AGENTS) and RL agents compare in design?"
```

---

## Troubleshooting

### Problem: Script won't run

**Windows PowerShell:**
```powershell
# Check execution policy
Get-ExecutionPolicy

# If Restricted, change it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Linux/bash:**
```bash
# Make executable
chmod +x sync-vault.sh

# Run with explicit bash
bash sync-vault.sh
```

### Problem: Can't find configuration

Ensure `vault-sync-config.json` is in the same directory as the sync script.

```powershell
# Verify
Get-Item C:\dev\vault-sync-config.json
```

### Problem: Source not found

1. Verify `vault-sync-config.json` has correct source path
2. Check network/cloud storage accessibility
3. Confirm credentials/permissions
4. Review logs: `vault-sync.log`

### Problem: Sync fails with permission error

1. Check file/folder permissions
2. Verify service account has read access to source
3. Verify write access to `C:\dev\rl-ref`
4. Run script as administrator (if required)

---

## Next Actions

1. **Determine RL Documentation Location** (Required)
   - Identify source: OneDrive, Drive, GitHub, local
   - Document exact path/URL
   - Update in issue/task tracking

2. **Update `vault-sync-config.json`** (Required)
   - Configure RL source path
   - Set `"enabled": true` for RewriteLabs
   - Test with dry-run

3. **Enable Automated Sync** (Recommended)
   - Schedule daily sync
   - Verify runs correctly
   - Monitor logs

4. **Populate Architecture Folders** (Optional)
   - Create CIC pattern documents
   - Create RL pattern documents
   - Add cross-system comparisons

5. **Share with Team** (Recommended)
   - Distribute this guide
   - Document RL source location
   - Provide vault access instructions

---

## Support & Questions

- **Sync Script Issues:** See `VAULT-SYNC-CONFIGURATION.md`
- **RL Setup Questions:** See `RL-VAULT-SETUP.md`
- **Vault Structure:** See `00-RL-INDEX.md`
- **Logs:** Check `vault-sync.log` for detailed error messages

---

**Created:** 2026-07-02  
**Status:** Implementation-Ready  
**Maintainer:** sorensencc@gmail.com  
**Version:** 1.0
