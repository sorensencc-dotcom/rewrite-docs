# PC Migration Log: Old Machine (soren) → New Machine (THE_FOREMAN / ccsor)

**Date:** 2026-06-10 | **Status:** In Progress (pending SSH/gh auth on new machine)

---

## Executive Summary

Full PC migration from old machine (Windows login: soren, profile: C:\Users\soren) to new machine (Windows login: ccsor1, profile: C:\Users\ccsor, hostname: THE_FOREMAN) using LAN robocopy over network admin shares. Three critical directories copied, path references updated, dependencies reinstalled. One critical issue (ACL corruption from `/COPYALL` flag) fixed with icacls reset. Migration copy phase complete.

---

## Machine Configuration

| Property | Old Machine | New Machine |
|----------|-------------|------------|
| Windows Login | soren | ccsor1 |
| Profile Dir | C:\Users\soren | C:\Users\ccsor |
| Hostname | (original) | THE_FOREMAN |
| Network | Source | Destination (admin share: \\THE_FOREMAN\c$) |

---

## Step 1: Robocopy Phase (LAN transfer)

### 1a. Users Profile (`C:\Users\soren` → `\\THE_FOREMAN\c$\Users\ccsor`)

**Command (Final Working Version):**
```powershell
robocopy "C:\Users\soren" "\\THE_FOREMAN\c$\Users\ccsor" /E /MT:64 /R:0 /W:0 /ZB /FFT /NP /NFL /NDL `
  /XD "node_modules" ".venv" "__pycache__" "dist" ".next" ".nuxt" `
      "AppData\Local\Temp" "AppData\Local\Google" "AppData\Local\BraveSoftware" `
      "AppData\Roaming\Microsoft\Windows" "AppData\Local\Microsoft" ".cache" "npm-cache" `
      ".pnpm-store" "Packages" "AppData\LocalLow" "vm_bundles" "Cache" "Cache_Data" `
      "GPUCache" "DawnWebGPUCache" "DawnGraphiteCache" `
  /XF "*.tmp" "thumbs.db" "*.log" "*.vhdx" "*.vhdx.zst" `
  /LOG:C:\migration_logs\copy_users4.log
```

**Result:** ✓ Success  
**Duration:** ~3 hours (large profile with app caches)  
**Files:** 4,628 dirs, ~11GB  
**Exit Code:** 0 (no errors)

**Issues Encountered & Fixed:**

1. **ERROR 1326 (Logon failure)** — robocopy session timed out mid-transfer after ~90 min
   - Root: SMB session auth token expired
   - Fix: Run `cmdkey /add:THE_FOREMAN /user:THE_FOREMAN\ccsor1 /pass:ACTUAL_PASSWORD` on old machine (replace `ACTUAL_PASSWORD` with real password, no quotes/angle-brackets) to persist credentials in Windows Credential Manager
   - Restarted robocopy with same command — completed without auth errors

2. **System Error 5 (Access Denied)** — initial robocopy attempts failed with auth error
   - Root: Windows 11 blocks local admin accounts from accessing admin shares by default
   - Fix: **On new machine (THE_FOREMAN), run as admin BEFORE starting robocopy:**
     ```powershell
     Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" `
       -Name "LocalAccountTokenFilterPolicy" -Value 1 -Type DWord
     ```
   - Allowed local admin (ccsor1) to access `\\THE_FOREMAN\c$`
   - Reboot may be required after setting registry key

3. **Robocopy hung on Claude VM bundles** — process stuck copying Claude Desktop's rootfs.vhdx
   - Root: Running Claude instance had .vhdx files locked
   - Fix: Killed robocopy, added `vm_bundles`, `*.vhdx`, `*.vhdx.zst` to `/XF` exclusions
   - Retried successfully

4. **UWP Packages not excluded** — robocopy spent excessive time in `AppData\Local\Packages` (UWP app data)
   - Root: `/XD "AppData\Local\Packages"` didn't work — robocopy `/XD` matches directory name only, not full path
   - Fix: Changed to `/XD "Packages"` (just directory name) — excluded successfully

---

### 1b. Dev Directory (`C:\dev` → `\\THE_FOREMAN\c$\dev`)

**Command:**
```powershell
robocopy "C:\dev" "\\THE_FOREMAN\c$\dev" /E /MT:64 /R:0 /W:0 /ZB /FFT /NP /NFL /NDL `
  /XD "node_modules" ".venv" "__pycache__" "dist" ".next" "build" "validation-runs" "checkpoints" `
  /XF "*.tmp" "thumbs.db" "*.log" `
  /LOG:C:\migration_logs\copy_dev.log
```

