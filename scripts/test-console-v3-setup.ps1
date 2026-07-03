# Test Phase 3.6 ConsoleV3 backend + frontend setup
# Usage: .\scripts\test-console-v3-setup.ps1

Write-Host "🚀 Phase 3.6 ConsoleV3 Test Setup" -ForegroundColor Cyan
Write-Host ""

# Start TorqueQuery
Write-Host "Starting TorqueQuery on port 8000..." -ForegroundColor Yellow
$torquePath = "c:\dev\castironforge\torque-query"
$torqueProc = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $torquePath -NoNewWindow -PassThru
Write-Host "✓ TorqueQuery PID: $($torqueProc.Id)" -ForegroundColor Green

# Wait for TorqueQuery to start
Write-Host "Waiting 5s for TorqueQuery startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test endpoints
Write-Host ""
Write-Host "Testing endpoints..." -ForegroundColor Yellow

$health = curl -s http://localhost:8000/console/health 2>$null
if ($health) {
    Write-Host "✓ /console/health responded:" -ForegroundColor Green
    Write-Host "  $health"
} else {
    Write-Host "✗ /console/health failed" -ForegroundColor Red
}

$pipelines = curl -s http://localhost:8000/console/pipelines 2>$null
if ($pipelines) {
    Write-Host "✓ /console/pipelines responded with $(($pipelines | ConvertFrom-Json).Length) pipelines" -ForegroundColor Green
} else {
    Write-Host "✗ /console/pipelines failed" -ForegroundColor Red
}

$alerts = curl -s http://localhost:8000/console/alerts 2>$null
if ($alerts) {
    Write-Host "✓ /console/alerts responded with $(($alerts | ConvertFrom-Json).Length) alerts" -ForegroundColor Green
} else {
    Write-Host "✗ /console/alerts failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Starting Storybook on port 6006..." -ForegroundColor Yellow
Write-Host "(This takes 15-30s to build)" -ForegroundColor Gray

cd c:\dev
npm run storybook

Write-Host ""
Write-Host "✓ Setup complete! Open: http://localhost:6006" -ForegroundColor Green
Write-Host "  Navigate to: ConsoleV3 > Main > Default" -ForegroundColor Gray
