Write-Host "=== CastIronForge Health Check ===" -ForegroundColor Cyan

$services = @(
    @{ Name="chat-frontend"; Url="http://localhost:5173" },
    @{ Name="chat-agent"; Url="http://localhost:8000/health" },
    @{ Name="torque-query"; Url="http://localhost:9000/health" },
    @{ Name="cic-ingestion"; Url="http://localhost:3000/health" }
)

$healthy = 0
$failed = 0

foreach ($svc in $services) {
    try {
        $res = Invoke-WebRequest -Uri $svc.Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ $($svc.Name): OK" -ForegroundColor Green
        $healthy++
    }
    catch {
        Write-Host "✗ $($svc.Name): FAIL ($($svc.Url))" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Summary: $healthy healthy, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