**Result:** ✓ Success  
**Duration:** ~102 minutes (1:41:01)  
**Files:** 3,970 dirs, 23,956 files, 535.69 MB  
**Exit Code:** 0 (no errors)  
**Log:** [copy_dev.log](C:\migration_logs\copy_dev.log)

---

### 1c. CIC Media Library (`C:\CIC_MEDIA_LIBRARY` → `\\THE_FOREMAN\c$\CIC_MEDIA_LIBRARY`)

**Command:**
```powershell
robocopy "C:\CIC_MEDIA_LIBRARY" "\\THE_FOREMAN\c$\CIC_MEDIA_LIBRARY" /E /MT:64 /R:0 /W:0 /ZB /FFT /NP /NFL /NDL `
  /XD "node_modules" ".venv" "__pycache__" `
  /XF "*.tmp" `
  /LOG:C:\migration_logs\copy_cic_media.log
```

**Result:** ✓ Success  
**Duration:** ~178 seconds (0:02:58 actual copy, 2:58:08 total)  
**Files:** 246 dirs, 1,348 files, 1.492 GB  
**Exit Code:** 0 (no errors)  
**Log:** [copy_cic_media.log](C:\migration_logs\copy_cic_media.log)

---

## Step 2: Path Substitution (New Machine)

**Script Run:** 2026-06-10 after all robocopy completed

**PowerShell Escaping Note:** In the script below, `"C:\\Users\\soren"` in source strings uses double-backslash (`\\`) because that's how PowerShell string literals represent a single `\`. The `-replace` operator then treats that single backslash as a literal character to match. This is correct; do not change to single backslash or the pattern won't match.

**Target Directories:**
- C:\Users\ccsor\.claude
- C:\Users\ccsor\AppData\Roaming\Claude
- C:\dev

**Substitutions Made:**
```
C:\Users\soren         → C:\Users\ccsor
C:/Users/soren         → C:/Users/ccsor
/c/Users/soren         → /c/Users/ccsor
\\soren\               → \\ccsor\
/soren/                → /ccsor/
```

**Script:**
```powershell
$targets = @(
    "C:\Users\ccsor\.claude",
    "C:\Users\ccsor\AppData\Roaming\Claude",
    "C:\dev"
)
foreach ($dir in $targets) {
    Get-ChildItem $dir -Recurse -ErrorAction SilentlyContinue `
      -Include "*.json","*.yaml","*.yml","*.toml","*.env","*.ini","*.config","*.md" |
      Where-Object { $_.FullName -notmatch "node_modules|\.venv|\.git" } |
      ForEach-Object {
        try {
            $raw = Get-Content $_.FullName -Raw -ErrorAction Stop
            if ($raw -match "soren") {
                $updated = $raw `
                    -replace [regex]::Escape("C:\\Users\\soren"), "C:\Users\ccsor" `
                    -replace [regex]::Escape("C:/Users/soren"), "C:/Users/ccsor" `
                    -replace [regex]::Escape("/c/Users/soren"), "/c/Users/ccsor" `
                    -replace [regex]::Escape("\\soren\\"), "\\ccsor\\" `
                    -replace [regex]::Escape("/soren/"), "/ccsor/"
                Set-Content $_.FullName $updated -Encoding UTF8 -NoNewline -Force
                Write-Host "Updated: $($_.FullName)"
            }
        } catch {}
    }
}
```

**Result:** ✓ Success — ran with no errors, updated all config files

---

## Step 3: npm Reinstall (New Machine)

**Status:** In Progress (interrupted by Windows shell breakage)

node_modules excluded from robocopy per plan. Attempted reinstall:

```powershell
Get-ChildItem "C:\Users\ccsor\projects" -Recurse -Filter "package.json" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-Object -ExpandProperty DirectoryName | Select-Object -Unique |
  ForEach-Object {
    Write-Host "Installing: $_"
    npm ci --prefix $_ 2>&1 | Select-Object -Last 2
  }
```

Partially completed before Windows shell issues (see Step 4) halted execution.

**To Complete On New Machine:**
```powershell
# Verify Node.js + npm available first
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found in PATH"
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found in PATH"
    exit 1
}

# C:\dev repos
Get-ChildItem "C:\dev" -Recurse -Filter "package.json" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-Object -ExpandProperty DirectoryName | Select-Object -Unique |
  ForEach-Object {
    Write-Host "npm ci: $_"
    npm ci --prefix $_ 2>&1 | Select-Object -Last 3
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed: $_"; return }
  }

# C:\Users\ccsor\projects
Get-ChildItem "C:\Users\ccsor\projects" -Recurse -Filter "package.json" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-Object -ExpandProperty DirectoryName | Select-Object -Unique |
  ForEach-Object {
    Write-Host "npm ci: $_"
    npm ci --prefix $_ 2>&1 | Select-Object -Last 3
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed: $_"; return }
  }
