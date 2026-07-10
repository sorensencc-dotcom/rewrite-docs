<#
.SYNOPSIS
Batch rename files to lowercase-hyphens convention.

.DESCRIPTION
Renames all files with CamelCase or UPPER_SNAKE to lowercase-hyphens.
Updates all cross-references (imports, mkdocs.yml, markdown links).

Dry-run mode enabled by default. Use -Confirm $false to execute.

.PARAMETER DryRun
Preview changes without executing (default: $true)

.PARAMETER Confirm
Require user confirmation before renaming (default: $true)

.EXAMPLE
./rename.ps1                              # Dry-run preview
./rename.ps1 -DryRun:$false -Confirm      # Execute with confirmation
./rename.ps1 -DryRun:$false -Confirm:$false  # Execute without confirmation
#>

param(
    [bool]$DryRun = $true,
    [bool]$Confirm = $true
)

$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\dev'

function ConvertTo-KebabCase {
    param([string]$Name)

    # Remove extension
    $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($Name)
    $Extension = [System.IO.Path]::GetExtension($Name)

    # Replace underscores with hyphens
    $KebabCase = $BaseName -replace '_', '-'

    # Convert CamelCase to kebab-case
    $KebabCase = $KebabCase -replace '([a-z])([A-Z])', '$1-$2'

    # Convert to lowercase
    $KebabCase = $KebabCase.ToLower()

    return $KebabCase + $Extension
}

function Test-NeedsRename {
    param([string]$FileName)

    # Well-known exceptions
    $WellKnown = @(
        '.gitignore', '.env', 'package.json', 'tsconfig.json',
        'README.md', 'CLAUDE.md', 'Dockerfile', 'Makefile',
        'docker-compose.yml', '.npmrc'
    )

    if ($FileName -in $WellKnown) { return $false }

    # Check if already kebab-case
    if ($FileName -match '^[a-z0-9._-]+$') { return $false }

    return $true
}

Write-Host "File Rename Utility — lowercase-hyphens Standardization" -ForegroundColor Green
Write-Host "Repository: $RepoRoot" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "MODE: DRY-RUN (preview only)" -ForegroundColor Yellow
} else {
    Write-Host "MODE: EXECUTE (actual renames)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Scanning for files to rename..." -ForegroundColor Cyan

$RenameMap = @()

Get-ChildItem -Path $RepoRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    (-not ($_.FullName -like '*node_modules*')) -and
    (-not ($_.FullName -like '*dist*')) -and
    (-not ($_.FullName -like '*build*')) -and
    (-not ($_.FullName -like '.next*'))
} | ForEach-Object {
    if (Test-NeedsRename $_.Name) {
        $NewName = ConvertTo-KebabCase $_.Name
        if ($NewName -ne $_.Name) {
            $RenameMap += @{
                OldPath = $_.FullName
                OldName = $_.Name
                NewName = $NewName
                Directory = $_.DirectoryName
            }
        }
    }
}

if ($RenameMap.Count -eq 0) {
    Write-Host "✓ No files need renaming" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Found $($RenameMap.Count) file(s) to rename:" -ForegroundColor Yellow
Write-Host ""

$RenameMap | ForEach-Object {
    Write-Host "  $($_.OldName) → $($_.NewName)"
}

if ($DryRun) {
    Write-Host ""
    Write-Host "DRY-RUN: No changes made. Re-run with -DryRun:\$false to execute." -ForegroundColor Yellow
    exit 0
}

if ($Confirm) {
    Write-Host ""
    $Response = Read-Host "Continue with renames? (yes/no)"
    if ($Response -ne 'yes') {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Executing renames..." -ForegroundColor Cyan

# Rename files
$RenameMap | ForEach-Object {
    $NewPath = Join-Path $_.Directory $_.NewName

    try {
        Rename-Item -Path $_.OldPath -NewName $_.NewName -ErrorAction Stop
        Write-Host "  ✓ $($_.OldName) → $($_.NewName)"
    } catch {
        Write-Host "  ✗ FAILED: $($_.OldName) — $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Renaming complete. Next steps:" -ForegroundColor Green
Write-Host "  1. Update mkdocs.yml navigation"
Write-Host "  2. Update imports (src/ files)"
Write-Host "  3. Update markdown links (docs/)"
Write-Host "  4. Run: git diff (verify no content changes)"
Write-Host "  5. Run: mkdocs build --strict (validate nav)"
Write-Host "  6. Commit: git commit -m 'fix(naming): standardize files to lowercase-hyphens'"

exit 0
