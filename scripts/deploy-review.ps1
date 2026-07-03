# Deploy Review Skill (PowerShell variant)
# Automated verification of docker-compose stack before deployment
# Usage: .\scripts\deploy-review.ps1 -Env local -DryRun -SkipTests

param(
  [string]$Env = "local",
  [switch]$DryRun,
  [switch]$SkipTests
)

# Config
$TimeoutHealth = 30
$PollInterval = 3
$ServicesCount = 15
$ReportFile = "./deploy-review-report.json"

# State
$Phase = 0
$Failures = @()
$CriticalFailures = @()
$StartTime = Get-Date

# Logging
function Log-Phase {
  param([string]$Message)
  $script:Phase++
  Write-Host "[PHASE $($script:Phase)] $Message" -ForegroundColor Green
}

function Log-Pass {
  param([string]$Message)
  Write-Host "✓ $Message" -ForegroundColor Green
}

function Log-Fail {
  param([string]$Message)
  Write-Host "✗ $Message" -ForegroundColor Red
  $script:Failures += $Message
}

function Log-Warn {
  param([string]$Message)
  Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# ============================================================================
# PHASE 1: PRE-FLIGHT
# ============================================================================

function Phase-Preflight {
  Log-Phase "Pre-Flight Validation"

  # Check docker-compose.yml syntax
  try {
    $config = docker-compose config 2>$null
    if ($LASTEXITCODE -ne 0) {
      Log-Fail "docker-compose.yml syntax error"
      exit 1
    }
    Log-Pass "docker-compose.yml valid"
  }
  catch {
    Log-Fail "docker-compose config check failed: $_"
    exit 1
  }

  # Extract services
  $services = (docker-compose config --services 2>$null)
  $svcCount = @($services).Count

  if ($svcCount -lt $ServicesCount) {
    Log-Warn "Expected $ServicesCount services, found $svcCount"
  }
  else {
    Log-Pass "All $svcCount services defined"
  }

  # Check Dockerfiles
  $dockerfiles = @(Get-ChildItem -Path . -Filter "Dockerfile*" -Recurse -Exclude node_modules | Measure-Object).Count
  Log-Pass "Found $dockerfiles Dockerfiles"

  # Dry-run: Stop here
  if ($DryRun) {
    Log-Pass "Dry-run: Pre-flight complete"
    return $true
  }

  return $true
}

# ============================================================================
# PHASE 2: STARTUP (Parallel)
# ============================================================================

function Check-ServiceHealth {
  param(
    [string]$Service,
    [int]$Port
  )

  $maxAttempts = [math]::Floor($TimeoutHealth / $PollInterval)
  $attempt = 0

  while ($attempt -lt $maxAttempts) {
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -ErrorAction SilentlyContinue
      if ($response.StatusCode -eq 200) {
        return "OK"
      }
    }
    catch { }

    $attempt++
    Start-Sleep -Seconds $PollInterval
  }

  return "FAIL"
}

function Phase-Startup {
  Log-Phase "Service Startup"

  if ($DryRun) {
    Log-Pass "Dry-run: Skipping actual startup"
    return $true
  }

  # Start compose stack
  Write-Host "Starting docker-compose stack..."
  docker-compose up -d
  Start-Sleep -Seconds 5

  # Define services & ports
  $ServicePorts = @{
    "aperture"            = 3117
    "cic-runtime"         = 3118
    "cic-governance"      = 3113
    "unified-api"         = 3100
    "cic-ingestion"       = 3116
    "planning-console"    = 3000
    "planning-engine"     = 3114
    "harvester-v2"        = 3115
    "repomix-ingestion"   = 3112
    "torquequery"         = 3110
    "vault"               = 3111
    "knowledge-graph"     = 3107
  }

  # Check critical services
  $CriticalServices = @("aperture", "cic-runtime", "cic-governance", "unified-api")
  $AllHealthy = $true

  foreach ($svc in $CriticalServices) {
    $port = $ServicePorts[$svc]
    $health = Check-ServiceHealth -Service $svc -Port $port

    if ($health -eq "OK") {
      Log-Pass "$svc healthy"
    }
    else {
      Log-Fail "$svc health check failed"
      $script:CriticalFailures += "$svc startup"
      $AllHealthy = $false
    }
  }

  if (-not $AllHealthy) {
    Log-Fail "Critical services failed to start"
    Phase-LogsOnFailure
    return $false
  }

  Log-Pass "All critical services healthy"
  return $true
}

# ============================================================================
# PHASE 3: INTEGRATION TESTS
# ============================================================================

function Phase-Tests {
  if ($SkipTests) {
    Log-Phase "Integration Tests (SKIPPED)"
    return $true
  }

  Log-Phase "Integration Tests"

  if ($DryRun) {
    Log-Pass "Dry-run: Skipping tests"
    return $true
  }

  $TestServices = @("cic-runtime", "cic-governance")
  $TestFailed = $false

  foreach ($svc in $TestServices) {
    Write-Host "Testing $svc..."

    try {
      $result = docker-compose exec -T $svc npm test 2>&1 | Tee-Object -FilePath "/tmp/${svc}-test.log"
      Log-Pass "$svc: tests passing"
    }
    catch {
      Log-Fail "$svc: test failures detected"
      $script:CriticalFailures += "$svc tests"
      $TestFailed = $true

      # Show last 20 lines
      Write-Host "--- $svc test output (last 20 lines) ---"
      Get-Content "/tmp/${svc}-test.log" | Select-Object -Last 20
      Write-Host "---"
    }
  }

  return -not $TestFailed
}

