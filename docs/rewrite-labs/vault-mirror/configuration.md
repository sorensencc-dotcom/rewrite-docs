---
title: "Configuration"
summary: "# Vault Sync Configuration Guide"
created: "2026-07-03T19:43:46.124Z"
updated: "2026-07-03T19:43:46.124Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Vault Sync Configuration Guide

## Overview

This guide explains how to configure and operate the dual-vault sync system for CIC (Cast Iron Charlie) and Rewrite Labs reference documentation.

## Quick Start

### For CIC (Already Configured)

CIC documents are synced automatically. Current status:
- Source: OneDrive/Drive (configured)
- Destination: `C:\dev\cic-ref\`
- Last Synced: 2026-07-02 10:42:39
- Status: Active

### For Rewrite Labs (Configuration Required)

Before enabling RL sync, you must:

1. **Identify RL Documentation Source**
   - Confirm location: OneDrive, Google Drive, GitHub, or local
   - Get access/permissions if required
   - Document the exact path or repository URL

2. **Update Configuration**
   ```json
   {
     "name": "RewriteLabs",
     "source": "YOUR_RL_DOCS_PATH_HERE",
     "destination": "C:\\dev\\rl-ref",
     "enabled": true
   }
   ```

3. **Test Sync**
   ```powershell
   .\sync-vault.ps1 -System rl -DryRun -Verbose
   ```

4. **Enable Automated Sync**
   - Update configuration to `"enabled": true`
   - Schedule periodic syncs (see Automation section)

## Configuration Files

### Main Configuration: `vault-sync-config.json`

```json
{
  "vaults": [
    {
      "name": "CIC",
      "source": "onedrive://path/to/cic-docs",
      "destination": "C:\\dev\\cic-ref",
      "enabled": true,
      "sourceType": "onedrive",
      "patterns": ["*.md"],
      "syncSchedule": "daily"
    },
    {
      "name": "RewriteLabs",
      "source": "PENDING_CONFIGURATION",
      "destination": "C:\\dev\\rl-ref",
      "enabled": false,
      "sourceType": "onedrive"
    }
  ],
  "architecture": {
    "enabled": true,
    "folders": [
      "C:\\dev\\architecture\\cic-patterns",
      "C:\\dev\\architecture\\rl-patterns"
    ]
  }
}
```

**Configuration Fields:**

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Vault identifier | `"CIC"`, `"RewriteLabs"` |
| `source` | Documentation source path | `"onedrive://..."` or `"C:\\local\\path"` |
| `destination` | Local mirror path | `"C:\\dev\\cic-ref"` |
| `enabled` | Sync enabled? | `true` or `false` |
| `sourceType` | Source system | `onedrive`, `googledrive`, `github`, `local` |
| `patterns` | File patterns to sync | `["*.md", "BUILD-*.md"]` |
| `syncSchedule` | Sync frequency | `"hourly"`, `"daily"`, `"weekly"` |

## Source Types & Setup

### OneDrive

**Prerequisites:**
- Microsoft Graph API credentials
- OneDrive/SharePoint access

**Configuration:**
```json
{
  "sourceType": "onedrive",
  "source": "onedrive://drive-id/folder-id",
  "requiresAuth": true
}
```

**Setup Steps:**
1. Register app in Azure AD
2. Obtain client ID and secret
3. Set environment variables:
   ```powershell
   $env:GRAPH_CLIENT_ID = "your-client-id"
   $env:GRAPH_CLIENT_SECRET = "your-client-secret"
   ```

### Google Drive

**Prerequisites:**
- Google Cloud project
- OAuth 2.0 credentials

**Configuration:**
```json
{
  "sourceType": "googledrive",
  "source": "gdrive://folder-id",
  "requiresAuth": true
}
```

**Status:** Not yet implemented (template ready)

### GitHub

**Prerequisites:**
- GitHub repository access
- Personal access token

**Configuration:**
```json
{
  "sourceType": "github",
  "source": "github://username/repo/docs-folder",
  "requiresAuth": true
}
```

**Status:** Not yet implemented (template ready)

### Local Filesystem

**Prerequisites:**
- Local folder access
- Read permissions

**Configuration:**
```json
{
  "sourceType": "local",
  "source": "C:\\path\\to\\docs",
  "requiresAuth": false
}
```

**Use Case:** Testing, development, or manual syncs

## Running Sync Scripts

### PowerShell (Windows)

**Basic sync (all vaults):**
```powershell
cd C:\dev
.\sync-vault.ps1
```

**Sync specific system:**
```powershell
# Sync only CIC
.\sync-vault.ps1 -System cic

