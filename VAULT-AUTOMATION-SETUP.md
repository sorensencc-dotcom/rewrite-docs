# Vault Sync Automation Setup

Complete guide for integrating vault sync into Task Scheduler (Windows) and CI/CD (GitHub Actions).

## Quick Start

### Task Scheduler (One-Time Setup)

```powershell
# Run as Administrator
cd C:\dev
.\scripts\register-vault-sync-task.ps1

# Sync RL vault only at 10:00 UTC
.\scripts\register-vault-sync-task.ps1 -Schedule "10:00" -System rl

# Replace existing task
.\scripts\register-vault-sync-task.ps1 -Force
```

### GitHub Actions (Already Wired)

Workflow: `.github/workflows/vault-sync.yml`
- Triggers: Daily at 09:00 UTC + manual dispatch
- Logs: Uploaded as run artifacts
- Commits: Auto-commits changes with timestamp

## Architecture

```
┌─────────────────────────────────────────┐
│     Vault Sync Orchestration            │
├─────────────────────────────────────────┤
│ Entry Point: sync-vault.ps1             │
│  - Loads config from vault-sync-config  │
│  - Dispatches by -System param          │
│  - Routes: CIC, RewriteLabs, all        │
└──────┬──────────────────────────────────┘
       │
       ├─────────────────────────┬────────────────────────┐
       │                         │                        │
       ▼                         ▼                        ▼
   Task Scheduler         GitHub Actions            Manual Dispatch
   (register-vault-      (vault-sync.yml)           (.\sync-vault.ps1)
    sync-task.ps1)       - Daily 09:00 UTC
   - Daily 09:00 UTC     - Workflow dispatch
   - Logs to file        - Auto-commit changes
   - User interactive    - Artifact retention
```

## Task Scheduler Details

### Registration

**File:** `scripts/register-vault-sync-task.ps1`

**Parameters:**
- `-Schedule "HH:MM"` — Execution time (default: 09:00)
- `-System all|cic|rl` — Which vault(s) to sync (default: all)
- `-Force` — Replace existing task

**Output:**
- Task path: `\CIC\`
- Task name: `CIC-Vault-Sync-{system}`
- Trigger: Daily at specified time
- Action: PowerShell with `-NoProfile -ExecutionPolicy Bypass`
- Logs: `C:\dev\vault-sync.log` (retained 30 days)

### Verification

```powershell
# List all vault sync tasks
Get-ScheduledTask -TaskPath "\CIC\" -TaskName "*Vault-Sync*" | `
  Select-Object TaskName, State, @{N="NextRun";E={(Get-ScheduledTaskInfo -Task $_).NextRunTime}}

# View task details
Get-ScheduledTask -TaskName "CIC-Vault-Sync-all" -TaskPath "\CIC\" | Get-ScheduledTaskInfo

# Run task manually
Start-ScheduledTask -TaskName "CIC-Vault-Sync-all" -TaskPath "\CIC\"

# View execution history
Get-ScheduledTaskInfo -TaskName "CIC-Vault-Sync-all" -TaskPath "\CIC\"
```

### Logs

All syncs logged to `vault-sync.log`:
```
[2026-07-04 10:31:04] [Success] Loaded config from C:\dev\vault-sync-config.json
[2026-07-04 10:31:04] [Info] Processing vault: RewriteLabs
[2026-07-04 10:31:04] [Info] Syncing RewriteLabs from github: https://...
[2026-07-04 10:31:04] [Success] RewriteLabs sync completed
```

**Retention:** 30 days (configured in `vault-sync-config.json`)

## GitHub Actions Details

### Workflow: `vault-sync.yml`

**Schedule:** `0 9 * * *` (09:00 UTC daily)

**Triggers:**
- Scheduled: Daily at 09:00 UTC
- Manual: `workflow_dispatch` with inputs:
  - System: all/cic/rl
  - Verbose: true/false

**Steps:**
1. Checkout code
2. Configure git (bot account)
3. Run `sync-vault.ps1` with specified system
4. Detect changes
5. Commit & push if changes exist
6. Upload logs as artifact
7. Notify on failure

**Inputs** (manual dispatch only):
```yaml
system:     # Default: all
  options: [all, cic, rl]
verbose:    # Default: false
  type: boolean
```

**Manual Trigger:**
```
GitHub → Actions → Vault Sync → Run workflow → Select inputs → Run
```

### Logs & Artifacts

- **Step logs:** GitHub Actions UI (inline)
- **Artifacts:** `vault-sync-logs-{run_id}` 
  - Retention: GitHub default (90 days)
  - Contents: Full `vault-sync.log`

## Monitoring & Troubleshooting

### Task Scheduler Issues

| Problem | Check |
|---------|-------|
| Task not running | Verify schedule trigger in Task Scheduler GUI |
| PowerShell execution policy | Ensure `-ExecutionPolicy Bypass` in action |
| File permissions | Check `vault-sync.log` writable by task user |
| GitHub sync fails | Verify GitHub token in config if using GitHub source |

### GitHub Actions Issues

| Problem | Check |
|---------|-------|
| Workflow not triggering | Check `.github/workflows/vault-sync.yml` exists & syntax valid |
| Commit fails | Verify git config (user.email, user.name) in workflow |
| No changes to commit | Sync may have no updates — check logs artifact |
| Token issues | Use repo's default GITHUB_TOKEN (auto-provided) |

## Configuration

Both Task Scheduler and GitHub Actions use the same config:
- **File:** `vault-sync-config.json`
- **Vaults:** CIC, RewriteLabs (can add more)
- **Sources:** OneDrive, GitHub, Google Drive, local
- **Destination:** `cic-ref/`, `rl-ref/`

### Add New Vault

1. Edit `vault-sync-config.json`
2. Add entry to `vaults[]`:
   ```json
   {
     "name": "MyVault",
     "source": "https://...",
     "destination": "./my-ref",
     "enabled": true,
     "sourceType": "github",
     "patterns": ["*.md"]
   }
   ```
3. Update Task Scheduler task if needed
4. Test: `.\sync-vault.ps1 -System all -DryRun`

## Integration Checklist

- [ ] Run `register-vault-sync-task.ps1` (Task Scheduler)
- [ ] Verify task in Task Scheduler GUI
- [ ] Test manual run: `Start-ScheduledTask -TaskName "CIC-Vault-Sync-all"`
- [ ] Check logs: `Get-Content vault-sync.log -Tail 20`
- [ ] GitHub Actions `.github/workflows/vault-sync.yml` committed
- [ ] Test workflow dispatch: GitHub → Actions → Vault Sync → Run workflow
- [ ] Verify auto-commit on changes (check repo history)

## Related

- [RL-VAULT-SETUP.md](RL-VAULT-SETUP.md) — Vault configuration & manual sync
- [vault-sync-config.json](vault-sync-config.json) — Source of truth for vaults
- [sync-vault.ps1](sync-vault.ps1) — Main sync script
- [scripts/register-vault-sync-task.ps1](scripts/register-vault-sync-task.ps1) — Task Scheduler registration
- [.github/workflows/vault-sync.yml](.github/workflows/vault-sync.yml) — GitHub Actions automation