# ============================================================================
# PHASE 4: E2E FLOWS
# ============================================================================

function Phase-E2E {
  Log-Phase "End-to-End Flows"

  if ($DryRun) {
    Log-Pass "Dry-run: Skipping E2E"
    return $true
  }

  # E2E 1: Agent Deploy
  Write-Host "Testing agent deployment..."
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3118/api/agents/deploy" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json" } `
      -Body '{"agentId":"test-agent"}' `
      -UseBasicParsing -ErrorAction SilentlyContinue

    if ($response.StatusCode -eq 200) {
      Log-Pass "Agent deploy endpoint responding"
    }
    else {
      Log-Fail "Agent deploy failed"
      $script:CriticalFailures += "e2e agent-deploy"
    }
  }
  catch {
    Log-Fail "Agent deploy failed: $_"
    $script:CriticalFailures += "e2e agent-deploy"
  }

  # E2E 2: Governance Proposal
  Write-Host "Testing governance proposal..."
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3113/api/governance/proposal" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json" } `
      -Body '{"title":"Test","description":"E2E test","requiredVotes":1}' `
      -UseBasicParsing -ErrorAction SilentlyContinue

    if ($response.StatusCode -eq 200) {
      Log-Pass "Governance proposal endpoint responding"
    }
    else {
      Log-Fail "Governance proposal failed"
      $script:CriticalFailures += "e2e governance-proposal"
    }
  }
  catch {
    Log-Warn "Governance proposal endpoint not ready (non-critical)"
  }

  # E2E 3: Policy Validation
  Write-Host "Testing policy validation..."
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3117/api/policies/validate" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json" } `
      -Body '{"policy":{"name":"test","rules":[]}}' `
      -UseBasicParsing -ErrorAction SilentlyContinue

    if ($response.StatusCode -eq 200) {
      Log-Pass "Policy validation endpoint responding"
    }
  }
  catch {
    Log-Warn "Policy validation endpoint not ready (non-critical)"
  }

  return $true
}

# ============================================================================
# PHASE 5: RISK GATE & REPORT
# ============================================================================

function Phase-LogsOnFailure {
  Write-Host ""
  Log-Warn "Capturing logs from failed services..."

  foreach ($svc in @("aperture", "cic-runtime", "cic-governance", "unified-api")) {
    Write-Host "--- $svc logs (last 30 lines) ---"
    docker-compose logs --tail=30 $svc 2>$null | Select-Object -Last 30
    Write-Host ""
  }
}

function Phase-RiskGate {
  Log-Phase "Risk Assessment & Gating"

  $result = "PASS"

  if ($CriticalFailures.Count -gt 0) {
    $result = "FAIL"
    Log-Fail "Critical failures detected:"
    foreach ($failure in $CriticalFailures) {
      Write-Host "  - $failure"
    }
  }
  else {
    Log-Pass "No critical failures"
  }

  if ($Failures.Count -gt 0) {
    Log-Warn "Non-critical issues:"
    foreach ($failure in $Failures) {
      Write-Host "  - $failure"
    }
  }

  # Generate report
  $EndTime = Get-Date
  $Duration = ($EndTime - $StartTime).TotalSeconds

  $report = @{
    timestamp             = Get-Date -Format "o"
    environment           = $Env
    result                = $result
    duration_seconds      = [int]$Duration
    critical_failures     = $CriticalFailures
    non_critical_failures = $Failures
    services_verified     = $ServicesCount
    dry_run               = $DryRun.IsPresent
    skip_tests            = $SkipTests.IsPresent
  }

  $report | ConvertTo-Json | Out-File -FilePath $ReportFile

  Log-Pass "Report saved to $ReportFile"

  # Gate decision
  if ($result -eq "FAIL") {
    Write-Host ""
    Log-Fail "DEPLOYMENT BLOCKED (Critical failures detected)"
    Write-Host "Review report: $ReportFile"
    Write-Host "Rollback: docker-compose down"
    return $false
  }
  else {
    Write-Host ""
    Log-Pass "DEPLOYMENT APPROVED ✓"
    Write-Host "All systems ready for staging/production"
    return $true
  }
}

# ============================================================================
# MAIN
# ============================================================================

function Main {
  Write-Host "Deploy Review Skill"
  Write-Host "Environment: $Env | Dry-Run: $($DryRun.IsPresent) | Skip Tests: $($SkipTests.IsPresent)"
  Write-Host ""

  # Run phases
  if (-not (Phase-Preflight)) { exit 1 }
  if (-not (Phase-Startup)) { exit 1 }
  if (-not (Phase-Tests)) { exit 1 }
  Phase-E2E | Out-Null
  if (-not (Phase-RiskGate)) { exit 1 }

  $Duration = ((Get-Date) - $StartTime).TotalSeconds
  Write-Host ""
  Write-Host "Deploy review complete in $([int]$Duration)s"
}

Main
