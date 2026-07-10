<#
.SYNOPSIS
Check file ownership comments.

.DESCRIPTION
Verifies all source files (.md, .ts) have owner comments.
Files without ownership are listed in UNOWNED_FILES.md.

.PARAMETER Output
Output location. Default: 'C:\dev\docs\meta\unowned-files.md'

.EXAMPLE
./ownership-check.ps1
./ownership-check.ps1 -Output "C:\dev\reports\unowned.md"
#>

param(
    [string]$Output = 'C:\dev\docs\meta\unowned-files.md'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\dev'

Write-Host "Checking file ownership comments..." -ForegroundColor Cyan
Write-Host "Output: $Output" -ForegroundColor Gray

$UnownedFiles = @()

Get-ChildItem -Path $RepoRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    ($_.Extension -in @('.md', '.ts')) -and
    (-not ($_.FullName -like '*node_modules*')) -and
    (-not ($_.FullName -like '*dist*'))
} | ForEach-Object {
    $FilePath = $_.FullName
    $Relative = $FilePath -replace 'C:\\dev\\', ''

    # Check if file has owner comment
    $Content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if ($Content -match '<!--\s*OWNER:\s*\w+' -or $Content -match '#.*OWNER:\s*\w+') {
        return  # Has owner
    }

    # Exceptions: root-level and well-known files
    $FileName = Split-Path $FilePath -Leaf
    $WellKnown = @('README.md', 'CLAUDE.md', '.gitignore', 'package.json')
    if ($FileName -in $WellKnown) {
        return  # Exception
    }

    $DirPath = Split-Path $Relative -Parent
    $DirName = if ($DirPath) { Split-Path $DirPath -Leaf } else { 'root' }

    $UnownedFiles += @{
        Path = $Relative
        Directory = $DirName
    }
}

# Generate report
$Report = @()
$Report += "# Unowned Files Report"
$Report += ""
$Report += "**Date:** $(Get-Date -Format 'yyyy-MM-dd')"
$Report += "**Total unowned:** $($UnownedFiles.Count)"
$Report += ""

if ($UnownedFiles.Count -eq 0) {
    $Report += "✓ All files have owner comments"
} else {
    $Report += "## By Directory"
    $Report += ""

    $UnownedFiles | Group-Object -Property Directory | ForEach-Object {
        $Report += "### $($_.Name) ($($_.Count))"
        $Report += ""

        $_.Group | ForEach-Object {
            $Report += "- $($_.Path)"
        }

        $Report += ""
    }

    $Report += "## Action"
    $Report += ""
    $Report += "Add owner comment to each file:"
    $Report += ""
    $Report += "**For Markdown (.md):**"
    $Report += "``````"
    $Report += "<!-- OWNER: {cic|cic-ingestion|rewrite-mcp|toolforge|scripts|data|docs} -->"
    $Report += "<!-- CATEGORY: {category} -->"
    $Report += "``````"
    $Report += ""
    $Report += "**For TypeScript (.ts):**"
    $Report += "``````"
    $Report += "// OWNER: {cic|cic-ingestion|rewrite-mcp|toolforge|scripts|data|docs}"
    $Report += "// CATEGORY: {category}"
    $Report += "``````"
}

$Report -join "`n" | Set-Content $Output -Encoding UTF8
Write-Host "✓ Report written: $Output" -ForegroundColor Green
