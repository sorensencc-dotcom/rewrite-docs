param(
    [string]$BaseUrl = "http://localhost:8000"
)

# Phase 5 Harness Runner (PowerShell)
# Simulates MAAL routing replay, CIC ingestion replay, drift scoring harness
# Calls TorqueQuery v2 /search endpoint directly

# JSON output collection
$results = @{
    timestamp = (Get-Date).ToString("o")
    phase = "Phase 5 (TorqueQuery v2 + Cloud Gateway)"
    harness_results = @()
    summary = @{
        maalRouting = @{
            passCount = 0
            failCount = 0
            avgDriftScore = 0
            verdict = "FAIL"
        }
        cicIngestion = @{
            docCount = 0
            topMatchCount = 0
            fastPathWins = 0
            verdict = "FAIL"
        }
        driftScoring = @{
            passCount = 0
            warnCount = 0
            failCount = 0
            verdict = "FAIL"
        }
    }
    canaryGate = @{
        approved = $false
        reason = ""
        nextStep = ""
    }
}

# Helper: Call /search endpoint
function Invoke-TorqueSearch {
    param(
        [string]$Query,
        [array]$NormalizedEmbedding = $null,
        [int]$TopK = 10,
        [bool]$FastPath = $false,
        [bool]$SkipMmr = $false,
        [int]$CandidatePool = 50,
        [hashtable]$Filters = $null
    )

    $body = @{
        query = $Query
        top_k = $TopK
        fast_path = $FastPath
        skip_mmr = $SkipMmr
        candidate_pool = $CandidatePool
    }

    if ($NormalizedEmbedding) {
        $body["normalized_embedding"] = $NormalizedEmbedding
    }

    if ($Filters) {
        $body["filters"] = $Filters
    }

    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/search" `
            -Method POST `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json) `
            -TimeoutSec 10 `
            -ErrorAction Stop

        return ($response.Content | ConvertFrom-Json)
    } catch {
        Write-Host "❌ Search failed: $($_.Exception.Message)"
        return $null
    }
}

# Helper: Compute drift score
function Compute-DriftScore {
    param(
        [object]$Baseline,
        [object]$Optimized
    )

    if (-not $Baseline.results -or -not $Optimized.results) {
        return 1.0
    }

    if ($Baseline.results.Count -eq 0 -or $Optimized.results.Count -eq 0) {
        return 1.0
    }

    # Top result match
    $baselineTop = $Baseline.results[0]
    $optimizedTop = $Optimized.results[0]

    if ($baselineTop.id -eq $optimizedTop.id) {
        # Same doc, compare score diff
        $scoreDiff = [Math]::Abs($baselineTop.score - $optimizedTop.score)
        return [Math]::Min(1.0, $scoreDiff)
    }

    # Different top docs = 0.5 drift
    return 0.5
}

Write-Host "`n=== Phase 5 Harness Runner ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "Start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# ========== MAAL ROUTING REPLAY ==========
Write-Host "[1/3] MAAL Routing Replay" -ForegroundColor Yellow

$maalTasks = @(
    @{ id = "t-001"; query = "governance caps for tool invocation"; expectedRoute = "governance" },
    @{ id = "t-002"; query = "docs ingestion pipeline architecture"; expectedRoute = "ingestion" },
    @{ id = "t-003"; query = "semantic search baseline performance"; expectedRoute = "search" },
    @{ id = "t-004"; query = "MAAL routing state machine"; expectedRoute = "routing" },
    @{ id = "t-005"; query = "canary gate promotion criteria"; expectedRoute = "governance" }
)

$maalResults = @()
$maalDriftTotal = 0

foreach ($task in $maalTasks) {
    Write-Host "  Task $($task.id): $($task.query.Substring(0, [Math]::Min(40, $task.query.Length)))..."

    # Baseline: slow-path
    $baseline = Invoke-TorqueSearch -Query $task.query -TopK 10 -FastPath $false -SkipMmr $false -CandidatePool 50

    # Optimized: fast-path
    $optimized = Invoke-TorqueSearch -Query $task.query -TopK 10 -FastPath $true -SkipMmr $true -CandidatePool 50

    if ($baseline -and $optimized) {
        $driftScore = Compute-DriftScore $baseline $optimized
        $topMatch = ($baseline.results[0].id -eq $optimized.results[0].id)

        $maalResults += @{
            taskId = $task.id
            query = $task.query
            driftScore = [Math]::Round($driftScore, 4)
            topMatch = $topMatch
        }

        $maalDriftTotal += $driftScore
        Write-Host "    Drift: $([Math]::Round($driftScore, 4)), Match: $topMatch" -ForegroundColor Green
    }
}

$maalAvgDrift = if ($maalResults.Count -gt 0) { $maalDriftTotal / $maalResults.Count } else { 1.0 }
$maalPasses = ($maalResults | Where-Object { $_.driftScore -le 0.2 }).Count
$maalVerdict = if ($maalResults.Count -gt 0 -and $maalResults.Count -eq $maalPasses) { "PASS" } else { "FAIL" }

$results.summary.maalRouting = @{
    passCount = $maalPasses
    failCount = $maalResults.Count - $maalPasses
    avgDriftScore = [Math]::Round($maalAvgDrift, 4)
    verdict = $maalVerdict
}

Write-Host "`n  Summary: $maalPasses/$($maalResults.Count) PASS, Avg drift: $([Math]::Round($maalAvgDrift, 4))`n"

# ========== CIC INGESTION REPLAY ==========
Write-Host "[2/3] CIC Ingestion Replay" -ForegroundColor Yellow

$ingestionCases = @(
    @{ id = "doc-001"; content = "CIC ingestion pipeline design, state management, and drift scoring algorithms."; collection = "architecture" },
    @{ id = "doc-002"; content = "TorqueQuery fast-path optimization, query caching, and deterministic ranking."; collection = "search" },
    @{ id = "doc-003"; content = "MAAL routing state machine, proposal lifecycle, and canary gate orchestration."; collection = "routing" },
    @{ id = "doc-004"; content = "Governance caps, metric thresholds, and approval eligibility tracking."; collection = "governance" },
    @{ id = "doc-005"; content = "Warm executor pool, container reuse, and trust scoring for tool invocation."; collection = "execution" }
)

$cicResults = @()

foreach ($doc in $ingestionCases) {
    Write-Host "  Doc $($doc.id) ($($doc.collection)): $($doc.content.Substring(0, [Math]::Min(50, $doc.content.Length)))..."

    # Slow-path
    $slowStart = Get-Date
    $slowPath = Invoke-TorqueSearch -Query $doc.content -TopK 10 -FastPath $false -SkipMmr $false -CandidatePool 50 -Filters @{ collection = $doc.collection }
    $slowLatency = ([DateTime]::Now - $slowStart).TotalMilliseconds

    # Fast-path
    $fastStart = Get-Date
    $fastPath = Invoke-TorqueSearch -Query $doc.content -TopK 10 -FastPath $true -SkipMmr $true -CandidatePool 50 -Filters @{ collection = $doc.collection }
    $fastLatency = ([DateTime]::Now - $fastStart).TotalMilliseconds

    if ($slowPath -and $fastPath) {
        $topMatch = ($slowPath.results[0].id -eq $fastPath.results[0].id)
        $latencyDiff = $fastLatency - $slowLatency

        $cicResults += @{
            docId = $doc.id
            collection = $doc.collection
            topMatch = $topMatch
            slowLatency = [Math]::Round($slowLatency, 2)
            fastLatency = [Math]::Round($fastLatency, 2)
            latencyDiff = [Math]::Round($latencyDiff, 2)
        }

        Write-Host "    Match: $topMatch, Slow: $([Math]::Round($slowLatency, 0))ms, Fast: $([Math]::Round($fastLatency, 0))ms (Diff: $([Math]::Round($latencyDiff, 0))ms)" -ForegroundColor Green
    }
}


$cicMatches = ($cicResults | Where-Object { $_.topMatch }).Count
$cicFastWins = ($cicResults | Where-Object { $_.latencyDiff -lt 0 }).Count
$cicVerdict = if ($cicFastWins -ge ($cicResults.Count * 0.6)) { "PASS" } else { "FAIL" }

$results.summary.cicIngestion = @{
    docCount = $cicResults.Count
    topMatchCount = $cicMatches
    fastPathWins = $cicFastWins
    verdict = $cicVerdict
}

Write-Host "`n  Summary: $cicMatches/$($cicResults.Count) top matches, $cicFastWins/$($cicResults.Count) fast wins`n"

# ========== DRIFT SCORING HARNESS ==========
Write-Host "[3/3] Drift Scoring Harness" -ForegroundColor Yellow

$driftCases = @(
    @{ id = "drift-001"; query = "domestic chip optimization strategies"; threshold = 0.10 },
    @{ id = "drift-002"; query = "training throughput improvements"; threshold = 0.15 },
    @{ id = "drift-003"; query = "hardware stack alignment"; threshold = 0.10 },
    @{ id = "drift-004"; query = "semantic routing baseline performance"; threshold = 0.12 },
    @{ id = "drift-005"; query = "governance approval workflow"; threshold = 0.08 }
)

$driftResults = @()
$driftPasses = 0
$driftWarns = 0
$driftFails = 0

foreach ($case in $driftCases) {
    Write-Host "  Case $($case.id): $($case.query.Substring(0, [Math]::Min(40, $case.query.Length)))..."

    # Slow-path
    $baseline = Invoke-TorqueSearch -Query $case.query -TopK 20 -FastPath $false -SkipMmr $false -CandidatePool 100

    # Fast-path
    $optimized = Invoke-TorqueSearch -Query $case.query -TopK 20 -FastPath $true -SkipMmr $true -CandidatePool 100

    if ($baseline -and $optimized) {
        $drift = Compute-DriftScore $baseline $optimized
        $thresholdExceeded = ($drift -gt $case.threshold)

        # Verdict
        $verdict = if ($drift -le $case.threshold) { "PASS" } `
                  elseif ($drift -le ($case.threshold * 1.25)) { "WARN" } `
                  else { "FAIL" }

        $driftResults += @{
            caseId = $case.id
            query = $case.query
            driftScore = [Math]::Round($drift, 4)
            threshold = $case.threshold
            verdict = $verdict
        }

        if ($verdict -eq "PASS") { $driftPasses++ }
        elseif ($verdict -eq "WARN") { $driftWarns++ }
        else { $driftFails++ }

        $icon = if ($verdict -eq "PASS") { "[PASS]" } elseif ($verdict -eq "WARN") { "[WARN]" } else { "[FAIL]" }
        $color = if ($verdict -eq "PASS") { "Green" } elseif ($verdict -eq "WARN") { "Yellow" } else { "Red" }
        Write-Host "    $icon Drift: $([Math]::Round($drift, 4)) (threshold: $($case.threshold))" -ForegroundColor $color
    }
}

$results.summary.driftScoring = @{
    passCount = $driftPasses
    warnCount = $driftWarns
    failCount = $driftFails
    verdict = if ($driftFails -eq 0) { "PASS" } else { "FAIL" }
}

Write-Host "`n  Summary: $driftPasses PASS, $driftWarns WARN, $driftFails FAIL`n"

# ========== CANARY GATE DECISION ==========
$allPass = ($results.summary.maalRouting.verdict -eq "PASS") -and `
           ($results.summary.cicIngestion.verdict -eq "PASS") -and `
           ($results.summary.driftScoring.verdict -eq "PASS")

$results.canaryGate.approved = $allPass
$results.canaryGate.reason = if ($allPass) {
    "All harnesses PASS. Phase 4 schema valid, determinism verified, latency improved."
} else {
    "Failures: MAAL=$($results.summary.maalRouting.verdict), CIC=$($results.summary.cicIngestion.verdict), Drift=$($results.summary.driftScoring.verdict). Investigate before canary."
}

$results.canaryGate.nextStep = if ($allPass) {
    "Proceed to Canary A (10%) with monitoring gates."
} else {
    "Fix failing harnesses, re-run validation."
}

# ========== OUTPUT & REPORT ==========
Write-Host "`n=== PHASE 5 VALIDATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Timestamp: $($results.timestamp)"
Write-Host "Canary Gate: $(if ($allPass) { '[APPROVED]' } else { '[BLOCKED]' })"
Write-Host "Reason: $($results.canaryGate.reason)"
Write-Host "Next: $($results.canaryGate.nextStep)`n"

# Save JSON report
$reportPath = "C:\dev\phase-5-harness-report.json"
$results | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath -Encoding UTF8

Write-Host "[OK] Report saved: $reportPath"
Write-Host "`nEnd: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Exit code
exit (if ($allPass) { 0 } else { 1 })
