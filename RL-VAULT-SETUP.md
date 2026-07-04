# RL Vault Sync Setup & Automation

## Overview

Vault sync orchestrates document synchronization from remote sources (OneDrive, GitHub, local) into reference directories (`cic-ref/`, `rl-ref/`). RL (Rewrite Labs) vault filter now handles case-insensitive matching between `-System` parameter (lowercase: `cic`, `rl`) and vault.name (configured: "CIC", "RewriteLabs").

## Quick Start

```powershell
# Sync both CIC and RL vaults
.\sync-vault.ps1 -System all

# Sync only Rewrite Labs
.\sync-vault.ps1 -System rl

# Sync only CIC
.\sync-vault.ps1 -System cic

# Dry run (preview changes)
.\sync-vault.ps1 -System all -DryRun

# Verbose logging
.\sync-vault.ps1 -System rl -Verbose
```

## Configuration

Edit `vault-sync-config.json` to configure vaults:

```json
{
  "vaults": [
    {
      "name": "CIC",
      "source": "https://github.com/...",
      "destination": "./cic-ref",
      "enabled": true,
      "patterns": ["*.md"],
      "sourceType": "github"
    },
    {
      "name": "RewriteLabs",
      "source": "https://github.com/...",
      "destination": "./rl-ref",
      "enabled": true,
      "patterns": ["*.md"],
      "sourceType": "github"
    }
  ]
}
```

**Supported sourceTypes:** `onedrive`, `googledrive`, `github`, `local`

## System Parameter Mapping

| Parameter | Vault Name | Destination |
|-----------|-----------|-------------|
| `all`     | All vaults | All enabled |
| `cic`     | CIC        | `./cic-ref` |
| `rl`      | RewriteLabs | `./rl-ref` |

**Case-insensitive matching:** `-System rl` matches vault.name "RewriteLabs" via `ieq` comparison.

## Scheduled Automation

### Task Scheduler (Windows)

Create a scheduled task to run vault sync daily:

```powershell
# Run as Administrator
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -File C:\dev\sync-vault.ps1 -System all"

$trigger = New-ScheduledTaskTrigger -Daily -At "09:00"

$principal = New-ScheduledTaskPrincipal -UserID $env:USERNAME -LogonType Interactive

Register-ScheduledTask `
  -TaskName "Vault-Sync-All" `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Description "Daily vault sync for CIC and RL documents"
```

**Verify registration:**
```powershell
Get-ScheduledTask -TaskName "Vault-Sync-*" | Select-Object TaskName, State, NextRunTime
```

### CI Integration (GitHub Actions)

Add to `.github/workflows/vault-sync.yml`:

```yaml
name: Vault Sync

on:
  schedule:
    - cron: "0 9 * * *"  # 09:00 UTC daily
  workflow_dispatch:

jobs:
  sync:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run vault sync
        shell: powershell
        run: |
          .\sync-vault.ps1 -System all -Verbose
          
      - name: Commit changes
        run: |
          git config --local user.email "sync@bot.local"
          git config --local user.name "Vault Sync Bot"
          git add -A
          git commit -m "chore: sync vaults" || true
          git push
```

### Manual Triggers

**Full sync with status:**
```powershell
.\sync-vault.ps1 -System all -Verbose
```

**Dry run before committing:**
```powershell
.\sync-vault.ps1 -System all -DryRun
```

## Output

Logs written to `vault-sync.log`:
- Timestamp, level (Info/Warning/Error/Success), message
- Dry-run operations prefixed `[DRY-RUN]`
- Architecture folder creation + index updates

## Troubleshooting

| Issue | Check |
|-------|-------|
| Vault not syncing | Verify vault.enabled=true in config; Check source path/URL |
| Case sensitivity error | Ensure -System uses `all`, `cic`, or `rl` (lowercase) |
| GitHub sync fails | Check sync script at `scripts/rl-vault-sync.js`; Verify GitHub token |
| Index not updating | Verify indexFile path in config; Check file permissions |

## Related

- `vault-sync-config.json` — Main configuration
- `scripts/rl-vault-sync.js` — GitHub sync implementation
- `cic-ref/` — CIC document vault
- `rl-ref/` — RL document vault