# Sync only Rewrite Labs
.\sync-vault.ps1 -System rl
```

**Dry run (preview changes):**
```powershell
.\sync-vault.ps1 -System all -DryRun -Verbose
```

**With logging:**
```powershell
.\sync-vault.ps1 -Verbose
```

Log output: `C:\dev\vault-sync.log`

### Bash/Shell (Linux/macOS/WSL)

**Basic sync:**
```bash
cd /dev
./sync-vault.sh
```

**Sync specific system:**
```bash
./sync-vault.sh --system cic
./sync-vault.sh --system rl
```

**Dry run:**
```bash
./sync-vault.sh --dry-run --verbose
```

**With help:**
```bash
./sync-vault.sh --help
```

## Automation

### Windows Task Scheduler

**Create scheduled task:**
```powershell
# Run as Administrator
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-File C:\dev\sync-vault.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 06:00

Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Vault Sync" -Description "Sync CIC and RL docs"
```

**Manual trigger:**
```powershell
Start-ScheduledTask -TaskName "Vault Sync"
```

### Linux/macOS Cron

**Edit crontab:**
```bash
crontab -e
```

**Add daily sync at 6 AM:**
```cron
0 6 * * * cd /dev && ./sync-vault.sh >> vault-sync.log 2>&1
```

**Add hourly sync:**
```cron
0 * * * * cd /dev && ./sync-vault.sh >> vault-sync.log 2>&1
```

## Vault Index Management

### Main Index Files

1. **`00-INDEX.md`** - Original CIC-only index
   - Links to CIC reference documents
   - Legacy format (preserved for compatibility)

2. **`00-RL-INDEX.md`** - New dual-system index
   - Links to both CIC and RL documents
   - Cross-system comparisons
   - Architecture pattern sections
   - Recommended for new work

### Updating Indices

**Automatic Updates:**
- Sync scripts automatically update timestamps
- Index files updated after each successful sync

**Manual Updates:**
```powershell
# Update timestamps manually
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
(Get-Content "00-RL-INDEX.md") -replace 'Last Modified:.*', "Last Modified: $timestamp" | `
    Set-Content "00-RL-INDEX.md"
```

## Folder Structure

**Current Structure:**
```
C:\dev\
├── 00-INDEX.md                      # CIC-only index
├── 00-RL-INDEX.md                   # Dual-system index
├── RL-VAULT-SETUP.md                # RL setup guide
├── VAULT-SYNC-CONFIGURATION.md      # This file
├── vault-sync-config.json           # Configuration file
├── sync-vault.ps1                   # PowerShell sync script
├── sync-vault.sh                    # Bash sync script
│
├── cic-ref/                         # CIC synced documents
│   ├── BUILD-SUMMARY.md
│   ├── AGENTS.md
│   ├── AGENTS_API.md
│   ├── CIC_ENV_REFERENCE.md
│   ├── CIC_RUNTIME_OBSERVABILITY_PLAN.md
│   ├── CIC_TOKEN_PACK_v2_0_FULL_LIST.md
│   └── ROADMAP.md
│
├── rl-ref/                          # RL synced documents (pending)
│   └── [Awaiting sync]
│
└── architecture/                    # Design patterns
    ├── cic-patterns/                # CIC architectural patterns
    │   └── README.md
    └── rl-patterns/                 # RL architectural patterns
        └── README.md
```

