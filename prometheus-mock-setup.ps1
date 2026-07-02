param(
    [string]$Port = "9090"
)

# Prometheus Mock Setup (Local Dev Simulation)
# Runs HTTP mock server that responds with simulated Phase A metrics
# Simulates realistic metric progression over 60 minutes

$metricsDb = @{
    "adoption" = @(5, 15, 25, 35, 42, 48, 52, 55, 57, 58, 59, 60, 61, 62, 62, 63, 63, 64, 64, 65)
    "latency_p99" = @(180, 175, 170, 160, 155, 150, 148, 146, 145, 144, 143, 142, 141, 140, 140, 139, 139, 138, 138, 137)
    "drift" = @(0.15, 0.13, 0.11, 0.095, 0.085, 0.078, 0.075, 0.072, 0.070, 0.068, 0.067, 0.066, 0.065, 0.064, 0.064, 0.063, 0.063, 0.062, 0.062, 0.061)
    "error_rate" = @(0.15, 0.12, 0.10, 0.08, 0.06, 0.05, 0.04, 0.04, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02)
}

$currentMinute = 0

# HTTP listener
$httpListener = New-Object System.Net.HttpListener
$httpListener.Prefixes.Add("http://localhost:$Port/")

try {
    $httpListener.Start()
    Write-Host "Prometheus mock running on http://localhost:$Port/" -ForegroundColor Green
    Write-Host "Listening for /api/v1/query requests..."
    Write-Host "Press Ctrl+C to stop`n"

    while ($httpListener.IsListening) {
        $context = $httpListener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Parse query
        $queryString = $request.Url.Query
        if ($queryString -match "query=(.+?)(&|$)") {
            $query = [System.Net.WebUtility]::UrlDecode($matches[1])

            # Determine metric type from query
            $metricType = ""
            if ($query -match "torquequery_search_fast_path_total") { $metricType = "adoption" }
            elseif ($query -match "torquequery_search_latency_ms_bucket") { $metricType = "latency_p99" }
            elseif ($query -match "torquequery_drift_score") { $metricType = "drift" }
            elseif ($query -match "torquequery_search_errors_total") { $metricType = "error_rate" }

            # Get value for current minute
            $value = 0.0
            if ($metricType -and $currentMinute -lt $metricsDb[$metricType].Count) {
                $value = $metricsDb[$metricType][$currentMinute]
            }

            # Prometheus API response format
            $responseBody = @{
                status = "success"
                data = @{
                    resultType = "vector"
                    result = @(
                        @{
                            metric = @{ __name__ = $metricType }
                            value = @(
                                [int](Get-Date).AddSeconds(-5).Ticks,
                                "$value"
                            )
                        }
                    )
                }
            } | ConvertTo-Json

            $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
            $response.ContentLength64 = $responseBytes.Length
            $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)
            $response.OutputStream.Close()

            Write-Host "[QUERY] $metricType → $value" -ForegroundColor Cyan
        }
    }
} finally {
    $httpListener.Close()
    Write-Host "Mock stopped."
}
