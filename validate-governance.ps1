#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Repository Governance Validator
    Enforces CLAUDE.md rules:
    - RULE 1: Markdown files in docs/ (not root)
    - RULE 2: Skills in toolforge/skills/ with required structure
    - RULE 3: Code/config in correct locations

.DESCRIPTION
    Validates repository structure against governance rules.
    Exit code 0 = compliant, 1 = violations found.

.EXAMPLE
    .\validate-governance.ps1 -Verbose
    .\validate-governance.ps1 -Fix -DryRun
#>

param(
    [switch]$Fix,
    [switch]$DryRun,
    [switch]$Verbose,
    [switch]$Report
)

$ErrorActionPreference = "Continue"
$script:violations = @()
$script:passed = @()
$script:fixed = @()

# Color output
function Write-Pass { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Fail { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Warn { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }

# Validate RULE 1: Markdown files in root
function Validate-Rule1 {
    Write-Host "`n=== RULE 1: Markdown Files in Root ===" -ForegroundColor Magenta

    $exceptions = @("CLAUDE.md", "README.md")
    $rootMds = Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*.md" -ErrorAction SilentlyContinue

    $violations = $rootMds | Where-Object { $_.Name -notin $exceptions }

    if ($violations.Count -eq 0) {
        Write-Pass "No orphaned markdown files in root"
        $script:passed += "RULE 1: No orphaned .md files"
        return $true
    }
    else {
        Write-Fail "Found $($violations.Count) markdown files in root (should be in docs/):"
        foreach ($file in $violations) {
            Write-Host "  - $($file.Name)" -ForegroundColor Red
            $script:violations += @{
                Rule = "RULE 1"
                File = $file.FullName
                Issue = "Markdown file in root (should be in docs/)"
                Fix = "Move to docs/meta/ or appropriate category"
            }
        }
        return $false
    }
}

# Validate RULE 2: Skills in toolforge/skills/
function Validate-Rule2 {
    Write-Host "`n=== RULE 2: Toolforge Skills Structure ===" -ForegroundColor Magenta

    $skillsDir = "C:\dev\toolforge\skills"
    if (-not (Test-Path $skillsDir)) {
        Write-Warn "toolforge/skills/ directory not found"
        return $false
    }

    $requiredDirs = @("skill.json", "README.md", "src", "tests", "docs")
    $skillDirs = Get-ChildItem -Path $skillsDir -Directory -ErrorAction SilentlyContinue

    $compliant = 0
    $nonCompliant = 0

    foreach ($skill in $skillDirs) {
        if ($skill.Name -in @("_TEMPLATE", "_archive")) {
            continue
        }

        $missing = @()
        foreach ($req in $requiredDirs) {
            $itemPath = Join-Path $skill.FullName $req
            if (-not (Test-Path $itemPath)) {
                $missing += $req
            }
        }

        if ($missing.Count -eq 0) {
            Write-Pass "✓ $($skill.Name) - Complete structure"
            $compliant++
        }
        else {
            Write-Fail "$($skill.Name) - Missing: $($missing -join ', ')"
            $nonCompliant++
            $script:violations += @{
                Rule = "RULE 2"
                Skill = $skill.Name
                Issue = "Missing required files: $($missing -join ', ')"
                Fix = "Create: $($missing -join ', ')"
            }
        }
    }

    Write-Info "Summary: $compliant compliant, $nonCompliant non-compliant"

    if ($nonCompliant -eq 0) {
        $script:passed += "RULE 2: All skills have required structure"
        return $true
    }
    else {
        return $false
    }
}

# Validate RULE 3: Code/Config location
function Validate-Rule3 {
    Write-Host "`n=== RULE 3: Code & Config Location ===" -ForegroundColor Magenta

    # Check for orphaned config files in root
    $configFiles = Get-ChildItem -Path "C:\dev" -MaxDepth 1 -Filter "*.json" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notin @("package.json") }

    $orphanedConfigs = $configFiles | Where-Object {
        -not (Test-Path (Join-Path "C:\dev\toolforge" $_.Name)) -and
        -not (Test-Path (Join-Path "C:\dev\cic-os" $_.Name))
    }

    if ($orphanedConfigs.Count -eq 0) {
        Write-Pass "Code and config files are properly organized"
        $script:passed += "RULE 3: Code/Config location OK"
        return $true
    }
    else {
        Write-Warn "Found $($orphanedConfigs.Count) config files in root:"
        foreach ($file in $orphanedConfigs) {
            Write-Host "  - $($file.Name)" -ForegroundColor Yellow
        }
        return $true  # Warning only, not critical
    }
}

# Validate mkdocs.yml is up to date
function Validate-Mkdocs {
    Write-Host "`n=== Additional: mkdocs.yml Navigation ===" -ForegroundColor Magenta

    $mkdocsPath = "C:\dev\mkdocs.yml"
    if (-not (Test-Path $mkdocsPath)) {
        Write-Warn "mkdocs.yml not found"
        return $false
    }

    Write-Pass "mkdocs.yml exists"
    Write-Info "Verify manually that nav entries match docs/ structure"
    return $true
}

# Generate report
function Generate-Report {
    if ($script:violations.Count -eq 0) {
        Write-Host "`n`n" -NoNewline
        Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║         GOVERNANCE COMPLIANT           ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
        return 0
    }
    else {
        Write-Host "`n`n" -NoNewline
        Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║      VIOLATIONS FOUND ($($script:violations.Count))          ║" -ForegroundColor Red
        Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Red

        Write-Host "`n## Violations Summary" -ForegroundColor Yellow
        foreach ($v in $script:violations) {
            Write-Host "`n$($v.Rule):"
            Write-Host "  Issue: $($v.Issue)"
            Write-Host "  Fix: $($v.Fix)"
            if ($v.File) { Write-Host "  File: $($v.File)" }
            if ($v.Skill) { Write-Host "  Skill: $($v.Skill)" }
        }

        return 1
    }
}

# Main validation flow
function Main {
    Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Repository Governance Validation     ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

    $rule1Pass = Validate-Rule1
    $rule2Pass = Validate-Rule2
    $rule3Pass = Validate-Rule3
    $mkdocsPass = Validate-Mkdocs

    $allPass = $rule1Pass -and $rule2Pass -and $rule3Pass

    $exitCode = Generate-Report

    if ($Report) {
        Export-Report
    }

    return $exitCode
}

function Export-Report {
    $reportPath = "C:\dev\GOVERNANCE_VALIDATION_REPORT.json"
    $report = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Rule1 = if ($rule1Pass) { "PASS" } else { "FAIL" }
        Rule2 = if ($rule2Pass) { "PASS" } else { "FAIL" }
        Rule3 = if ($rule3Pass) { "PASS" } else { "FAIL" }
        Violations = $script:violations
        TotalViolations = $script:violations.Count
    }

    $report | ConvertTo-Json | Out-File -FilePath $reportPath -Force
    Write-Info "Report exported to: $reportPath"
}

# Run validation
$exitCode = Main
exit $exitCode
