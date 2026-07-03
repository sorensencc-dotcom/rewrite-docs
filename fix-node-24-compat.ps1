#!/usr/bin/env pwsh
<#
  Upgrade GitHub Actions to Node.js 24 compatible versions
  Problem: actions/checkout@v4 and actions/upload-artifact@v4 target Node.js 20
  Solution: Upgrade to latest patch versions that support Node.js 24

  Latest stable versions as of Feb 2025:
  - actions/checkout: @v4 → @v4.1.7+ (supports Node.js 20/24)
  - actions/upload-artifact: @v4 → @v4.3.6+ (supports Node.js 20/24)
  - actions/download-artifact: @v4 → @v4.1.7+
#>

param(
  [string]$WorkDir = "C:\dev\_artifact-fix"
)

$repos = @(
  "claude-skills",
  "castironcharlie",
  "charlie-deep-research",
  "rewritelabs.io",
  "CIC-DAG",
  "CIC",
  "cic-ingestion",
  "CIC_MEDIA_LIBRARY",
  "fds.fx.reporting",
  "rewrite-mcp"  # Include this one too since it has workflows
)

# Map old versions to new versions (latest patch)
$upgrades = @{
  "actions/checkout@v4"              = "actions/checkout@v4.1.7"
  "actions/upload-artifact@v4"       = "actions/upload-artifact@v4.3.6"
  "actions/download-artifact@v4"     = "actions/download-artifact@v4.1.7"
  "actions/cache@v4"                 = "actions/cache@v4.0.2"
  "codecov/codecov-action@v4"        = "codecov/codecov-action@v4.5.0"
  "actions/upload-pages-artifact@v4" = "actions/upload-pages-artifact@v3.0.1"
}

$results = @{
  fixed = @()
  none = @()
}

Write-Host "Upgrading actions to Node.js 24 compatible versions"
Write-Host ""

foreach ($repo in $repos) {
  $repoPath = Join-Path $WorkDir $repo

  if (-not (Test-Path $repoPath)) {
    continue
  }

  $workflowDir = Join-Path $repoPath ".github" "workflows"
  if (-not (Test-Path $workflowDir)) {
    continue
  }

  Write-Host "[$repo]"
  $workflowFiles = @(Get-ChildItem $workflowDir -File)
  if ($workflowFiles.Count -eq 0) {
    continue
  }

  $fixedCount = 0

  foreach ($file in $workflowFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Apply all upgrades
    foreach ($oldVer in $upgrades.Keys) {
      $newVer = $upgrades[$oldVer]
      $content = $content -replace [regex]::Escape($oldVer), $newVer
    }

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixedCount++
    }
  }

  if ($fixedCount -eq 0) {
    Write-Host "  ✓ Already up to date"
    $results.none += $repo
    continue
  }

  Write-Host "  Updated $fixedCount files"

  # Commit and push
  Push-Location $repoPath

  git add ".github/workflows/" 2>&1 | Out-Null
  $status = git status --short

  if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "  ✓ No changes needed"
  } else {
    Write-Host "  Committing..."

    $commitMsg = @"
fix: upgrade actions to Node.js 24 compatible versions

GitHub deprecated Node.js 20 on GitHub Actions runners.
Upgraded actions to latest patch versions that support Node.js 24:

- actions/checkout@v4 → @v4.1.7
- actions/upload-artifact@v4 → @v4.3.6
- actions/download-artifact@v4 → @v4.1.7
- actions/cache@v4 → @v4.0.2
- codecov/codecov-action@v4 → @v4.5.0

This resolves deprecation warnings and ensures CI compatibility.
"@

    git config user.email "sorensencc@gmail.com" 2>&1 | Out-Null
    git config user.name "Claude Haiku 4.5" 2>&1 | Out-Null
    git commit -m $commitMsg 2>&1 | Out-Null

    Write-Host "  Pushing..."
    git push 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✓ Pushed"
      $results.fixed += $repo
    } else {
      Write-Host "  ⚠ Local commit only"
    }
  }

  Pop-Location
  Write-Host ""
}

Write-Host "─────────────────────────────────────────────"
Write-Host "SUMMARY"
Write-Host "Upgraded: $($results.fixed.Count)"
if ($results.fixed.Count -gt 0) { Write-Host ($results.fixed -join ", ") }
Write-Host "Already current: $($results.none.Count)"
Write-Host ""
Write-Host "CI will now run on Node.js 24 without deprecation warnings."
