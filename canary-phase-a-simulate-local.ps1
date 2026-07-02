param(
    [int]$SpeedupFactor = 12  # 1 minute = 5 seconds for demo
)

# Canary Phase A Local Simulation (Dev/Test)
# Simulates realistic Phase A metrics progression
# Runs full 60-minute canary in ~5 minutes (compressed)

Write-Host "`n=== Canary Phase A Simulation (Local) ===" -ForegroundColor Cyan
Write-Host "Duration: 60 minutes (compressed to ~5 minutes)"
Write-Host "Speedup: ${SpeedupFactor}x"
Write-Host "Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# Simulated metrics (minute 0-59)
# Realistic progression: metrics improve over time, then stabilize
$simulatedMetrics = @(
    # min 0-9: ramp-up
    @{adoption=5; latency=180; drift=0.150; error=0.15},
    @{adoption=15; latency=175; drift=0.130; error=0.12},
    @{adoption=25; latency=170; drift=0.110; error=0.10},
    @{adoption=35; latency=160; drift=0.095; error=0.08},
    @{adoption=42; latency=155; drift=0.085; error=0.06},
    @{adoption=48; latency=150; drift=0.078; error=0.05},
    @{adoption=52; latency=148; drift=0.075; error=0.04},
    @{adoption=55; latency=146; drift=0.072; error=0.04},
    @{adoption=57; latency=145; drift=0.070; error=0.03},
    @{adoption=58; latency=144; drift=0.068; error=0.03},
    # min 10-19: stabilizing
    @{adoption=59; latency=143; drift=0.067; error=0.03},
    @{adoption=60; latency=142; drift=0.066; error=0.02},
    @{adoption=61; latency=141; drift=0.065; error=0.02},
    @{adoption=62; latency=140; drift=0.064; error=0.02},
    @{adoption=62; latency=140; drift=0.064; error=0.02},
    @{adoption=63; latency=139; drift=0.063; error=0.02},
    @{adoption=63; latency=139; drift=0.063; error=0.02},
    @{adoption=64; latency=138; drift=0.062; error=0.02},
    @{adoption=64; latency=138; drift=0.062; error=0.02},
    @{adoption=65; latency=137; drift=0.061; error=0.02}
)

# Repeat to get 60 minutes
while ($simulatedMetrics.Count -lt 60) {
    $simulatedMetrics += $simulatedMetrics[-1]  # Repeat last metric
}

$checkpoints = @()
$passCount = 0
$warnCount = 0
$failCount = 0
$criticalCount = 0

# Monitoring loop (60 iterations, compressed)
for ($min = 0; $min -lt 60; $min++) {
    $metric = $simulatedMetrics[$min]

    $checkpoint = @{
        timestamp = (Get-Date).ToString("o")
        minute = $min
        adoption_pct = $metric.adoption
        latency_p99_ms = $metric.latency
        drift_score = $metric.drift
        error_rate_pct = $metric.error
        volume_total = 2600
        volume_v2 = [int](2600 * $metric.adoption / 100)
        cache_hit_pct = 87.5
        gate_status = ""
        notes = ""
    }

    # Evaluate gates
    $issues = @()
    $gateStatus = "PASS"

    if ($metric.adoption -lt 30 -and $min -gt 5) {
        $gateStatus = "WARN"
        $issues += "Adoption <30% ($($metric.adoption)%)"
    }

    if ($metric.latency -gt 200) {
        $gateStatus = "FAIL"
        $issues += "Latency P99 >200ms ($($metric.latency)ms)"
    }

    if ($metric.drift -gt 0.20) {
        $gateStatus = "CRITICAL"
        $issues += "Drift >0.20 ($($metric.drift))"
    }

    if ($metric.error -gt 0.5) {
        $gateStatus = "CRITICAL"
        $issues += "Error rate >0.5% ($($metric.error)%)"
    }

    $checkpoint.gate_status = $gateStatus
    $checkpoint.notes = if ($issues.Count -gt 0) { $issues -join "; " } else { "" }

    # Count verdicts
    switch ($gateStatus) {
        "PASS" { $passCount++ }
        "WARN" { $warnCount++ }
        "FAIL" { $failCount++ }
        "CRITICAL" { $criticalCount++ }
    }

    $checkpoints += $checkpoint

    # Display
    $color = switch ($gateStatus) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
        "CRITICAL" { "Red" }
    }

    $display = "[{0:D2}] " -f $min
    $display += "Adopt: {0:D2}% | Lat P99: {1:D3}ms | Drift: {2:F3} | Error: {3:F2}% | Status: {4}" -f `
        $metric.adoption, $metric.latency, $metric.drift, $metric.error, $gateStatus

    Write-Host $display -ForegroundColor $color

    if ($issues.Count -gt 0) {
        foreach ($issue in $issues) {
            Write-Host "     ⚠ $issue" -ForegroundColor Yellow
        }
    }

    # Simulate time delay (speedup factor)
    Start-Sleep -Milliseconds (5000 / $SpeedupFactor)
}

# Summary
Write-Host "`n=== Phase A Simulation Results ===" -ForegroundColor Cyan
Write-Host "Total Checkpoints: 60"
Write-Host "  PASS: $passCount"
Write-Host "  WARN: $warnCount"
Write-Host "  FAIL: $failCount"
Write-Host "  CRITICAL: $criticalCount"

$finalMetric = $simulatedMetrics[59]
Write-Host "`nFinal State (minute 59):"
Write-Host "  Adoption: $($finalMetric.adoption)%"
Write-Host "  Latency P99: $($finalMetric.latency)ms"
Write-Host "  Drift: $($finalMetric.drift)"
Write-Host "  Error Rate: $($finalMetric.error)%"

# Promotion decision
$promotionReady = `
    ($finalMetric.adoption -ge 40) -and `
    ($finalMetric.latency -le 150) -and `
    ($finalMetric.drift -lt 0.10) -and `
    ($finalMetric.error -le 0.2) -and `
    ($criticalCount -eq 0)

Write-Host "`n" -NoNewline
if ($promotionReady) {
    Write-Host "[PROMOTED] Phase A SUCCESS" -ForegroundColor Green
    Write-Host "All gates PASS. Recommended: Proceed to Phase B (50% traffic, 2h)"
} else {
    Write-Host "[BLOCKED] Phase A gates not fully met" -ForegroundColor Yellow
    Write-Host "Failed gates:"
    if ($finalMetric.adoption -lt 40) { Write-Host "  - Adoption <40% ($($finalMetric.adoption)%)" }
    if ($finalMetric.latency -gt 150) { Write-Host "  - Latency P99 >150ms ($($finalMetric.latency)ms)" }
    if ($finalMetric.drift -ge 0.10) { Write-Host "  - Drift ≥0.10 ($($finalMetric.drift))" }
    if ($finalMetric.error -gt 0.2) { Write-Host "  - Error rate >0.2% ($($finalMetric.error)%)" }
    if ($criticalCount -gt 0) { Write-Host "  - Critical events detected ($criticalCount)" }
}

# Export
$reportPath = "C:\dev\phase-5-canary-phase-a-checkpoints-simulated.jsonl"
Write-Host "`nExporting checkpoints: $reportPath"

foreach ($cp in $checkpoints) {
    $cp | ConvertTo-Json -Compress | Add-Content -Path $reportPath -Encoding UTF8
}

Write-Host "[OK] Checkpoint export complete"
Write-Host "End: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

exit (if ($promotionReady) { 0 } else { 1 })
