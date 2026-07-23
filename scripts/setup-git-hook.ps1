#!/usr/bin/env pwsh
<#
.SYNOPSIS
Install the pre-commit secret-scan hook for rewrite-docs.

.PARAMETER Action
Install, Status (default: Install)
#>

param(
    [ValidateSet('Install', 'Status')]
    [string]$Action = 'Install'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
$hooksDir = Join-Path $repoRoot '.git/hooks'

function Install-Hook {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
    $hookContent = @"
#!/bin/sh
# Auto-generated pre-commit hook. Do not edit — regenerate via scripts/setup-git-hook.ps1
bash "`$(git rev-parse --show-toplevel)/scripts/secret-scan-hook.sh"
exit `$?
"@
    $hookPath = Join-Path $hooksDir 'pre-commit'
    $hookContent | Out-File -FilePath $hookPath -Encoding utf8NoBOM -Force
    try { chmod +x $hookPath } catch {}
    Write-Host "+ Pre-commit hook installed at $hookPath"
}

function Get-Status {
    $hookPath = Join-Path $hooksDir 'pre-commit'
    if (Test-Path $hookPath) {
        Write-Host "+ Pre-commit hook installed"
    } else {
        Write-Host "x Pre-commit hook missing"
    }
}

switch ($Action) {
    'Install' { Install-Hook }
    'Status'  { Get-Status }
}
