# Environment Optimization for Slow Filesystems

Some environments (antivirus scanning, network drives, WSL with poor sync) cause git operations and pre-commit hooks to timeout. This guide covers identification and mitigation.

## Symptoms

- `git commit` hangs for 2+ minutes
- Pre-commit hook runs past timeout (exit code 124)
- `npm install` or `npm run build` hangs indefinitely
- Filesystem operations (file read/write) take >100ms per file

## Quick Fix

For urgent commits when environment is slow:

```bash
# Bypass pre-commit hooks
git commit --no-verify

# Bypass both pre-commit and commit-msg hooks
git commit --no-verify -m "message"
```

This is safe when:
- Code already passes local type checking (`npm run build`)
- Files staged are production code (not `.env` or secrets)
- You're confident in the changes

## Root Causes

### Antivirus Scanning

Real-time scanning of node_modules/, .git/, and build artifacts causes git operations to stall.

**Mitigation:**
1. Add exclusions to antivirus:
   - `C:\dev\node_modules`
   - `C:\dev\.git`
   - `C:\dev\dist`
   - `C:\dev\build`

2. Or temporarily disable during development:
   ```powershell
   # Windows Defender (admin)
   Set-MpPreference -DisableRealtimeMonitoring $true
   ```

### Network Drives or Cloud Sync

Uncommitted changes stored on network drives or cloud-synced directories (OneDrive, Dropbox).

**Fix:** Clone to local C: drive, not network path.

### WSL with Windows Filesystem

Accessing `/mnt/c/dev` from WSL2 has poor I/O performance.

**Fix:** Use native PowerShell or cmd.exe for git operations, not WSL bash.

### Slow Disk or High I/O Contention

Mechanical HDD or system under heavy load.

**Check:**
```powershell
# Windows Task Manager → Performance → Disk
# If disk utilization >90%, close other apps
```

## Environment Variables

Disable specific checks:

```bash
# Skip TypeScript validation
export SKIP_TS_CHECK=1

# CI environment (skips TS check automatically)
export CI=1
```

## Permanent Configuration

### Git Config (recommended)

```bash
cd c:\dev

# Increase operation timeout to 5 min
git config core.longpaths true
git config core.fsmonitor true

# Increase pack timeout for clone/fetch
git config --global http.lowSpeedLimit 1000
git config --global http.lowSpeedTime 300

# Increase preloadindex for faster operations
git config core.preloadindex true
```

### Pre-commit Hook Timeout

Hook has built-in timeouts (30-60s per check). If still timing out:

```bash
# Disable TS check in slow environment
SKIP_TS_CHECK=1 git commit -m "message"
```

## Verification

Check if environment is the issue:

```powershell
# Time a git operation
Measure-Command { git status }

# If > 5 seconds: environment issue
# If < 1 second: normal

# Check disk I/O
Get-Counter -Counter "\PhysicalDisk(_Total)\% Disk Time" -Continuous
```

## For CI/CD Environments

- **GitHub Actions**: Uses fast SSD; no special config needed
- **Docker**: Volume mounts should use native driver (not wsf2)
- **Task Scheduler**: Runs as local system; should be fast

If CI jobs timeout, check runner logs for filesystem saturation.

## Debugging

Identify which operation is slow:

```bash
# Time each git operation
time git add -A
time git commit --no-verify -m "test"
time git push
```

If `git commit` is the bottleneck, it's the pre-commit hook. Rebuild your environment or use `--no-verify`.

If `git add` is slow, it's the antivirus or disk. See antivirus/network drive sections above.

## Next Steps

1. Identify your root cause (antivirus → add exclusions; network drive → move to local; WSL → use native shell)
2. Test with a dummy commit: `git commit --allow-empty -m "test"`
3. If still slow, check Task Manager → Performance → Disk/Network
4. Escalate to IT if on corporate network with aggressive endpoint protection
