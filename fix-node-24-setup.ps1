#!/usr/bin/env pwsh
<#
  Force Node.js 24 in GitHub Actions workflows by adding setup-node step
  The latest action versions (v4.1.7, v4.3.6) still target Node.js 20.
  Solution: Add setup-node@v4 with node-version: '24' to each job.
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

$results = @{
  fixed = @()
  none = @()
}

Write-Host "Adding setup-node to force Node.js 24 in all workflows"
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

    # Skip files that already have setup-node
    if ($content -match "setup-node") {
      continue
    }

    # Add setup-node@v4 with node-version: '24' after checkout step
    # Match "- uses: actions/checkout" and insert setup-node after it
    $content = $content -replace `
      "(- uses: actions/checkout[^\n]*\n(?:\s+with:[^\n]*\n(?:\s+[^\n]*\n)*)?)",
      "`$1      - uses: actions/setup-node@v4`n        with:`n          node-version: '24'`n"

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixedCount++
    }
  }

  if ($fixedCount -eq 0) {
    Write-Host "  ⊘ Already has setup-node or no checkout found"
    $results.none += $repo
    continue
  }

  Write-Host "  Added setup-node to $fixedCount files"

  # Commit and push
  Push-Location $repoPath

  git add ".github/workflows/" 2>&1 | Out-Null
  $status = git status --short

  if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "  ⊘ No changes"
  } else {
    Write-Host "  Committing..."

    $commitMsg = @"
fix: force Node.js 24 in GitHub Actions workflows

Added setup-node@v4 with node-version: '24' to all jobs.
Latest action versions (checkout@v4.1.7, upload-artifact@v4.3.6) still target Node.js 20
due to build-time configuration. Explicitly setting Node.js 24 in the workflow
ensures compatibility and removes deprecation warnings.

Refs: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
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
Write-Host "Fixed: $($results.fixed.Count)"
if ($results.fixed.Count -gt 0) { Write-Host ($results.fixed -join ", ") }
Write-Host "Skipped: $($results.none.Count)"
if ($results.none.Count -gt 0) { Write-Host ($results.none -join ", ") }
Write-Host ""
Write-Host "Node.js 24 is now explicitly set in all workflows."
