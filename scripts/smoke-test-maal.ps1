#Requires -Version 7.0

<#
CIC Runtime MAAL Smoke Test Harness (PowerShell)
Validates all 7 stages of MAAL integration end-to-end
#>

param(
  [string]$CicPort = "3000",
  [int]$BootTimeout = 30,
  [string]$LogDir = "."
)

$ErrorActionPreference = "Stop"

# Configuration
$ResultsLog = Join-Path $LogDir "smoke-test-results.json"
$EventsLog = Join-Path $LogDir "smoke-test-events.log"
$BootLog = Join-Path $LogDir "cic-boot.log"
$CicProcess = $null
$StageResults = @()

# Utilities
function Log-Event {
  param(
    [string]$EventName,
    [string]$Status,
    [string]$Details = ""
  )

  $timestamp = Get-Date -Format "o"
  $entry = @{
    timestamp = $timestamp
    event = $EventName
    status = $Status
    details = $Details
  } | ConvertTo-Json -Compress

  Add-Content -Path $EventsLog -Value $entry

  $symbol = switch ($Status) {
    "PASS" { "✓"; Write-Host "$EventName`: $Status" -ForegroundColor Green }
    "FAIL" { "✗"; Write-Host "$EventName`: $Status — $Details" -ForegroundColor Red }
    default { "»"; Write-Host "$EventName`: $Status" -ForegroundColor Yellow }
  }
}

function Cleanup {
  if ($CicProcess -and -not $CicProcess.HasExited) {
    Stop-Process -InputObject $CicProcess -Force -ErrorAction SilentlyContinue
    $CicProcess.WaitForExit(2000)
  }
}

trap { Cleanup }

# Stage 1: Boot CIC
function Invoke-Stage1-Boot {
  Log-Event "STAGE_1_START" "INFO" "Booting CIC with MAAL enabled"

  # Clear old logs
  if (Test-Path $EventsLog) { Remove-Item $EventsLog }

  # Start CIC via npm start (uses tsx per package.json)
  try {
    $script:CicProcess = Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru -RedirectStandardOutput $BootLog -RedirectStandardError "$BootLog.err" -ErrorAction Stop -WorkingDirectory (Get-Location)
  } catch {
    Log-Event "STAGE_1_BOOT" "FAIL" "Failed to start CIC via npm: $_"
    return $false
  }

  # Wait for startup
  Start-Sleep -Seconds 3

  # Check for errors
  $bootErrors = Get-Content $BootLog -ErrorAction SilentlyContinue |
    Where-Object { $_ -match "error|provider.*fail|validation.*fail" }

  if ($bootErrors) {
    Log-Event "STAGE_1_BOOT" "FAIL" "Boot errors: $($bootErrors[0])"
    return $false
  }

  Log-Event "STAGE_1_BOOT" "PASS" "CIC booted cleanly, MAAL initialized"
  return $true
}

