Write-Host "Starting CastIronForge services..." -ForegroundColor Cyan

Write-Host "1. Starting chat-frontend (port 5173)..."
Start-Process powershell -ArgumentList "cd '$PSScriptRoot' ; pnpm --filter chat-frontend dev -- --port 5173"

Write-Host "2. Starting chat-agent (port 8000)..."
Start-Process powershell -ArgumentList "cd '$PSScriptRoot' ; `$env:PORT=8000; pnpm --filter chat-agent dev"

Write-Host "3. Starting torque-query (port 9000)..."
Start-Process powershell -ArgumentList "cd '$PSScriptRoot' ; `$env:PORT=9000; pnpm --filter torque-query dev"

Write-Host "4. Starting cic-ingestion (port 3000)..."
Start-Process powershell -ArgumentList "cd '$PSScriptRoot' ; `$env:PORT=3000; pnpm --filter cic-ingestion dev"

Write-Host ""
Write-Host "All services launched in separate windows." -ForegroundColor Green
Write-Host ""
Write-Host "To verify health:"
Write-Host "  ./health-check.ps1"
Write-Host ""
Write-Host "To test FamilySearch pipeline:"
Write-Host "  1. Open http://localhost:5173"
Write-Host "  2. Select 'torque:familysearch'"
Write-Host "  3. Run: /pipeline person <PID>"