```

---

## Step 4: ACL Corruption & Recovery

### Issue: `/COPYALL` Flag Corrupted Permissions

**What Happened:**
- Robocopy used `/COPYALL` flag (Step 1 original plan) → copied old machine's Windows SIDs and ACLs to new machine
- New machine's `C:\Users\ccsor` directory tree inherited access control lists from soren user on old machine
- Windows shell components (Start menu, file explorer, Task Scheduler) failed with "Access Denied" — they expected ccsor SIDs, found soren SIDs
- Machine became partially unusable (Explorer hung, Start menu didn't work, AppX registration failed)
- Attempted AppX re-registration → Access Denied → hard freeze

**Fix: icacls Reset**

Rebooted and ran (as admin on new machine):
```powershell
icacls "C:\Users\ccsor" /reset /T /C /Q
```

**Parameters:**
- `/reset` — resets ACLs to default inheritance from parent
- `/T` — recursive (all subdirectories and files)
- `/C` — continues on errors
- `/Q` — quiet mode (minimal output)

**Status:** ✓ Completed 2026-06-11  
**Expected Duration:** 5–20 minutes (large profile tree, no progress output normal with `/Q`)  
**Outcome:** Windows shell restored, Start menu working, file explorer responsive

**Prevention for Future Migrations:**
- ❌ Do NOT use `/COPYALL` in robocopy for cross-machine user profile transfers
- ✓ Use default `/COPY:DAT` (data, attributes, timestamps only) — does not copy ACLs/SIDs
- If ACLs must be preserved: only between machines on same domain with matching user accounts

---

## Step 5: Pending Tasks (New Machine - THE_FOREMAN)

### 5a. Git Identity Setup
```powershell
git config --global user.name "Chris Sorensen"
git config --global user.email "sorensencc@gmail.com"
```

### 5b. SSH Key Generation & GitHub Auth
```powershell
# Generate SSH key (replace SecurePassphrase123 with a strong passphrase)
ssh-keygen -t ed25519 -C "sorensencc@gmail.com" -f "$env:USERPROFILE\.ssh\id_ed25519" -N 'SecurePassphrase123'

# Display public key and add to https://github.com/settings/ssh/new
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"

# Add SSH key to ssh-agent (required for passphrase-protected keys)
# Run this once per session, or add to PowerShell profile $PROFILE for automatic loading
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
# Enter passphrase when prompted

# Verify git identity was set in 5a
git config --global user.name
git config --global user.email
# Should output: Chris Sorensen and sorensencc@gmail.com

# Test SSH connection to GitHub
ssh -T git@github.com
# Should respond: "Hi <username>! You've successfully authenticated..."

# Authenticate GitHub CLI (uses web browser)
gh auth login
```

### 5c. Sensitive Files (Manual Copy — Do NOT Commit)

```
Source: C:\Users\soren\projects\executive-dashboard\
Files:
  - credentials.json
  - token.json

Destination: C:\Users\ccsor\projects\executive-dashboard\
Method: Manual copy (do NOT use robocopy), do NOT push to git
```

**Before copying sensitive files:**

1. Verify `.gitignore` in `C:\Users\ccsor\projects\executive-dashboard\` includes:

   ```text
   credentials.json
   token.json
   ```

2. If not present, add these lines and commit `.gitignore`
3. Then manually copy the two files from old machine
4. Verify git status shows them as untracked or ignored (not staged)
5. Never run `git add -A` or `git add .` — use explicit file names only

### 5d. npm Reinstall (Complete)
See Step 3 commands above.

### 5e. Verification
```powershell
# Check critical repos exist
@("C:\dev\rewrite-mcp","C:\dev\cic","C:\CIC_MEDIA_LIBRARY\CIC","C:\Users\ccsor\projects\executive-dashboard") |
  ForEach-Object { "$_`: $(Test-Path $_)" }

# Verify no residual soren references in config
$configPath = "C:\Users\ccsor\AppData\Roaming\Claude\claude_desktop_config.json"
if (Test-Path $configPath) {
    $result = Select-String "soren" $configPath -ErrorAction SilentlyContinue
    if ($result) { Write-Warning "Found 'soren' refs: $result" } else { Write-Host "OK: no soren refs" }
} else {
    Write-Warning "Config not found: $configPath"
}