## Logging & Debugging

### Log File Location

Windows PowerShell: `C:\dev\vault-sync.log`  
Bash/Linux: `/dev/vault-sync.log`

### View Recent Logs

**PowerShell:**
```powershell
Get-Content C:\dev\vault-sync.log -Tail 20
```

**Bash:**
```bash
tail -20 /dev/vault-sync.log
```

### Common Issues

#### Issue: "Source not found"
**Cause:** OneDrive path incorrectly configured  
**Solution:** Verify OneDrive path in `vault-sync-config.json`

#### Issue: "Permission denied"
**Cause:** Missing read permissions on source  
**Solution:** Check file/folder permissions; verify service account access

#### Issue: Sync script not executing
**Cause:** PowerShell execution policy  
**Solution:** 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Environment Variables

**Optional configuration via environment:**

```powershell
# PowerShell
$env:CIC_DOCS_SOURCE = "C:\path\to\cic\docs"
$env:RL_DOCS_SOURCE = "C:\path\to\rl\docs"
$env:VAULT_SYNC_DRY_RUN = "true"
```

```bash
# Bash
export CIC_DOCS_SOURCE="/path/to/cic/docs"
export RL_DOCS_SOURCE="/path/to/rl/docs"
export VAULT_SYNC_DRY_RUN="true"
```

## Best Practices

1. **Always test with `--dry-run` first**
   ```powershell
   ./sync-vault.ps1 -DryRun -Verbose
   ```

2. **Review sync logs after each run**
   ```powershell
   Get-Content C:\dev\vault-sync.log -Tail 50
   ```

3. **Backup before major configuration changes**
   ```powershell
   Copy-Item vault-sync-config.json vault-sync-config.json.backup
   ```

4. **Version control configuration**
   ```bash
   git add vault-sync-config.json
   git commit -m "Update vault sync configuration"
   ```

5. **Document RL source location**
   - Record in `RL-VAULT-SETUP.md`
   - Share with team
   - Include in project README

## Troubleshooting Checklist

- [ ] Configuration file exists and is valid JSON
- [ ] Source paths are correct and accessible
- [ ] Destination folders have write permissions
- [ ] OneDrive/Cloud storage is accessible
- [ ] Network connectivity is stable
- [ ] Credentials/tokens are valid and not expired
- [ ] File patterns in config match documentation names
- [ ] Log file is readable (check file permissions)
- [ ] Enough disk space in destination folder
- [ ] No conflicting file locks or processes

## Next Steps

1. **Determine RL Documentation Source**
   - Confirm OneDrive, Drive, or GitHub location
   - Update `RL-VAULT-SETUP.md` with source path

2. **Update `vault-sync-config.json`**
   - Replace `"PENDING_CONFIRMATION"` with actual RL source path
   - Set `"enabled": true` for RewriteLabs vault

3. **Test RL Sync**
   ```powershell
   .\sync-vault.ps1 -System rl -DryRun
   ```

4. **Enable Automated Sync**
   - Schedule daily sync via Task Scheduler or cron
   - Verify timestamps update after each run

5. **Populate Architecture Folders**
   - Add CIC design pattern documents
   - Add RL design pattern documents
   - Create cross-system comparison documents

6. **Share Configuration**
   - Add this guide to project wiki
   - Share sync script with team
   - Document RL source location for everyone

## Support

For issues or questions:
- Check `vault-sync.log` for error details
- Review this configuration guide
- See `RL-VAULT-SETUP.md` for architecture overview
- Consult `00-RL-INDEX.md` for vault structure

---

**Last Updated:** 2026-07-02  
**Version:** 1.0  
**Maintainer:** sorensencc@gmail.com
