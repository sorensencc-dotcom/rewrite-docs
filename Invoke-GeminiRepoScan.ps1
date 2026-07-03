# ============================================================
# Invoke-GeminiRepoScan.ps1
# Deep local multi-repo scan - feeds findings to Gemini CLI
# Author: Copilot for sorensencc-dotcom
# Usage:  .\Invoke-GeminiRepoScan.ps1 -RootPath "C:\Projects"
# ============================================================

param(
    [Parameter(Mandatory = $false)]
    [string]$RootPath = "$HOME",

    [Parameter(Mandatory = $false)]
    [string[]]$ExcludeRepos = @(),

    [Parameter(Mandatory = $false)]
    [switch]$SkipGemini,

    [Parameter(Mandatory = $false)]
    [string]$ReportPath = "$PSScriptRoot\gemini-scan-report.txt",

    [Parameter(Mandatory = $false)]
    [long]$LargeFileThresholdBytes = 1MB
)

function Write-Section($title) {
    $line = "=" * 70
    "`n$line`n  $title`n$line"
}

function Write-Sub($title) {
    $line = "-" * 50
    "`n$line`n  $title`n$line"
}

function Run-Git {
    param([string]$RepoPath, [string[]]$Args)
    try {
        $result = & git -C $RepoPath @Args 2>&1
        return $result -join "`n"
    } catch { return "[git error: $_]" }
}

$JunkDirs = @(
    "node_modules", ".venv", "venv", "__pycache__",
    "dist", "build", "out", ".next", ".nuxt",
    "coverage", "playwright-report", "test-results",
    ".planning", "_*-archive", "snapshots", ".ijfw", ".idea", "logs"
)

$SensitiveFilePatterns = @(
    ".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx",
    "*secret*", "*password*", "*credential*", "*token*",
    "claude_desktop_config.json", ".mcp.json", "*.kubeconfig"
)

$SensitiveExclusions = @(".env.example", ".env.*.example", ".env.template")

