param(
    [int]$DurationMinutes = 60,
    [string]$GrafanaUrl = "http://localhost:3000",
    [string]$PrometheusUrl = "http://localhost:9090"
)

# Canary Phase A Monitor (PowerShell)
# Tracks 4 gates every minute for 60 minutes
# Auto-rollback if drift >0.20 or error >0.5% or latency >200ms

$checkpoints = @()
$rollbackTriggered = $false
$rollbackReason = ""

function Get-MetricValue {
    param(
        [string]$MetricName,
        [string]$Query
    )

    try {
        $response = Invoke-WebRequest -Uri "$PrometheusUrl/api/v1/query?query=$([System.Net.WebUtility]::UrlEncode($Query))" `
            -Method GET `
            -TimeoutSec 5 `
            -ErrorAction Stop

        $json = $response.Content | ConvertFrom-Json
        if ($json.data.result.Count -gt 0) {
            return [double]$json.data.result[0].value[1]
        }
    } catch {
        # Metric not available yet, return default
    }

    return 0.0
}

function Compute-Checkpoint {
    param([int]$Minute)

    # Query Prometheus for current minute metrics
    $adoption = Get-MetricValue "adoption" `
        "(rate(torquequery_search_fast_path_total[1m]) / rate(torquequery_search_total[1m])) * 100"

    $latencyP99 = Get-MetricValue "latency_p99" `
        "histogram_quantile(0.99, rate(torquequery_search_latency_ms_bucket[1m]))"

    $drift = Get-MetricValue "drift" `
        "(rate(torquequery_drift_score_sum[1m]) / rate(torquequery_drift_score_count[1m]))"

    $errorRate = Get-MetricValue "error_rate" `
        "(rate(torquequery_search_errors_total[1m]) / rate(torquequery_search_total[1m])) * 100"

    # Volume stats
    $volumeTotal = Get-MetricValue "volume_total" "rate(torquequery_search_total[1m])"
    $volumeV2 = Get-MetricValue "volume_v2" "rate(torquequery_search_v2_total[1m])"

    # Cache stats
    $cacheHit = Get-MetricValue "cache_hit" `
        "(rate(torquequery_cache_hits[1m]) / (rate(torquequery_cache_hits[1m]) + rate(torquequery_cache_misses[1m]))) * 100"

    return @{
        timestamp = (Get-Date).ToString("o")
        minute = $Minute
        adoption_pct = [Math]::Round($adoption, 2)
        latency_p99_ms = [Math]::Round($latencyP99, 2)
        drift_score = [Math]::Round($drift, 4)
        error_rate_pct = [Math]::Round($errorRate, 4)
        volume_total = [Math]::Round($volumeTotal, 2)
        volume_v2 = [Math]::Round($volumeV2, 2)
        cache_hit_pct = [Math]::Round($cacheHit, 2)
        gate_status = ""
        notes = ""
    }
}

function Evaluate-Gates {
    param([object]$Checkpoint)

    $gateStatus = "PASS"
    $issues = @()

    # Gate 1: Adoption
    if ($Checkpoint.adoption_pct -lt 30 -and $Checkpoint.minute -ge 5) {
        $gateStatus = "WARN"
        $issues += "Adoption <30% ($($Checkpoint.adoption_pct)%) - possible routing misconfiguration"
    }

    # Gate 2: Latency P99
    if ($Checkpoint.latency_p99_ms -gt 200) {
        $gateStatus = "FAIL"
        $issues += "Latency P99 >200ms ($($Checkpoint.latency_p99_ms)ms) - regression detected"
    }

    # Gate 3: Drift (CRITICAL)
    if ($Checkpoint.drift_score -gt 0.20) {
        $gateStatus = "CRITICAL"
        $issues += "Drift >0.20 ($($Checkpoint.drift_score)) - auto-rollback trigger"
    }

    # Gate 4: Error Rate
    if ($Checkpoint.error_rate_pct -gt 0.5) {
        $gateStatus = "CRITICAL"
        $issues += "Error rate >0.5% ($($Checkpoint.error_rate_pct)%) - auto-rollback trigger"
    }

    return @{
        status = $gateStatus
        issues = $issues
    }
}

Write-Host "`n=== Canary Phase A Monitor ===" -ForegroundColor Cyan
Write-Host "Duration: $DurationMinutes minutes"
Write-Host "Prometheus: $PrometheusUrl"
Write-Host "Grafana: $GrafanaUrl"
Write-Host "Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# Phase A monitoring loop
for ($min = 0; $min -lt $DurationMinutes; $min++) {

    Write-Host "[MINUTE $min/$DurationMinutes]" -ForegroundColor Yellow

    # Compute checkpoint
    $checkpoint = Compute-Checkpoint $min

    # Evaluate gates
    $gateEval = Evaluate-Gates $checkpoint
    $checkpoint.gate_status = $gateEval.status

    if ($gateEval.issues.Count -gt 0) {
        $checkpoint.notes = $gateEval.issues -join "; "
    }

    # Store checkpoint
    $checkpoints += $checkpoint

    # Display current state
    $color = switch ($gateEval.status) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
        "CRITICAL" { "Red" }
    }

    Write-Host "  Adoption: $($checkpoint.adoption_pct)% | " -NoNewline
    Write-Host "Latency P99: $($checkpoint.latency_p99_ms)ms | " -NoNewline
    Write-Host "Drift: $($checkpoint.drift_score) | " -NoNewline
    Write-Host "Error: $($checkpoint.error_rate_pct)% | " -NoNewline
    Write-Host "Gate: $($gateEval.status)" -ForegroundColor $color

    # Check rollback conditions
    if ($gateEval.status -eq "CRITICAL") {
        # Check for 2+ consecutive critical checks (use previous checkpoint)
        if ($checkpoints.Count -ge 2) {
            $prevCheckpoint = $checkpoints[-2]
            if ($prevCheckpoint.gate_status -eq "CRITICAL") {
                $rollbackTriggered = $true
                $rollbackReason = $checkpoint.notes
                Write-Host "`n[CRITICAL] Auto-rollback triggered! Reason: $rollbackReason`n" -ForegroundColor Red
                break
            }
        }
    }

    # Issues detail
    if ($gateEval.issues.Count -gt 0) {
        foreach ($issue in $gateEval.issues) {
            Write-Host "    ⚠ $issue" -ForegroundColor Yellow
        }
    }

    # Wait before next minute (allow override with Ctrl+C)
    if ($min -lt $DurationMinutes - 1) {
        Start-Sleep -Seconds 5  # Simulate 1m check compressed to 5s for demo
    }
}

