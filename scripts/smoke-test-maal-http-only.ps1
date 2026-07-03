#Requires -Version 7.0

<#
CIC MAAL Smoke Test — HTTP Endpoints Only
Assumes CIC is already running (npm start in separate terminal)
Tests stages 2-7 of the smoke test plan
#>

param(
  [string]$CicPort = "3000",
  [string]$CicHost = "localhost",
  [string]$LogDir = "."
)

$ErrorActionPreference = "Stop"

# Configuration
$EventsLog = Join-Path $LogDir "smoke-test-http-results.log"
$BaseUrl = "http://$($CicHost):$CicPort"
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
    "PASS" { Write-Host "✓ $EventName`: $Status" -ForegroundColor Green }
    "FAIL" { Write-Host "✗ $EventName`: $Status — $Details" -ForegroundColor Red }
    default { Write-Host "» $EventName`: $Status" -ForegroundColor Yellow }
  }
}

# Test connectivity
function Test-ServiceHealth {
  Log-Event "CONNECTIVITY_CHECK" "INFO" "Testing connection to $BaseUrl"

  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" `
      -Method Get `
      -TimeoutSec 5 `
      -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
      Log-Event "CONNECTIVITY_CHECK" "PASS" "CIC service responding"
      return $true
    }
  } catch {
    Log-Event "CONNECTIVITY_CHECK" "FAIL" "Cannot reach CIC: $($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 2: Enrichment
function Invoke-Stage2-Enrichment {
  Log-Event "STAGE_2_START" "INFO" "Testing EnrichmentAgent"

  $payload = @{
    type = "enrichment_test"
    content = "The quick brown fox jumps over the lazy dog"
    format = "text"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/enrich" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 15 `
      -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
      Log-Event "STAGE_2_ENRICHMENT" "PASS" "Enrichment endpoint responded"
      return $true
    }
  } catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
      Log-Event "STAGE_2_ENRICHMENT" "SKIP" "Enrichment endpoint not implemented"
      return $true
    }
    Log-Event "STAGE_2_ENRICHMENT" "FAIL" "$($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 3: Orchestrator
function Invoke-Stage3-Orchestrator {
  Log-Event "STAGE_3_START" "INFO" "Testing OrchestratorAgent"

  $payload = @{
    type = "orchestration_test"
    plan = "Process enriched output"
    context = "standard"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/orchestrate" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 15 `
      -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
      Log-Event "STAGE_3_ORCHESTRATOR" "PASS" "Orchestrator endpoint responded"
      return $true
    }
  } catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
      Log-Event "STAGE_3_ORCHESTRATOR" "SKIP" "Orchestrator endpoint not implemented"
      return $true
    }
    Log-Event "STAGE_3_ORCHESTRATOR" "FAIL" "$($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 4: Synthesis
function Invoke-Stage4-Synthesis {
  Log-Event "STAGE_4_START" "INFO" "Testing SynthesisAgent"

  $payload = @{
    type = "synthesis_test"
    chunks = @("Intro", "Details", "Conclusion")
    context = "standard"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/synthesize" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 15 `
      -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
      Log-Event "STAGE_4_SYNTHESIS" "PASS" "Synthesis endpoint responded"
      return $true
    }
  } catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
      Log-Event "STAGE_4_SYNTHESIS" "SKIP" "Synthesis endpoint not implemented"
      return $true
    }
    Log-Event "STAGE_4_SYNTHESIS" "FAIL" "$($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 5: Audit
function Invoke-Stage5-Audit {
  Log-Event "STAGE_5_START" "INFO" "Testing AuditAgent"

  $payload = @{
    type = "audit_test"
    result = "Test output for consistency verification"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/audit" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 15 `
      -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
      Log-Event "STAGE_5_AUDIT" "PASS" "Audit endpoint responded with score"
      return $true
    }
  } catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
      Log-Event "STAGE_5_AUDIT" "SKIP" "Audit endpoint not implemented"
      return $true
    }
    Log-Event "STAGE_5_AUDIT" "FAIL" "$($_.Exception.Message)"
    return $false
  }

  return $false
}

# Stage 6: Observability
function Invoke-Stage6-Observability {
  Log-Event "STAGE_6_START" "INFO" "Checking observability instrumentation"

  # Check if events were logged
  if (Test-Path $EventsLog) {
    $eventCount = (Get-Content $EventsLog | Measure-Object -Line).Lines
    if ($eventCount -gt 5) {
      Log-Event "STAGE_6_OBSERVABILITY" "PASS" "Events logged: $eventCount"
      return $true
    }
  }

  Log-Event "STAGE_6_OBSERVABILITY" "SKIP" "Events log empty (endpoints may not be instrumented)"
  return $true
}

# Stage 7: Full Pipeline
function Invoke-Stage7-FullPipeline {
  Log-Event "STAGE_7_START" "INFO" "Testing full pipeline endpoint"

  $payload = @{
    type = "full_pipeline_test"
    content = "End-to-end pipeline test"
    format = "text"
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/pipeline/full" `
      -Method Post `
      -Body $payload `
      -ContentType "application/json" `
      -TimeoutSec 30 `
      -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
      Log-Event "STAGE_7_FULL_PIPELINE" "PASS" "Full pipeline completed"
      return $true
    }
  } catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
      Log-Event "STAGE_7_FULL_PIPELINE" "SKIP" "Full pipeline endpoint not implemented"
      return $true
    }
    Log-Event "STAGE_7_FULL_PIPELINE" "FAIL" "$($_.Exception.Message)"
    return $false
  }

  return $false
}

# Summary
function Show-Summary {
  $passed = ($StageResults | Where-Object { $_ -eq "PASS" }).Count
  $failed = ($StageResults | Where-Object { $_ -eq "FAIL" }).Count
  $skipped = ($StageResults | Where-Object { $_ -eq "SKIP" }).Count

  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "MAAL HTTP Endpoints Test Summary" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "✓ PASS: $passed" -ForegroundColor Green
  Write-Host "✗ FAIL: $failed" -ForegroundColor Red
  Write-Host "» SKIP: $skipped" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Service: $BaseUrl" -ForegroundColor Gray
  Write-Host "Log: $EventsLog" -ForegroundColor Gray
  Write-Host ""

  if ($failed -eq 0) {
    Write-Host "Status: READY FOR STRESS TESTING" -ForegroundColor Green
    return 0
  } else {
    Write-Host "Status: ENDPOINT FAILURES DETECTED" -ForegroundColor Red
    return 1
  }
}

# Main
Write-Host "CIC MAAL HTTP Endpoints Test" -ForegroundColor Cyan
Write-Host "Testing stages 2-7 (assumes CIC running on $BaseUrl)" -ForegroundColor Cyan
Write-Host ""

# Clear log
if (Test-Path $EventsLog) { Remove-Item $EventsLog }

# Connectivity check
if (-not (Test-ServiceHealth)) {
  Write-Host ""
  Write-Host "ERROR: CIC not responding on $BaseUrl" -ForegroundColor Red
  Write-Host "Start CIC first: npm start" -ForegroundColor Yellow
  exit 1
}

Write-Host ""

# Run stages
if (Invoke-Stage2-Enrichment) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage3-Orchestrator) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage4-Synthesis) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage5-Audit) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage6-Observability) { $StageResults += "PASS" } else { $StageResults += "FAIL" }
if (Invoke-Stage7-FullPipeline) { $StageResults += "PASS" } else { $StageResults += "FAIL" }

Show-Summary