function Find-GitRepos([string]$Root) {
    Write-Host "  Discovering git repos under: $Root" -ForegroundColor Cyan
    $gitDirs = Get-ChildItem -Path $Root -Recurse -Force -Filter ".git" `
        -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer }
    $repos = @()
    foreach ($gd in $gitDirs) {
        $repoPath = $gd.Parent.FullName
        $isNested = $repos | Where-Object { $repoPath.StartsWith($_ + "\") }
        if (-not $isNested) { $repos += $repoPath }
    }
    return $repos
}

function Inspect-Repo([string]$RepoPath) {
    $name = Split-Path $RepoPath -Leaf
    $report = Write-Sub "REPO: $name  |  $RepoPath"

    $remote      = Run-Git $RepoPath @("remote", "-v")
    $branch      = Run-Git $RepoPath @("branch", "--show-current")
    $allBranches = Run-Git $RepoPath @("branch", "-vv")
    $lastCommit  = Run-Git $RepoPath @("log", "-1", "--pretty=format:%h %ar - %s", "--no-walk")

    $report += "`n[REMOTE]`n$remote"
    $report += "`n[DEFAULT BRANCH] $branch"
    $report += "`n[LAST COMMIT] $lastCommit"
    $report += "`n[ALL BRANCHES]`n$allBranches"

    # Uncommitted / untracked
    $status = Run-Git $RepoPath @("status", "--porcelain")
    if ($status) {
        $report += "`n[UNCOMMITTED / UNTRACKED FILES - $(($status -split "`n").Count) items]`n$status"
    } else {
        $report += "`n[UNCOMMITTED / UNTRACKED FILES] Clean"
    }

    # Stash
    $stash = Run-Git $RepoPath @("stash", "list")
    if ($stash) { $report += "`n[STASH - FORGOTTEN WORK]`n$stash" }

    # Local-only branches
    $localOnly = @()
    (Run-Git $RepoPath @("branch", "-vv")) -split "`n" | ForEach-Object {
        if ($_ -notmatch "\[" -and $_.Trim()) { $localOnly += $_.Trim() }
    }
    if ($localOnly) {
        $report += "`n[LOCAL-ONLY BRANCHES - never pushed]`n" + ($localOnly -join "`n")
    }

    # Unpushed commits
    $unpushed = Run-Git $RepoPath @("log", "--oneline", "@{u}..HEAD") 2>&1
    if ($unpushed -and $unpushed -notmatch "fatal|no upstream") {
        $report += "`n[UNPUSHED COMMITS]`n$unpushed"
    }

    # Nested .git dirs
    $nestedGit = Get-ChildItem -Path $RepoPath -Recurse -Force -Filter ".git" `
        -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -ne "$RepoPath\.git" }
    if ($nestedGit) {
        $report += "`n[NESTED .GIT DIRECTORIES - contamination]"
        $nestedGit | ForEach-Object { $report += "`n  " + $_.FullName.Replace($RepoPath, ".") }
    }

    # Junk dirs
    $trackedJunk = @()
    foreach ($junkDir in $JunkDirs) {
        $found = Get-ChildItem -Path $RepoPath -Recurse -Force -Directory `
            -Filter $junkDir -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch "\\\.git\\" }
        foreach ($f in $found) {
            $relPath = $f.FullName.Replace($RepoPath + "\", "").Replace("\", "/")
            $tracked = Run-Git $RepoPath @("ls-files", "--error-unmatch", $relPath) 2>&1
            $sizeMB  = [math]::Round((Get-ChildItem $f.FullName -Recurse -File `
                -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
            $state   = if ($tracked -notmatch "error") { "TRACKED IN GIT (WARNING) ${sizeMB}MB" } else { "local only - safe" }
            $trackedJunk += "  $relPath  [$state]"
        }
    }
    if ($trackedJunk) { $report += "`n[JUNK DIRECTORIES]`n" + ($trackedJunk -join "`n") }

    # Sensitive files
    $sensitiveHits = @()
    foreach ($pattern in $SensitiveFilePatterns) {
        $found = Get-ChildItem -Path $RepoPath -Recurse -Force -File `
            -Filter $pattern -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch "\\\.git\\" }
        foreach ($f in $found) {
            $skip = $SensitiveExclusions | Where-Object { $f.Name -like $_ }
            if ($skip) { continue }
            $relPath  = $f.FullName.Replace($RepoPath + "\", "")
            $tracked  = Run-Git $RepoPath @("ls-files", "--error-unmatch", $relPath.Replace("\", "/")) 2>&1
            $isTracked = $tracked -notmatch "error"
            $sizeKB   = [math]::Round($f.Length / 1KB, 1)
            $sensitiveHits += "  $relPath  [$(if($isTracked){'TRACKED IN GIT (WARNING)'}else{'local only'})]  ${sizeKB}KB"
        }
    }
    if ($sensitiveHits) { $report += "`n[SENSITIVE FILES]`n" + ($sensitiveHits -join "`n") }

    # Large tracked files
    $largeFiles = @()
    $tracked = Run-Git $RepoPath @("ls-files", "-z", "--cached") -split "`0" | Where-Object { $_ }
    foreach ($tf in $tracked) {
        $fullPath = Join-Path $RepoPath ($tf.Replace("/", "\"))
        if (Test-Path $fullPath) {
            $size = (Get-Item $fullPath -ErrorAction SilentlyContinue).Length
            if ($size -gt $LargeFileThresholdBytes) {
                $largeFiles += "  $tf  [$([math]::Round($size/1MB,2))MB]"
            }
        }
    }
    if ($largeFiles) {
        $report += "`n[LARGE FILES IN GIT (>$([math]::Round($LargeFileThresholdBytes/1MB,0))MB)]`n" + ($largeFiles -join "`n")
    }

    # Root-level clutter
    $rootFiles = Get-ChildItem -Path $RepoPath -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notin @(".gitignore", "README.md") }
    $rootMd = $rootFiles | Where-Object { $_.Extension -eq ".md" }
    $rootScripts = $rootFiles | Where-Object { $_.Extension -in @(".ps1",".sh",".bat",".py",".js",".ts") }
    if ($rootMd.Count -gt 3) {
        $report += "`n[ROOT MARKDOWN CLUTTER - $($rootMd.Count) .md files]"
        $rootMd | ForEach-Object { $report += "`n  $($_.Name)" }
    }
    if ($rootScripts.Count -gt 5) {
        $report += "`n[ROOT SCRIPT CLUTTER - $($rootScripts.Count) scripts at root]"
        $rootScripts | ForEach-Object { $report += "`n  $($_.Name)" }
    }

    # .gitignore quality
    $giPath = Join-Path $RepoPath ".gitignore"
    if (-not (Test-Path $giPath)) {
        $report += "`n[NO .GITIGNORE - missing entirely]"
    } else {
        $gi = Get-Content $giPath -Raw
        $missing = @("node_modules",".env","dist/",".venv","coverage","*.log") |
            Where-Object { $gi -notmatch [regex]::Escape($_) }
        if ($missing) { $report += "`n[.GITIGNORE MISSING] " + ($missing -join ", ") }
    }

    return $report
}

function Find-CrossRepoDuplicates([string[]]$RepoPaths) {
    $report = Write-Section "CROSS-REPO ANALYSIS"
    $allDirs = @{}
    foreach ($repo in $RepoPaths) {
        $name = Split-Path $repo -Leaf
        Get-ChildItem -Path $repo -Directory -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notmatch "^\.git$|node_modules|\.venv" } |
            ForEach-Object {
                if (-not $allDirs[$_.Name]) { $allDirs[$_.Name] = @() }
                $allDirs[$_.Name] += $name
            }
    }
    $dupes = $allDirs.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
    if ($dupes) {
        $report += "`n[DIRECTORY NAMES IN MULTIPLE REPOS]"
        foreach ($d in $dupes) {
            $report += "`n  /$($d.Key)  →  " + ($d.Value -join ", ")
        }
    }
    $report += "`n[LOCAL-ONLY REPOS - no remote]"
    $localOnly = $false
    foreach ($repo in $RepoPaths) {
        if (-not (Run-Git $repo @("remote"))) {
            $report += "`n  " + (Split-Path $repo -Leaf) + "  ($repo)"
            $localOnly = $true
        }
    }
    if (-not $localOnly) { $report += "`n  None - all repos have remotes" }
    return $report
}

