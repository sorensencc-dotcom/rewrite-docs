# Dashboard Canary Monitor
# Verifies all 7 repos' dashboard workflows pass
# Schedule: daily 3:30 AM UTC (30min after 3 AM UTC workflow run)

param(
    [string]$SlackWebhook = $env:SLACK_WEBHOOK_URL
)

$repos = @(
    "sorensencc-dotcom/rewrite-mcp",
    "sorensencc-dotcom/cic",
    "sorensencc-dotcom/cic-ingestion",
    "sorensencc-dotcom/CIC_MEDIA_LIBRARY",
    "sorensencc-dotcom/fds.fx.reporting",
    "sorensencc-dotcom/CIC-DAG",
    "sorensencc-dotcom/rewritelabs.io"
)

$results = @()
$failed = @()

Write-Host "🕵️  Dashboard Canary Check - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

foreach ($repo in $repos) {
    $repoName = $repo.Split("/")[1]

    # Get latest dashboard workflow run
    $run = gh run list --repo $repo --workflow dashboard.yml --limit 1 --json conclusion,createdAt,url | ConvertFrom-Json | Select-Object -First 1

    if ($run) {
        $status = $run.conclusion
        $age = (New-TimeSpan -Start $run.createdAt -End (Get-Date)).TotalMinutes
        $ageStr = if ($age -lt 1) { "now" } else { "$([int]$age)m ago" }

        if ($status -eq "success") {
            Write-Host "✅ $repoName : $status ($ageStr)" -ForegroundColor Green
            $results += @{repo=$repoName; status="✅"}
        } else {
            Write-Host "❌ $repoName : $status ($ageStr)" -ForegroundColor Red
            $results += @{repo=$repoName; status="❌"}
            $failed += $repoName
        }
    } else {
        Write-Host "⚠️  $repoName : no recent run" -ForegroundColor Yellow
        $failed += $repoName
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$passCount = ($results | Where-Object {$_.status -eq "✅"}).Count
$totalCount = $results.Count

if ($failed.Count -eq 0) {
    Write-Host "✅ All $totalCount repos healthy" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $($failed.Count)/$totalCount repos FAILED: $($failed -join ', ')" -ForegroundColor Red

    # Send Slack alert if webhook configured
    if ($SlackWebhook) {
        $payload = @{
            text = "🚨 Dashboard Canary Alert"
            attachments = @(
                @{
                    color = "danger"
                    title = "Failed Repos: $($failed -join ', ')"
                    text = "$passCount/$totalCount repos passing"
                    mrkdwn_in = @("text")
                }
            )
        } | ConvertTo-Json

        Invoke-RestMethod -Uri $SlackWebhook -Method Post -Body $payload -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
    }

    exit 1
}
