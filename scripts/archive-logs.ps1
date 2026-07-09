# Archive and rotate logs per logging policy
# Compresses logs >7 days old, deletes logs >retention

param(
    [int]$CompressAfterDays = 7,
    [switch]$DryRun = $false
)

$logDirs = @{
    "C:\dev\operations\logs\bootstrap" = 60
    "C:\dev\build\logs" = 60
    "C:\dev\cic\logs" = 30
    "C:\dev\cic-ingestion\logs\runtime" = 30
    "C:\dev\governance\logs\sync" = 30
    "C:\dev\tests\logs" = 14
    "C:\dev\docs\logs" = 30
}

foreach ($dir in $logDirs.Keys) {
    $retentionDays = $logDirs[$dir]
    Write-Host "Processing $dir (retention: $retentionDays days)"

    if (-not (Test-Path $dir)) {
        Write-Host "  ⊘ Directory does not exist"
        continue
    }

    # Compress logs >7 days
    $compressDate = (Get-Date).AddDays(-$CompressAfterDays)
    $logsToCompress = Get-ChildItem $dir -Filter "*.log" -File |
        Where-Object { $_.LastWriteTime -lt $compressDate }

    if ($logsToCompress) {
        Write-Host "  Compressing $($logsToCompress.Count) old logs..."
        foreach ($log in $logsToCompress) {
            $archiveDir = Join-Path $dir "archive"
            New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null

            if (-not $DryRun) {
                # Note: tar not available on all Windows, use 7-Zip or skip for now
                # For now, just move to archive subdir
                Move-Item -Path $log.FullName -Destination $archiveDir -Force
            }
            Write-Host "    → archived $($log.Name)"
        }
    }

    # Delete logs >retention
    $deleteDate = (Get-Date).AddDays(-$retentionDays)
    $logsToDelete = Get-ChildItem $dir -Filter "*.log" -File -Recurse |
        Where-Object { $_.LastWriteTime -lt $deleteDate }

    if ($logsToDelete) {
        Write-Host "  Deleting $($logsToDelete.Count) expired logs..."
        foreach ($log in $logsToDelete) {
            if (-not $DryRun) {
                Remove-Item -Path $log.FullName -Force
            }
            Write-Host "    ✕ deleted $($log.Name)"
        }
    }

    Write-Host ""
}

if ($DryRun) {
    Write-Host "DRY RUN — no changes made. Run without -DryRun to execute."
}
