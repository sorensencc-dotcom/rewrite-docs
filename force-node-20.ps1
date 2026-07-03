#!/usr/bin/env pwsh
<#
  Force Node.js 20 explicitly in setup-node step
  This overrides GitHub's default Node.js 24 and suppresses the warning.
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

Write-Host "Forcing Node.js 20 explicitly in all workflows"
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

    # If setup-node doesn't exist, add it after checkout
    if ($content -notmatch "setup-node") {
      $content = $content -replace `
        "(- uses: actions/checkout[^\n]*)",
        "`$1`n      - uses: actions/setup-node@v4`n        with:`n          node-version: '20'"
    } else {
      # If setup-node exists but doesn't specify node-version: '20', update it
      if ($content -match "setup-node" -and $content -notmatch "node-version:\s+['\`"]?20") {
        $content = $content -replace `
          "(- uses: actions/setup-node[^\n]*\n\s+with:[\s\S]*?)node-version:\s+['\`"]?\d+['\`"]?",
          "`$1node-version: '20'"

        # If no node-version found, add it
        if ($content -match "setup-node" -and $content -notmatch "node-version:\s+['\`"]?20") {
          $content = $content -replace `
            "(- uses: actions/setup-node[^\n]*\n(?:\s+with:)?[\s\S]*?)((?:\n\s{2,6}-)|(?:\n\s{2,6}[a-z]))",
            "`$1`n        node-version: '20'`$2"
        }
      }
    }

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixedCount++
    }
  }

  if ($fixedCount -eq 0) {
    Write-Host "  ✓ Already has setup-node with node-version: '20'"
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
fix: explicitly pin Node.js 20 to suppress deprecation warning

GitHub Actions runners have both Node.js 20 and 24 available.
Actions built for Node.js 20 (checkout@v4, upload-artifact@v4)
trigger a deprecation warning even on ubuntu-20.04.

Solution: Explicitly set node-version: '20' in all setup-node steps.
This forces the job to use Node.js 20 and suppresses the warning.
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

Write-Host "─────────────────────────────────────────────"
Write-Host "Node.js 20 explicitly pinned in all workflows."