# ── Main ─────────────────────────────────────────────────────

Write-Host "`n- Gemini Deep Repo Scanner`n" -ForegroundColor Green

$allReport  = Write-Section "GEMINI DEEP REPO SCAN - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$allReport += "`nRoot: $RootPath`n"

$repos = Find-GitRepos -Root $RootPath |
    Where-Object { $ExcludeRepos -notcontains (Split-Path $_ -Leaf) }

Write-Host "  Found $($repos.Count) repos`n" -ForegroundColor Cyan
$allReport += "`nREPOS ($($repos.Count)):"
$repos | ForEach-Object { $allReport += "`n  " + (Split-Path $_ -Leaf) + "  ($_)" }
$allReport += Write-Section "PER-REPO INSPECTION"

$i = 0
foreach ($repo in $repos) {
    $i++
    Write-Host "  [$i/$($repos.Count)] $( Split-Path $repo -Leaf )" -ForegroundColor Yellow
    $allReport += Inspect-Repo -RepoPath $repo
}

$allReport += Find-CrossRepoDuplicates -RepoPaths $repos
$allReport | Out-File -FilePath $ReportPath -Encoding UTF8
Write-Host "`n  ✅ Raw report: $ReportPath" -ForegroundColor Green

if (-not $SkipGemini) {
    $geminiPrompt = @"
You are auditing the local git repositories of a solo developer (sorensencc-dotcom) building the CIC and Rewrite Labs platforms.

Analyze the scan data below and produce:
1. CRITICAL ISSUES - security, credential exposure, data loss risk (exact paths)
2. HIGH ISSUES - bloated history, committed build artifacts, cross-contamination
3. MEDIUM ISSUES - structural problems, planning doc sprawl, duplicates
4. LOCAL WORK AT RISK - uncommitted changes, local-only branches, forgotten stashes
5. CROSS-REPO FINDINGS - what should be merged, split, extracted, or archived
6. SAFE CLEANUP SCRIPT - PowerShell, safe ops only (no force push)
7. HISTORY REWRITE OPS - separate list, with warnings, requires force push
8. IDEAL REPO ARCHITECTURE - recommended end-state structure

Use exact file paths and repo names from the data. Flag anything that looks like it could hold credentials.

--- SCAN DATA ---
$allReport
--- END SCAN DATA ---
"@

    $promptFile = "$env:TEMP\gemini-repo-scan-prompt.txt"
    $geminiPrompt | Out-File -FilePath $promptFile -Encoding UTF8

    $geminiCmd = Get-Command "gemini" -ErrorAction SilentlyContinue
    if (-not $geminiCmd) { $geminiCmd = Get-Command "gemini-cli" -ErrorAction SilentlyContinue }

    if ($geminiCmd) {
        $outPath = $ReportPath.Replace(".txt", "-gemini-analysis.txt")
        Write-Host "  Running Gemini analysis..." -ForegroundColor Magenta
        $output = Get-Content $promptFile -Raw | & $geminiCmd.Name 2>&1
        $output | Out-File -FilePath $outPath -Encoding UTF8
        Write-Host "  Gemini analysis: $outPath" -ForegroundColor Green
        Write-Host "`n$output"
    } else {
        Write-Host "`n  Gemini CLI not found. Install with:" -ForegroundColor Yellow
        Write-Host "      npm install -g @google/gemini-cli" -ForegroundColor Cyan
        Write-Host "`n  Then run manually:"
        Write-Host "      gemini < `"$promptFile`"`n" -ForegroundColor Cyan
    }
}

Write-Host "`nDone. Repos scanned: $($repos.Count)`n" -ForegroundColor Green