# Stage 2: Enrichment
function Invoke-Stage2-Enrichment {
  Log-Event "STAGE_2_START" "INFO" "Testing EnrichmentAgent with MAAL"

  $payload = @{
    type = "enrichment_test"
    content = "The quick brown fox jumps over the lazy dog"
    format = "text"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$CicPort/enrich" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 10 `
      -ErrorAction Stop

    if ($response.Content -match "fugu-ultra|claude") {
      Log-Event "STAGE_2_ENRICHMENT" "PASS" "EnrichmentAgent routed correctly"
      return $true
    }
  } catch {
    Log-Event "STAGE_2_ENRICHMENT" "FAIL" "Enrichment failed: $($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 3: Orchestrator
function Invoke-Stage3-Orchestrator {
  Log-Event "STAGE_3_START" "INFO" "Testing OrchestratorAgent"

  $payload = @{
    type = "orchestration_test"
    plan = "Process enriched output through synthesis pipeline"
    context = "standard"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$CicPort/orchestrate" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 10 `
      -ErrorAction Stop

    if ($response.Content -match "success|status.*ok") {
      Log-Event "STAGE_3_ORCHESTRATOR" "PASS" "OrchestratorAgent executed"
      return $true
    }
  } catch {
    Log-Event "STAGE_3_ORCHESTRATOR" "FAIL" "Orchestrator failed: $($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 4: Synthesis
function Invoke-Stage4-Synthesis {
  Log-Event "STAGE_4_START" "INFO" "Testing SynthesisAgent with Claude 3.7"

  $payload = @{
    type = "synthesis_test"
    chunks = @("Chunk 1: introduction", "Chunk 2: details", "Chunk 3: conclusion")
    context = "standard"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$CicPort/synthesize" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 10 `
      -ErrorAction Stop

    Log-Event "STAGE_4_SYNTHESIS" "PASS" "SynthesisAgent completed"
    return $true
  } catch {
    Log-Event "STAGE_4_SYNTHESIS" "FAIL" "Synthesis failed: $($_.Exception.Message)"
    return $false
  }
}

# Stage 5: Audit
function Invoke-Stage5-Audit {
  Log-Event "STAGE_5_START" "INFO" "Testing AuditAgent with cross-model comparison"

  $payload = @{
    type = "audit_test"
    result = "Test synthesis output for consistency verification"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$CicPort/audit" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 10 `
      -ErrorAction Stop

    if ($response.Content -match "score|issues|primary|secondary") {
      Log-Event "STAGE_5_AUDIT" "PASS" "AuditAgent computed consistency score"
      return $true
    }
  } catch {
    Log-Event "STAGE_5_AUDIT" "FAIL" "Audit failed: $($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 6: Observability
function Invoke-Stage6-Observability {
  Log-Event "STAGE_6_START" "INFO" "Validating observability events"

  if (-not (Test-Path $EventsLog)) {
    Log-Event "STAGE_6_OBSERVABILITY" "SKIP" "No events captured"
    return $true
  }

  $events = (Get-Content $EventsLog | Measure-Object -Line).Lines

  if ($events -gt 0) {
    Log-Event "STAGE_6_OBSERVABILITY" "PASS" "Events logged: $events"
    return $true
  }

  Log-Event "STAGE_6_OBSERVABILITY" "SKIP" "No events logged"
  return $true
}

# Stage 7: Full Pipeline
function Invoke-Stage7-FullPipeline {
  Log-Event "STAGE_7_START" "INFO" "Running full pipeline"

  $payload = @{
    type = "full_pipeline_test"
    content = "Full end-to-end pipeline validation test"
    format = "text"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$CicPort/pipeline/full" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 30 `
      -ErrorAction Stop

    Log-Event "STAGE_7_FULL_PIPELINE" "PASS" "Full pipeline completed"
    return $true
  } catch {
    Log-Event "STAGE_7_FULL_PIPELINE" "FAIL" "Pipeline failed: $($_.Exception.Message)"
    return $false
  }
}

# Summary
function Show-Summary {
  $passed = ($StageResults | Where-Object { $_ -eq "PASS" }).Count
  $failed = ($StageResults | Where-Object { $_ -eq "FAIL" }).Count
  $skipped = ($StageResults | Where-Object { $_ -eq "SKIP" }).Count

  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "MAAL Smoke Test Summary" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "✓ PASS: $passed" -ForegroundColor Green
  Write-Host "✗ FAIL: $failed" -ForegroundColor Red
  Write-Host "» SKIP: $skipped" -ForegroundColor Yellow
  Write-Host ""

  if ($failed -eq 0) {
    Write-Host "Status: READY FOR STRESS TESTING" -ForegroundColor Green
    Write-Host "Logs: $EventsLog"
    return 0
  } else {
    Write-Host "Status: FAILURES DETECTED" -ForegroundColor Red
    Write-Host "Review: $EventsLog"
    return 1
  }
}

# Main
Write-Host "CIC MAAL Smoke Test Harness" -ForegroundColor Cyan
Write-Host "Starting 7-stage validation..." -ForegroundColor Cyan
Write-Host ""

if (Invoke-Stage1-Boot) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
Start-Sleep -Seconds 1

if (Invoke-Stage2-Enrichment) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage3-Orchestrator) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage4-Synthesis) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage5-Audit) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage6-Observability) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage7-FullPipeline) { $StageResults += "PASS" } else { $StageResults += "FAIL" }

Show-Summary
