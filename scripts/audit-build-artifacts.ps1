# Audit script: Detect committed build artifacts across monorepo (Windows)
# Usage: .\scripts\audit-build-artifacts.ps1
# Exit 0: no artifacts found. Exit 1: artifacts found.

param(
    [switch]$Verbose = $false
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "🔍 Auditing committed build artifacts..." -ForegroundColor Cyan
Write-Host

# Patterns to check for in git index
$Patterns = @(
    "node_modules/",
    "dist/",
    "build/",
    "\.tsbuildinfo$",
    "coverage/",
    "\.nyc_output/",
    "\.sqlite$",
    "\.sqlite3$",
    "\.db$"
)

$ArtifactsFound = 0

Write-Host "Checking git index for committed build artifacts..." -ForegroundColor Yellow

foreach ($pattern in $Patterns) {
    try {
        $matches = git ls-files | Select-String -Pattern $pattern
        if ($null -ne $matches) {
            Write-Host "❌ Found committed: $pattern" -ForegroundColor Red
            git ls-files | Select-String -Pattern $pattern | Select-Object -First 10
            Write-Host
            $ArtifactsFound += 1
        }
    }
    catch {
        # No matches
    }
}

# Check for untracked files that should be ignored
Write-Host
Write-Host "Checking working directory for tracked files missing from .gitignore..." -ForegroundColor Yellow

try {
    $untracked = git ls-files --others --exclude-standard
    if ($null -ne $untracked) {
        $untracked | ForEach-Object {
            $file = $_
            if ($file -match "(node_modules|dist|build|tsbuildinfo|coverage|sqlite|db)") {
                Write-Host "⚠️  Untracked (should add to .gitignore): $file" -ForegroundColor Yellow
            }
        }
    }
}
catch {
    # Handle error
}

# Summary
Write-Host
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Magenta

if ($ArtifactsFound -eq 0) {
    Write-Host "✅ No committed build artifacts found." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ Found $ArtifactsFound category/categories of committed artifacts." -ForegroundColor Red
    Write-Host "    Run: git rm -r --cached <path>" -ForegroundColor Yellow
    Write-Host "    Then commit the removal." -ForegroundColor Yellow
    exit 1
}
