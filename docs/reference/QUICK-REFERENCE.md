---
title: "QUICK REFERENCE"
summary: "# Vault Quick Reference Card"
created: "2026-07-03T19:43:46.091Z"
updated: "2026-07-03T19:43:46.091Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Vault Quick Reference Card

**Rewrite Labs Vault Mirror System**

---

## Folder Structure

```
C:\dev\
├── cic-ref/              ← CIC documents (synced)
├── rl-ref/               ← RL documents (ready)
├── architecture/
│   ├── cic-patterns/     ← CIC design patterns
│   └── rl-patterns/      ← RL design patterns
├── 00-INDEX.md           ← Original CIC index
├── 00-RL-INDEX.md        ← Dual-system index (START HERE)
├── sync-vault.ps1        ← Windows sync script
├── sync-vault.sh         ← Linux/macOS sync script
├── vault-sync-config.json ← Configuration
├── RL-VAULT-SETUP.md     ← RL setup guide
└── VAULT-SYNC-CONFIGURATION.md ← Technical guide
```

---

## Quick Commands

### Windows (PowerShell)

```powershell
# Sync all vaults
.\sync-vault.ps1

# Sync only RL
.\sync-vault.ps1 -System rl

# Test before syncing (dry-run)
.\sync-vault.ps1 -DryRun -Verbose

# View recent logs
Get-Content vault-sync.log -Tail 20
```

### Linux/macOS (Bash)

```bash
# Make executable
chmod +x sync-vault.sh

# Sync all
./sync-vault.sh

# Sync only RL
./sync-vault.sh --system rl

# Test mode
./sync-vault.sh --dry-run --verbose

# View logs
tail -20 vault-sync.log
```

---

## Configuration

### Enable RL Sync

Edit `vault-sync-config.json`:

```json
{
  "name": "RewriteLabs",
  "source": "YOUR_RL_DOCS_PATH_HERE",
  "enabled": true,
  "sourceType": "onedrive"
}
```

Replace:
- `YOUR_RL_DOCS_PATH_HERE` with actual source (e.g., OneDrive folder path)
- `onedrive` with source type if needed (googledrive, github, local)

### Test Configuration

```powershell
# Preview sync without making changes
.\sync-vault.ps1 -System rl -DryRun

# Then check logs
Get-Content vault-sync.log -Tail 10
```

---

## Status Check

### View Documents

```powershell
# List CIC docs
Get-ChildItem C:\dev\cic-ref

# List RL docs
Get-ChildItem C:\dev\rl-ref

# List architecture folders
Get-ChildItem C:\dev\architecture
```

### Check Logs

```powershell
# Last 20 lines
Get-Content vault-sync.log -Tail 20

# Search for errors
Select-String "ERROR" vault-sync.log

# Last sync timestamp
Select-String "Vault Sync" vault-sync.log | Select-Object -Last 5
```

---

## Source Type Quick Reference

### OneDrive
```json
"sourceType": "onedrive",
"source": "onedrive://drive-id/folder-id"
```
Status: Ready (needs Graph API auth)

### Google Drive
```json
"sourceType": "googledrive",
"source": "gdrive://folder-id"
```
Status: Template ready (needs OAuth)

### GitHub
```json
"sourceType": "github",
"source": "github://owner/repo/path"
```
Status: Template ready (needs token)

### Local
```json
"sourceType": "local",
"source": "C:\\path\\to\\docs"
```
Status: Fully working (use for testing)

---

## Common Tasks

### Task: Find CIC Document

```powershell
# Find by name
Get-ChildItem C:\dev\cic-ref | Where-Object { $_.Name -like "*AGENT*" }

# Result: AGENTS.md, AGENTS_API.md
```

### Task: Find RL Architecture Pattern

```bash
# Once RL docs synced:
find /dev/rl-ref -name "*.md" | grep -i architecture
```

### Task: Compare Systems

Use `00-RL-INDEX.md` Quick Reference table:
- Links to both CIC and RL docs side-by-side
- Cross-system query examples included

### Task: Schedule Daily Sync

**Windows:**
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-File C:\dev\sync-vault.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 06:00
Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Vault Sync"
```

**Linux/macOS:**
```bash
crontab -e
# Add: 0 6 * * * cd /dev && ./sync-vault.sh
```

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Script won't run | PowerShell: `Set-ExecutionPolicy RemoteSigned` |
| Can't find config | Verify `vault-sync-config.json` exists in `C:\dev` |
| Source not found | Check OneDrive path is correct |
| Permission denied | Run as admin / check folder permissions |
| No RL docs synced | Set `"enabled": true` in config |
| Sync incomplete | Check `vault-sync.log` for errors |

---

## Documentation Map

### For Setup
- **New Users:** Start with `00-RL-INDEX.md`
- **Installation:** See `IMPLEMENTATION-SETUP.md`
- **Configuration:** See `VAULT-SYNC-CONFIGURATION.md`
- **RL Specifics:** See `RL-VAULT-SETUP.md`

### For Reference
- **CIC Docs:** Browse `C:\dev\cic-ref\`
- **RL Docs:** Browse `C:\dev\rl-ref\` (after sync)
- **Patterns:** Browse `C:\dev\architecture\`
- **Full Summary:** See `DELIVERABLES-SUMMARY.md`

---

## Cross-System Queries (Examples)

**Query 1: Extraction vs. Generation**
```
Find: cic-ref/BUILD-SUMMARY.md (CIC extraction)
Compare: rl-ref/[RL architecture] (RL generation)
```

**Query 2: Token Management**
```
Find: cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md
Compare: rl-ref/[RL token strategy]
```

**Query 3: Agent Architecture**
```
Find: cic-ref/AGENTS.md + cic-ref/AGENTS_API.md
Compare: rl-ref/[RL agents]
```

**Query 4: Observability**
```
Find: cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md
Compare: rl-ref/[RL observability]
```

---

## Environment Variables (Optional)

```powershell
# PowerShell
$env:CIC_DOCS_SOURCE = "C:\path\to\cic"
$env:RL_DOCS_SOURCE = "C:\path\to\rl"
$env:VAULT_SYNC_DRY_RUN = "true"
```

```bash
# Bash
export CIC_DOCS_SOURCE="/path/to/cic"
export RL_DOCS_SOURCE="/path/to/rl"
export VAULT_SYNC_DRY_RUN="true"
```

---

## File Permissions (For Automation)

### Windows Task Scheduler
- Account: System (recommended) or user account
- Privileges: Administrator required for some paths
- Security: Run whether user is logged in or not

### Linux/macOS Cron
- Set executable: `chmod +x sync-vault.sh`
- Ensure read access to config: `chmod 644 vault-sync-config.json`
- Test: `./sync-vault.sh --dry-run`

---

## Status

| Component | Status | Last Updated |
|-----------|--------|--------------|
| CIC Sync | ✓ Active | 2026-07-02 10:42:39 |
| RL Sync | ⏳ Awaiting Config | Pending |
| Scripts | ✓ Ready | 2026-07-02 |
| Documentation | ✓ Complete | 2026-07-02 |
| Architecture | ✓ Ready | 2026-07-02 |

---

## Support

**Error?** Check `vault-sync.log`  
**Configuration?** See `VAULT-SYNC-CONFIGURATION.md`  
**Setup?** See `IMPLEMENTATION-SETUP.md`  
**Questions?** See `00-RL-INDEX.md`  

---

**Last Updated:** 2026-07-02  
**Version:** 1.0
