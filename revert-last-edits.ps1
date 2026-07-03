#!/usr/bin/env pwsh
<#
  Revert the force-node-20 and pin-ubuntu-20 changes
  Keep only the v3→v4 artifact action fixes
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

Write-Host "Reverting to original runner config (before ubuntu-20.04 pin)"
Write-Host ""

foreach ($repo in $repos) {
  $repoPath = Join-Path $WorkDir $repo
  if (-not (Test-Path $repoPath)) { continue }

  Write-Host "[$repo]"
  Push-Location $repoPath

  # Show last 5 commits
  $lastCommits = git log --oneline -5 2>&1
  Write-Host "Recent commits:"
  $lastCommits | ForEach-Object { Write-Host "  $_" }

  # Check if ubuntu-20.04 pin is in recent commits
  $ubuntu20Commits = git log --grep="ubuntu-20.04" --oneline 2>&1
  if ($ubuntu20Commits) {
    Write-Host "  Found ubuntu-20.04 commits. Revert last N commits?"
  }

  Pop-Location
  Write-Host ""
}

Write-Host "To revert, run:"
Write-Host "  cd <repo>"
Write-Host "  git revert -n HEAD~3...HEAD  # Revert last 3 commits"
Write-Host "  git commit -m 'revert: undo Node.js 20 pin, ubuntu-20.04 changes'"
Write-Host "  git push"
