#!/usr/bin/env pwsh
<#
.SYNOPSIS
Register operator-image-build skill with Windows Task Scheduler for autonomous daily builds.

.DESCRIPTION
Creates a scheduled task that:
- Runs daily at 02:00 UTC (off-peak)
- Executes operator-image-build skill (build + tag + push + verify)
- Logs output to tasks/operator-image-build-{timestamp}.log
- Posts Slack notification on success/failure
- Retries failed builds (3 attempts, 5min backoff)

.PARAMETER Schedule
Cron expression or "Daily" (default: daily 02:00 UTC)

.PARAMETER Registry
Docker registry URL (default: registry.internal:5000)

.PARAMETER SlackWebhook
Slack webhook for notifications (env: SLACK_WEBHOOK)

.EXAMPLE
.\schedule-image-builds.ps1 -Schedule "Daily" -Registry "registry.internal:5000"
#>

param(
  [string]$Schedule = "Daily",
  [string]$Registry = "registry.internal:5000",
  [string]$SlackWebhook = $env:SLACK_WEBHOOK
)

$ErrorActionPreference = "Stop"
$TaskName = "CIC-ImageBuild-Daily"
$SkillPath = "C:\dev\toolforge\skills\operator-image-build"
$LogDir = "C:\dev\tasks"

# Ensure log dir
if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Force $LogDir | Out-Null
}

# Build script (runs in Task Scheduler context)
$TaskScript = @"
`$SkillPath = '$SkillPath'
`$Registry = '$Registry'
`$LogFile = '$LogDir\operator-image-build-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log'
`$Timestamp = Get-Date -Format 'o'

# Retry logic
`$MaxRetries = 3
`$RetryDelay = 300  # 5 minutes
`$Attempt = 0
`$Success = `$false

while (`$Attempt -lt `$MaxRetries -and -not `$Success) {
  `$Attempt++
  Write-Output "`$Timestamp [Attempt `$Attempt/`$MaxRetries] Starting image build..." | Tee-Object -FilePath `$LogFile -Append

  try {
    Push-Location `$SkillPath
    npm run build 2>&1 | Tee-Object -FilePath `$LogFile -Append
    `$BuildResult = & node dist/index.js --action all --registry `$Registry --verbose 2>&1 | Tee-Object -FilePath `$LogFile -Append
    Pop-Location

    `$Success = `$LASTEXITCODE -eq 0
    if (`$Success) {
      Write-Output "`$Timestamp [SUCCESS] Image build completed." | Tee-Object -FilePath `$LogFile -Append
    } else {
      Write-Output "`$Timestamp [FAILED] Attempt `$Attempt failed. Retrying in `$RetryDelay seconds..." | Tee-Object -FilePath `$LogFile -Append
      Start-Sleep -Seconds `$RetryDelay
    }
  } catch {
    Write-Output "`$Timestamp [ERROR] Exception: `$_" | Tee-Object -FilePath `$LogFile -Append
    if (`$Attempt -lt `$MaxRetries) {
      Write-Output "`$Timestamp Retrying in `$RetryDelay seconds..." | Tee-Object -FilePath `$LogFile -Append
      Start-Sleep -Seconds `$RetryDelay
    }
  }
}

# Slack notification
`$SlackWebhook = '$SlackWebhook'
if (`$SlackWebhook) {
  `$Color = if (`$Success) { "good" } else { "danger" }
  `$Status = if (`$Success) { "✅ SUCCESS" } else { "❌ FAILED" }
  `$Payload = @{
    text = "`$Status: Operator Image Build"
    attachments = @(
      @{
        color = `$Color
        fields = @(
          @{ title = "Timestamp"; value = `$Timestamp; short = `$true }
          @{ title = "Registry"; value = `$Registry; short = `$true }
          @{ title = "Attempts"; value = "`$Attempt/`$MaxRetries"; short = `$true }
          @{ title = "Log"; value = `$LogFile; short = `$false }
        )
      }
    )
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Uri `$SlackWebhook -Method Post -Body `$Payload -ContentType "application/json" | Out-Null
  } catch {
    Write-Output "`$Timestamp [WARN] Slack notification failed: `$_" | Tee-Object -FilePath `$LogFile -Append
  }
}

exit if (`$Success) { 0 } else { 1 }
"@

# Save task script
$ScriptFile = "$LogDir\operator-image-build-task.ps1"
$TaskScript | Set-Content -Path $ScriptFile -Encoding UTF8

# Register Task Scheduler job
$Action = New-ScheduledTaskAction `
  -Execute "pwsh" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptFile`""

$Trigger = switch ($Schedule) {
  "Daily" {
    New-ScheduledTaskTrigger -Daily -At "02:00:00"
  }
  default {
    New-ScheduledTaskTrigger -Daily -At "02:00:00"
  }
}

$Settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -RunOnlyIfNetworkAvailable `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# Register or update task
try {
  $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($ExistingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Output "Unregistered existing task: $TaskName"
  }

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Description "Autonomous daily Docker image build (harness-v3, onnx-sidecar)" | Out-Null

  Write-Output "✅ Registered Task Scheduler job: $TaskName"
  Write-Output "   Schedule: Daily at 02:00 UTC"
  Write-Output "   Registry: $Registry"
  Write-Output "   Script: $ScriptFile"
  Write-Output "   Logs: $LogDir"
  Write-Output ""
  Write-Output "View task: taskmgr.exe or Get-ScheduledTask -TaskName '$TaskName'"
  Write-Output "View logs: Get-ChildItem $LogDir -Filter 'operator-image-build-*.log' | Sort-Object LastWriteTime -Descending"

} catch {
  Write-Error "Failed to register task: $_"
  exit 1
}
