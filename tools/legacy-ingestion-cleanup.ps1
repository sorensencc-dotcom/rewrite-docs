# Legacy Ingestion Cleanup — Claude CLI Workflow
# Deterministic multi-phase repo scan + archive plan
# Requires: Claude CLI installed + repo at C:\dev\rewrite-mcp\castironforge\cic-ingestion\

param(
    [ValidateSet("1", "2", "3", "4", "5", "all")]
    [string]$Phase = "all",

    [string]$RepoPath = "C:\dev\rewrite-mcp\castironforge\cic-ingestion",

    [switch]$DryRun = $false,

    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Load instruction file
$InstructionFile = "C:\Users\soren\.claude\projects\c--dev\memory\legacy-ingestion-cleanup-instructions.md"

if (-not (Test-Path $InstructionFile)) {
    Write-Error "Instruction file not found: $InstructionFile"
    exit 1
}

$Instructions = Get-Content -Raw $InstructionFile

function Invoke-ClaudePhase {
    param(
        [int]$PhaseNum,
        [string]$Description,
        [string[]]$Commands
    )

    Write-Host "`n[$PhaseNum] $Description" -ForegroundColor Cyan

    if ($DryRun) {
        Write-Host "[DRY RUN] Would execute: $($Commands -join ' | ')" -ForegroundColor Yellow
        return
    }

    try {
        $prompt = @"
Execute Phase $PhaseNum: $Description

Use legacy-ingestion-cleanup-instructions.md as guide.

Repo path: $RepoPath

Instructions excerpt:
$(($Instructions -split "`n" | Select-Object -First 30) -join "`n")

Commands to validate after:
$($Commands -join "`n")
"@

        if ($Verbose) {
            Write-Host "Prompt: $prompt" -ForegroundColor DarkGray
        }

        claude $prompt
        Write-Host "✓ Phase $PhaseNum complete" -ForegroundColor Green
    }
    catch {
        Write-Error "Phase $PhaseNum failed: $_"
        exit 1
    }
}

# Main execution
if ($Phase -eq "all" -or $Phase -eq "1") {
    Invoke-ClaudePhase -PhaseNum 1 -Description "Repo Discovery (Mandatory)" `
        -Commands @(
            "ls -Recurse $RepoPath | ? { `$_.Name -match '\.py|ingestion' }",
            "grep -r 'ingestion' $RepoPath --include='*.ts' --include='*.json' --files-with-matches"
        )
}

if ($Phase -eq "all" -or $Phase -eq "2") {
    Invoke-ClaudePhase -PhaseNum 2 -Description "Legacy Analysis" `
        -Commands @(
            "Analyze legacy vs. new engine architecture",
            "Map envelope building logic",
            "Identify reusable components"
        )
}

if ($Phase -eq "all" -or $Phase -eq "3") {
    Invoke-ClaudePhase -PhaseNum 3 -Description "Cleanup Plan (Non-Destructive)" `
        -Commands @(
            "Propose archive structure at $RepoPath\legacy\",
            "Generate extraction plan for src/ingestion/{discovery,mime,envelope}.ts",
            "Generate new src/ingestion/index.ts stub"
        )
}

if ($Phase -eq "all" -or $Phase -eq "4") {
    Write-Host "`n[4] Approval Gates" -ForegroundColor Cyan
    Write-Host "Waiting for user approval before Phase 5 execution..." -ForegroundColor Yellow

    $questions = @(
        "Archive or delete legacy ingestion engine? (archive/delete)",
        "Port reusable logic automatically? (yes/no)",
        "Generate deterministic ingestion stub? (yes/no)",
        "Update operator console health checks? (yes/no)",
        "Generate patches or PRs? (patches/prs/skip)"
    )

    $responses = @{}
    foreach ($q in $questions) {
        Write-Host $q -ForegroundColor Cyan
        $response = Read-Host "  → "
        $responses[$q] = $response
    }

    Write-Host "`nApproval summary:" -ForegroundColor Green
    $responses.GetEnumerator() | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Green
    }

    $proceed = Read-Host "Proceed to Phase 5? (yes/no)"
    if ($proceed -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

if ($Phase -eq "all" -or $Phase -eq "5") {
    Invoke-ClaudePhase -PhaseNum 5 -Description "Execution (After Approval)" `
        -Commands @(
            "npm test",
            "tsc --noEmit",
            "npm run report --section ingestion --status Complete --pct 100"
        )
}

Write-Host "`n✓ Workflow complete." -ForegroundColor Green
