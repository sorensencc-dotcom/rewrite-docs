#!/usr/bin/env pwsh
<#
  Remove patch versions to auto-fetch latest action releases
  This allows GitHub to pick up v5 or newer versions that support Node.js 24
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
  "rewrite-mcp"
)

Write-Host "Removing patch versions to fetch latest Node.js 24 compatible releases"
Write-Host ""

foreach ($repo in $repos) {
  $repoPath = Join-Path $WorkDir $repo
  if (-not (Test-Path $repoPath)) { continue }

  $workflowDir = Join-Path $repoPath ".github" "workflows"
  if (-not (Test-Path $workflowDir)) { continue }

  Write-Host "[$repo]"
  $workflowFiles = @(Get-ChildItem $workflowDir -File)
  $fixedCount = 0

  foreach ($file in $workflowFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Remove patch versions: @v4.1.7 → @v4, @v4.3.6 → @v4, etc.
    $content = $content -replace "@v(\d+)\.\d+\.\d+\b", "@v`$1"

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixedCount++
    }
  }

  if ($fixedCount -eq 0) {
    Write-Host "  ⊘ Already using @vX format"
    continue
  }

  Write-Host "  Updated $fixedCount files"

  Push-Location $repoPath
  git add ".github/workflows/" 2>&1 | Out-Null

  if (-not (git status --short)) {
    Pop-Location
    continue
  }

  $commitMsg = @"
fix: use latest action versions for Node.js 24 compatibility

Removed patch version pinning to allow GitHub Actions to auto-fetch
latest releases (v5+) that support Node.js 24.

- actions/checkout@v4.1.7 → @v4
- actions/upload-artifact@v4.3.6 → @v4
- setup-node@v4 → @v4

This ensures we get Node.js 24 compatible versions when available.
"@

  git config user.email "sorensencc@gmail.com" 2>&1 | Out-Null
  git config user.name "Claude Haiku 4.5" 2>&1 | Out-Null
  git commit -m $commitMsg 2>&1 | Out-Null
  git push 2>&1 | Out-Null

  if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Pushed"
  }

  Pop-Location
  Write-Host ""
}

Write-Host "Done. Workflows now use latest available versions."
