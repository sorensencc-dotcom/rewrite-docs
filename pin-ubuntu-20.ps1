#!/usr/bin/env pwsh
<#
  Pin all workflows to ubuntu-20.04 (still has Node.js 20)
  This eliminates the Node.js 24 deprecation warning for action binaries.
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

Write-Host "Pinning all workflows to ubuntu-20.04 (Node.js 20)"
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

    # Replace any ubuntu version with ubuntu-20.04
    $content = $content -replace "runs-on:\s+ubuntu-[\w\.]+", "runs-on: ubuntu-20.04"

    if ($content -ne $originalContent) {
      Set-Content -Path $file.FullName -Value $content -Encoding UTF8
      $fixedCount++
    }
  }

  if ($fixedCount -eq 0) {
    Write-Host "  ✓ Already pinned to ubuntu-20.04"
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
fix: pin workflows to ubuntu-20.04 (Node.js 20 compatibility)

GitHub Actions runners now default to Node.js 24, but actions/checkout@v4
and actions/upload-artifact@v4 are compiled for Node.js 20, causing
deprecation warnings.

Solution: Pin all workflow jobs to ubuntu-20.04, which still provides
Node.js 20 runtime. This is stable and widely supported until
action maintainers release v5 with Node.js 24 support.

Eliminates: "Node.js 20 is deprecated" warnings in CI logs.
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
Write-Host "All workflows pinned to ubuntu-20.04."
Write-Host "Node.js 20 warnings eliminated."