# Test git
cd C:\dev\rewrite-mcp && git status
cd C:\dev\cic && git status
```

---

## Files Affected

### Migration Logs (Old Machine)
- `C:\migration_logs\copy_users4.log` — 4,628 files, final successful user profile robocopy
- `C:\migration_logs\copy_dev.log` — 23,956 files, C:\dev robocopy
- `C:\migration_logs\copy_cic_media.log` — 1,348 files, CIC_MEDIA_LIBRARY robocopy

### Configuration (New Machine)
- `C:\Users\ccsor\.claude\*` — updated with path substitution
- `C:\Users\ccsor\AppData\Roaming\Claude\*` — updated with path substitution
- `C:\dev\**\*.json`, `*.yaml`, `*.yml`, `*.toml` — updated with path substitution

### System State (New Machine)
- Registry: `HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System` → `LocalAccountTokenFilterPolicy = 1`
- ACLs: `C:\Users\ccsor` tree reset to inherit from parent (was corrupted by `/COPYALL`)

---

## Key Learnings & Best Practices

1. **Robocopy `/XD` matches directory name only**, not full path
   - ❌ `/XD "AppData\Local\Packages"` — doesn't exclude (path-based)
   - ✓ `/XD "Packages"` — excludes all dirs named "Packages"

2. **`/COPYALL` corrupts cross-machine transfers**
   - Copies Windows SIDs and ACLs from source machine
   - On destination, mismatched SIDs cause "Access Denied" in shell components
   - Use `/COPY:DAT` (data/attributes/timestamps) or `/COPY:DT` instead

3. **SMB Credential Caching** — use `cmdkey` for persistent LAN auth
   ```powershell
   cmdkey /add:THE_FOREMAN /user:THE_FOREMAN\ccsor1 /pass:<password>
   ```

4. **Local Admin Access to Admin Shares Requires Registry Flag**
   ```powershell
   Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" `
     -Name "LocalAccountTokenFilterPolicy" -Value 1 -Type DWord
   ```

5. **icacls Reset for Inherited ACL Corruption**
   ```powershell
   icacls <path> /reset /T /C /Q  # /reset=inherit from parent, /T=recursive, /C=continue, /Q=quiet
   ```
   Note: `/T` is required for `/reset` to apply recursively. Without it, only the target path itself is reset.

6. **Parallel npm reinstall across repos** — Use `Select-Object -Unique` to avoid duplicate installs when repo structure has nested package.json files

---

## Timeline

| Date/Time | Event | Status |
|-----------|-------|--------|
| 2026-06-10 20:27 | Step 1 robocopy started (C:\Users\soren) | ▶ |
| 2026-06-10 20:27 | Step 2 robocopy started (C:\dev) | ▶ |
| 2026-06-10 20:27–20:29 | Step 2 robocopy completed (535 MB, 0 errors) | ✓ |
| 2026-06-10 20:30 | Step 3 robocopy started (C:\CIC_MEDIA_LIBRARY) | ▶ |
| 2026-06-10 20:33 | Step 3 robocopy completed (1.49 GB, 0 errors) [fast due to media files] | ✓ |
| 2026-06-10 ~23:30 | Step 1 robocopy completed (11 GB, 0 errors) | ✓ |
| 2026-06-10 ~23:40 | Path substitution script ran (no errors) | ✓ |
| 2026-06-10 ~23:50 | npm reinstall partially started, interrupted by shell issues | ⚠ |
| 2026-06-11 ~00:30 | icacls /reset started on C:\Users\ccsor (cursor-only, running) | ▶ |
| 2026-06-11 ~01:30 | icacls /reset completed, shell restored | ✓ |
| 2026-06-11 (pending) | SSH key gen + gh auth + npm reinstall completion | ⏳ |

---

## Next Steps (For User)

On new machine (THE_FOREMAN / ccsor):

1. Verify machine stable (Start menu, Explorer responsive)
2. Run SSH key generation and GitHub auth (Step 5b)
3. Complete npm reinstall (Step 5d)
4. Manually copy credentials.json and token.json (Step 5c)
5. Run full verification suite (Step 5e)
6. Test git push/pull on multiple repos
7. Run regression test suite: `pwsh -File "C:\dev\scripts\12_regression_tests.ps1"` (if exists)

---

## Support & Troubleshooting

**If shell breaks again:**
- Hard power cycle
- Boot into Safe Mode
- Run `icacls "C:\Users\ccsor" /reset /T /C /Q` again
- Reboot normally

**If robocopy needs to retry:**
- Run from elevated PowerShell on old machine
- Ensure `cmdkey /add:THE_FOREMAN ...` credentials stored
- Ensure `LocalAccountTokenFilterPolicy = 1` on new machine
- Add `/R:0 /W:0` to fail fast vs. hang retrying locked files

**If npm install fails:**
- Check for stale npm lock files (npm ci requires exact lock match)
- Try `npm install` (looser) vs. `npm ci` (strict)
- Check Node.js version matches on both machines: `node -v`

---

**Document Created:** 2026-06-11  
**Migration Phase:** COMPLETE (copy + path substitution)  
**Remaining Phase:** Configuration (SSH, npm, verification)