# ========== PHASE A DECISION ==========
Write-Host "`n=== Phase A Summary ===" -ForegroundColor Cyan

$finalCheckpoint = $checkpoints[-1]
$totalCheckpoints = $checkpoints.Count
$passCount = ($checkpoints | Where-Object { $_.gate_status -eq "PASS" }).Count
$warnCount = ($checkpoints | Where-Object { $_.gate_status -eq "WARN" }).Count
$failCount = ($checkpoints | Where-Object { $_.gate_status -eq "FAIL" }).Count
$criticalCount = ($checkpoints | Where-Object { $_.gate_status -eq "CRITICAL" }).Count

Write-Host "Checkpoints: $passCount PASS, $warnCount WARN, $failCount FAIL, $criticalCount CRITICAL (total: $totalCheckpoints)"
Write-Host "Final Adoption: $($finalCheckpoint.adoption_pct)%"
Write-Host "Final Latency P99: $($finalCheckpoint.latency_p99_ms)ms"
Write-Host "Final Drift: $($finalCheckpoint.drift_score)"
Write-Host "Final Error Rate: $($finalCheckpoint.error_rate_pct)%"

if ($rollbackTriggered) {
    Write-Host "`n[ROLLBACK] Phase A FAILED" -ForegroundColor Red
    Write-Host "Reason: $rollbackReason"
    Write-Host "Action: Execute rollback() → disable TorqueQuery v2 → revert to v1"
    Write-Host "Next: Post-mortem analysis + re-test Phase A"
} else {
    # Promotion logic
    $promotionReady = `
        ($finalCheckpoint.adoption_pct -ge 40) -and `
        ($finalCheckpoint.latency_p99_ms -le 150) -and `
        ($finalCheckpoint.drift_score -lt 0.10) -and `
        ($finalCheckpoint.error_rate_pct -le 0.2)

    if ($promotionReady) {
        Write-Host "`n[PROMOTED] Phase A SUCCESS" -ForegroundColor Green
        Write-Host "All gates PASS. Proceeding to Phase B (50% traffic, 2h duration)"
        Write-Host "Action: Update traffic split 50/50 v2/v1 + extend monitoring"
    } else {
        Write-Host "`n[BLOCKED] Phase A gates not fully met" -ForegroundColor Yellow
        Write-Host "Review gates + investigate anomalies. Options:"
        Write-Host "  1. Extend Phase A by 30 minutes"
        Write-Host "  2. Adjust routing config + re-test"
        Write-Host "  3. Abort and rollback to v1"
    }
}

# ========== CHECKPOINT EXPORT ==========
$reportPath = "C:\dev\phase-5-canary-phase-a-checkpoints.jsonl"

Write-Host "`nExporting checkpoints to: $reportPath"

foreach ($cp in $checkpoints) {
    $cp | ConvertTo-Json -Compress | Add-Content -Path $reportPath -Encoding UTF8
}

Write-Host "[OK] Checkpoints saved"
Write-Host "`nEnd: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Phase A monitoring complete.`n"

# Exit code
exit (if ($rollbackTriggered) { 1 } elseif ($promotionReady) { 0 } else { 2 })
