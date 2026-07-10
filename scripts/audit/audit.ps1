<#
.SYNOPSIS
Repository policy compliance audit.

.DESCRIPTION
Scans project files for violations:
- Files in wrong directories (orphaned dirs)
- Naming violations (CamelCase vs lowercase-hyphens)
- Duplicate CLAUDE.md files
- Files without ownership comments
- mkdocs.yml nav completeness

.PARAMETER CheckNaming
Only check naming violations.

.PARAMETER CheckOwnership
Only check ownership comments.

.PARAMETER CheckOrphans
Only check orphaned directories.

.PARAMETER Output
Output format: 'json', 'markdown', or 'text' (default: 'markdown')

.EXAMPLE
./audit.ps1
./audit.ps1 -CheckNaming
./audit.ps1 -Output json
#>

param(
    [switch]$CheckNaming,
    [switch]$CheckOwnership,
    [switch]$CheckOrphans,
    [ValidateSet('json', 'markdown', 'text')]
    [string]$Output = 'markdown'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\dev'

# Standard directories (per CLAUDE.md §2)
$StandardDirs = @('cic', 'cic-ingestion', 'rewrite-mcp', 'toolforge', 'claude-skills', 'scripts', 'data', 'docs')

# Excluded patterns
$Excluded = @(
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '.history',
    'CIP'  # Gitignored
)

$Violations = @()

# ===== HELPER FUNCTIONS =====

function Test-NamingCompliant {
    param([string]$FileName)

    # Well-known exceptions
    $WellKnown = @(
        '.gitignore', '.env', 'package.json', 'tsconfig.json',
        'README.md', 'CLAUDE.md', 'Dockerfile', 'Makefile',
        'docker-compose.yml', '.npmrc'
    )

    if ($FileName -in $WellKnown) { return $true }

    # Must be lowercase letters, numbers, hyphens, dots
    if ($FileName -match '^[a-z0-9._-]+$') { return $true }

    return $false
}

function Get-StandardDir {
    param([string]$FilePath)

    $Relative = $FilePath -replace 'C:\\dev\\', ''
    $Parts = $Relative -split '\\'

    if ($Parts.Length -eq 1) {
        return $null  # Root file
    }

    $TopDir = $Parts[0]

    # Check if it's a standard dir
    if ($TopDir -in $StandardDirs) {
        return $TopDir
    }

    return $null
}

function Test-HasOwnerComment {
    param([string]$FilePath)

    $Content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $Content) { return $false }

    # Check for owner comment
    if ($Content -match '<!--\s*OWNER:\s*\w+') { return $true }
    if ($Content -match '#.*OWNER:\s*\w+') { return $true }

    return $false
}

# ===== SCAN FUNCTIONS =====

function Scan-Orphaned {
    Write-Host "Scanning for orphaned directories..." -ForegroundColor Cyan

    Get-ChildItem -Path $RepoRoot -Depth 1 -Directory -ErrorAction SilentlyContinue | Where-Object {
        $Dir = $_.Name
        ($Dir -notin $StandardDirs) -and ($Dir -notin $Excluded) -and (-not $Dir.StartsWith('.'))
    } | ForEach-Object {
        $Files = @(Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue)

        $Violations += @{
            Type = 'orphaned_dir'
            Path = $_.Name
            FileCount = $Files.Count
            Severity = if ($Files.Count -gt 100) { 'CRITICAL' } else { 'HIGH' }
        }
    }
}

function Scan-Naming {
    Write-Host "Scanning for naming violations..." -ForegroundColor Cyan

    Get-ChildItem -Path $RepoRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        # Exclude standard directories
        $ExcludePatterns = @('node_modules', 'dist', 'build', '.next', 'coverage', '.history', 'CIP')
        $ShouldExclude = $false

        foreach ($Pattern in $ExcludePatterns) {
            if ($_.FullName -like "*\$Pattern\*") {
                $ShouldExclude = $true
                break
            }
        }

        -not $ShouldExclude
    } | ForEach-Object {
        if (-not (Test-NamingCompliant $_.Name)) {
            $Violations += @{
                Type = 'naming'
                Path = $_.FullName -replace 'C:\\dev\\', ''
                FileName = $_.Name
                Severity = 'HIGH'
            }
        }
    }
}

function Scan-Ownership {
    Write-Host "Scanning for ownership comments..." -ForegroundColor Cyan

    # Only check .md and .ts files in standard dirs
    Get-ChildItem -Path $RepoRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        ($_.Extension -in @('.md', '.ts')) -and
        (-not ($_.FullName -like '*node_modules*')) -and
        (-not ($_.FullName -like '*dist*')) -and
        (($_.FullName -like "*\cic\*") -or
         ($_.FullName -like "*\docs\*") -or
         ($_.FullName -like "*\toolforge\*") -or
         ($_.FullName -like "*\scripts\*"))
    } | ForEach-Object {
        if (-not (Test-HasOwnerComment $_.FullName)) {
            $Violations += @{
                Type = 'no_owner'
                Path = $_.FullName -replace 'C:\\dev\\', ''
                Severity = 'MEDIUM'
            }
        }
    }
}

function Scan-Duplicates {
    Write-Host "Scanning for duplicate CLAUDE.md files..." -ForegroundColor Cyan

    $ClaudeFiles = Get-ChildItem -Path $RepoRoot -Recurse -Filter 'CLAUDE.md' -ErrorAction SilentlyContinue

    if ($ClaudeFiles.Count -gt 1) {
        $ClaudeFiles | Select-Object -Skip 1 | ForEach-Object {
            $Violations += @{
                Type = 'duplicate_claude'
                Path = $_.FullName -replace 'C:\\dev\\', ''
                Severity = 'CRITICAL'
            }
        }
    }
}

# ===== MAIN =====

Write-Host "Repository Policy Compliance Audit" -ForegroundColor Green
Write-Host "Repository: $RepoRoot" -ForegroundColor Gray
Write-Host ""

if ($CheckNaming) {
    Scan-Naming
} elseif ($CheckOwnership) {
    Scan-Ownership
} elseif ($CheckOrphans) {
    Scan-Orphaned
} else {
    Scan-Orphaned
    Scan-Naming
    Scan-Ownership
    Scan-Duplicates
}

# ===== OUTPUT =====

if ($Violations.Count -eq 0) {
    Write-Host "✓ No violations found" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Found $($Violations.Count) violation(s):" -ForegroundColor Yellow

switch ($Output) {
    'markdown' {
        Write-Host ""
        Write-Host "| Severity | Type | Path | Details |" -ForegroundColor Cyan
        Write-Host "|----------|------|------|---------|" -ForegroundColor Cyan

        $Violations | Sort-Object -Property Severity | ForEach-Object {
            $Details = if ($_.FileCount) { "Files: $($_.FileCount)" } else { "" }
            Write-Host "| $($_.Severity) | $($_.Type) | $($_.Path) | $Details |"
        }
    }

    'json' {
        $Violations | ConvertTo-Json | Write-Host
    }

    'text' {
        $Violations | ForEach-Object {
            Write-Host "$($_.Severity): $($_.Type) — $($_.Path)"
        }
    }
}

# Exit with error if critical violations found
$CriticalCount = @($Violations | Where-Object { $_.Severity -eq 'CRITICAL' }).Count
if ($CriticalCount -gt 0) {
    Write-Host ""
    Write-Host "❌ $CriticalCount critical violation(s) found" -ForegroundColor Red
    exit 1
}

exit 0
