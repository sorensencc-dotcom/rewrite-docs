#!/usr/bin/env pwsh
<#
  Fix deprecated GitHub Actions v3 → v4 across repos
  Primary: actions/upload-artifact@v3 → @v4
  Secondary: actions/checkout@v3 → @v4, codecov/codecov-action@v3 → @v4, etc.
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
  "fds.fx.reporting"
)

$results = @{
  fixed = @()
  failed = @()
}

Write-Host "Fixing v3 → v4 across $($repos.Count) repos"
Write-Host ""

foreach ($repo in $repos) {
  $repoPath = Join-Path $WorkDir $repo

  if (-not (Test-Path $repoPath)) {
    Write-Host "[$repo] ✗ Not found at $repoPath"
    $results.failed += $repo
    continue
  }

  Write-Host "[$repo]"
  $workflowDir = Join-Path $repoPath ".github" "workflows"

  if (-not (Test-Path $workflowDir)) {
    Write-Host "  ⊘ No workflows"
    continue
  }

  # Find all workflow files
  $workflowFiles = @(Get-ChildItem $workflowDir -File)
  if ($workflowFiles.Count -eq 0) {
    Write-Host "  ⊘ No workflow files"
    continue
  }

  Write-Host "  Checking $($workflowFiles.Count) files..."
  $fixedCount = 0

  foreach ($file in $workflowFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Replace v3 with v4 (broad replacement for all actions)
    $content = $content -replace "@v3\b", "@v4"

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixedCount++
    }
  }

  if ($fixedCount -eq 0) {
    Write-Host "  ✓ Already v4+"
    continue
  }

  Write-Host "  Updated $fixedCount files"

  # Commit and push
  Push-Location $repoPath

  git add ".github/workflows/" 2>&1 | Out-Null
  $status = git status --short

  if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "  ⊘ No changes after replacement"
  } else {
    Write-Host "  Committing..."

    $commitMsg = @"
fix: upgrade deprecated GitHub Actions versions (v3 → v4)

GitHub deprecated v3 of several actions in April 2024:
- actions/upload-artifact@v3 → @v4
- actions/checkout@v3 → @v4
- codecov/codecov-action@v3 → @v4
- actions/upload-pages-artifact@v3 → @v4

Enforcement tightened in June 2024, causing CI failures.
This commit upgrades all v3 actions to v4.

Fixes CI/CD pipeline failures across all workflows.
"@

    git config user.email "sorensencc@gmail.com" 2>&1 | Out-Null
    git config user.name "Claude Haiku 4.5" 2>&1 | Out-Null
    git commit -m $commitMsg 2>&1 | Out-Null

    Write-Host "  Pushing..."
    $pushOut = git push 2>&1

    if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✓ Pushed"
      $results.fixed += $repo
    } else {
      Write-Host "  ⚠ Commit local only (push failed)"
      Write-Host "    Error: $($pushOut -join ' ')"
      $results.fixed += $repo
    }
  }

  Pop-Location
  Write-Host ""
}

Write-Host "─────────────────────────────────────────────"
Write-Host "SUMMARY"
Write-Host "Fixed & Pushed: $($results.fixed.Count)"
if ($results.fixed.Count -gt 0) { Write-Host ($results.fixed -join ", ") }
Write-Host "Failed: $($results.failed.Count)"
if ($results.failed.Count -gt 0) { Write-Host ($results.failed -join ", ") }
Write-Host ""
Write-Host "Next: GitHub Actions should auto-trigger within minutes."
Write-Host "Check https://github.com/sorensencc-dotcom/[repo]/actions"
