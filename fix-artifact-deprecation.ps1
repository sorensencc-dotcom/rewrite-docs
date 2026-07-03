#!/usr/bin/env pwsh
<#
  Fix deprecated GitHub Actions artifact versions across 9 repos
  Changes: upload-artifact@v3 → @v4, download-artifact@v3 → @v4
  Root cause: GitHub deprecated artifact actions v3 in April 2024, enforcement tightened June 2024
#>

param(
  [string]$Org = "sorensencc-dotcom",
  [string]$WorkDir = "$pwd\_artifact-fix"
)

$repos = @(
  "rewrite-mcp",
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

Write-Host "Org: $Org"
Write-Host "Work Dir: $WorkDir"
Write-Host "Repos: $($repos.Count)"
Write-Host ""

# Create work directory
if (-not (Test-Path $WorkDir)) {
  New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
}

$results = @{
  fixed = @()
  failed = @()
  skipped = @()
}

foreach ($repo in $repos) {
  $repoPath = Join-Path $WorkDir $repo
  Write-Host "─────────────────────────────────────────────"
  Write-Host "[$repo]"

  # Clone or pull
  if (Test-Path $repoPath) {
    Write-Host "  Pulling..."
    Push-Location $repoPath
    git pull --quiet 2>&1 | Out-Null
    Pop-Location
  } else {
    Write-Host "  Cloning from github.com/$Org/$repo..."
    git clone "https://github.com/$Org/$repo.git" $repoPath --quiet 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ✗ Clone failed"
      $results.failed += $repo
      continue
    }
  }

  # Find workflow files
  $workflowDir = Join-Path $repoPath ".github" "workflows"
  if (-not (Test-Path $workflowDir)) {
    Write-Host "  ⊘ No workflows directory"
    $results.skipped += $repo
    continue
  }

  $workflowFiles = @(Get-ChildItem -Path $workflowDir -Include "*.yml", "*.yaml" -ErrorAction SilentlyContinue)

  if ($workflowFiles.Count -eq 0) {
    Write-Host "  ⊘ No workflow files found"
    $results.skipped += $repo
    continue
  }

  Write-Host "  Found $($workflowFiles.Count) workflow files"

  # Search for deprecated versions
  $hasDeprecated = $false
  foreach ($file in $workflowFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "upload-artifact@v[0-3]|download-artifact@v[0-3]") {
      $hasDeprecated = $true
      break
    }
  }

  if (-not $hasDeprecated) {
    Write-Host "  ✓ All workflows already using v4 or later"
    $results.skipped += $repo
    continue
  }

  # Replace deprecated versions
  Write-Host "  Fixing deprecated artifact actions..."
  $fixCount = 0

  foreach ($file in $workflowFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Replace v3 with v4
    $content = $content -replace "upload-artifact@v3", "upload-artifact@v4"
    $content = $content -replace "download-artifact@v3", "download-artifact@v4"

    # Also handle v1 and v2 if found (less common, but comprehensive)
    $content = $content -replace "upload-artifact@v2", "upload-artifact@v4"
    $content = $content -replace "download-artifact@v2", "download-artifact@v4"
    $content = $content -replace "upload-artifact@v1", "upload-artifact@v4"
    $content = $content -replace "download-artifact@v1", "download-artifact@v4"

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixCount++
    }
  }

  Write-Host "  Updated $fixCount workflow files"

  # Commit and push
  Push-Location $repoPath

  git add ".github/workflows/*.yml" ".github/workflows/*.yaml" 2>&1 | Out-Null
  $status = git status --short

  if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "  ⊘ No changes (workflows already v4)"
    $results.skipped += $repo
  } else {
    Write-Host "  Committing..."
    $commitMsg = @"
fix: upgrade deprecated GitHub Actions artifact versions (v3 → v4)

GitHub deprecated upload-artifact@v3 and download-artifact@v3 in April 2024.
Enforcement was tightened in June 2024, causing CI failures across all repos.

This change upgrades to v4, which is stable and actively maintained.

Fixes: CI/CD failures on all workflows using artifact actions.
"@

    git config user.email "sorensencc@gmail.com" 2>&1 | Out-Null
    git config user.name "Claude Haiku 4.5" 2>&1 | Out-Null
    git commit -m $commitMsg 2>&1 | Out-Null

    Write-Host "  Pushing to origin..."
    git push 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Host "  ✓ Fixed and pushed"
      $results.fixed += $repo
    } else {
      Write-Host "  ! Committed locally (push failed — may need credentials)"
      $results.fixed += $repo
      Write-Host "    Run: git push"
    }
  }

  Pop-Location
}

Write-Host ""
Write-Host "─────────────────────────────────────────────"
Write-Host "SUMMARY"
Write-Host "Fixed:   $($results.fixed.Count)"
if ($results.fixed.Count -gt 0) { Write-Host "  - $($results.fixed -join ', ')" }
Write-Host "Skipped: $($results.skipped.Count)"
if ($results.skipped.Count -gt 0) { Write-Host "  - $($results.skipped -join ', ')" }
Write-Host "Failed:  $($results.failed.Count)"
if ($results.failed.Count -gt 0) { Write-Host "  - $($results.failed -join ', ')" }
Write-Host ""
Write-Host "Next: GitHub Actions should auto-trigger on all fixes within minutes."
Write-Host "Monitor: https://github.com/$Org/[repo]/actions"
