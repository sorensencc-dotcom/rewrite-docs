# Register vault sync scheduled task
# Run as Administrator
# Usage: .\register-vault-sync-task.ps1 [-Schedule "09:00"] [-System "all"]

param(
    [string]$Schedule = "09:00",
    [ValidateSet('all', 'cic', 'rl')]
    [string]$System = 'all',
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Task configuration
$TaskName = "CIC-Vault-Sync-$System"
$TaskPath = "\CIC\"
$ScriptPath = Join-Path (Split-Path $PSScriptRoot -Parent) "sync-vault.ps1"
$WorkingDirectory = Split-Path $PSScriptRoot -Parent

Write-Host "📋 Vault Sync Task Registration" -ForegroundColor Cyan
Write-Host "  Task: $TaskName"
Write-Host "  Schedule: Daily at $Schedule"
Write-Host "  System: $System"
Write-Host "  Script: $ScriptPath"
Write-Host ""

if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ Script not found: $ScriptPath" -ForegroundColor Red
    exit 1
}

# Check if task exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -ErrorAction SilentlyContinue

if ($existingTask -and -not $Force) {
    Write-Host "⚠️  Task already exists. Use -Force to replace." -ForegroundColor Yellow
    exit 0
}

if ($existingTask) {
    Write-Host "🔄 Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -Confirm:$false
}

# Create action: Run PowerShell script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -System $System -Verbose" `
    -WorkingDirectory $WorkingDirectory

# Create trigger: Daily at specified time
$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At $Schedule

# Create principal: Run as current user (interactive)
$principal = New-ScheduledTaskPrincipal `
    -UserID "$env:COMPUTERNAME\$env:USERNAME" `
    -LogonType Interactive

# Create settings: Allow task to run in background, don't timeout
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

# Register task
Write-Host "✅ Registering task..." -ForegroundColor Green
Register-ScheduledTask `
    -TaskName $TaskName `
    -TaskPath $TaskPath `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Synchronize $System vault from configured sources" `
    -Force | Out-Null

Write-Host "✅ Task registered: $TaskName" -ForegroundColor Green
Write-Host ""

# Verify
$task = Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath
Write-Host "📌 Task Details:" -ForegroundColor Cyan
Write-Host "  Name: $($task.TaskName)"
Write-Host "  Path: $($task.TaskPath)"
Write-Host "  State: $($task.State)"
Write-Host "  Next Run: $($task | Get-ScheduledTaskInfo | Select-Object -ExpandProperty NextRunTime)"
Write-Host ""

# Run test (optional)
Write-Host "🧪 Running test sync (dry-run)..." -ForegroundColor Cyan
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ScriptPath -System $System -DryRun -Verbose
