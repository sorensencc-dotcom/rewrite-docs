---
name: operations-autonomous-image-builds
description: Autonomous image build scheduling and automation
metadata:
  type: operations
---

# Autonomous Image Build Scheduling

Operator-image-build skill configured for autonomous daily builds with retry logic, Slack notifications, and registry verification.

## Quick Start

### Windows Task Scheduler (Recommended)

Run as Administrator:

```powershell
# PowerShell (Admin)
cd C:\dev
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\schedule-image-builds.ps1 `
  -Registry "registry.internal:5000" `
  -SlackWebhook $env:SLACK_WEBHOOK
```

Verification:
```powershell
Get-ScheduledTask -TaskName "CIC-ImageBuild-Daily"
Get-ChildItem C:\dev\tasks -Filter "operator-image-build-*.log" | Sort-Object LastWriteTime -Descending
```

### GitHub Actions

Add to `.github/workflows/image-build.yml`:

```yaml
name: Daily Image Build

on:
  schedule:
    - cron: '0 2 * * *'  # 02:00 UTC daily
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build images
        env:
          REGISTRY: ${{ secrets.DOCKER_REGISTRY }}
        run: |
          cd toolforge/skills/operator-image-build
          npm install
          npm run build
          node dist/index.js --action all --registry $REGISTRY --verbose

      - name: Slack notification
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Image build: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: operator-image-build
  namespace: cic-ops
spec:
  schedule: "0 2 * * *"  # 02:00 UTC daily
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: build
            image: cic-toolchain:latest
            env:
            - name: REGISTRY
              valueFrom:
                configMapKeyRef:
                  name: cic-config
                  key: docker.registry
            command:
            - /bin/sh
            - -c
            - |
              cd /repo/toolforge/skills/operator-image-build
              npm install && npm run build
              node dist/index.js --action all --registry $REGISTRY --verbose
            volumeMounts:
            - name: repo
              mountPath: /repo
            - name: docker
              mountPath: /var/run/docker.sock
          restartPolicy: OnFailure
          volumes:
          - name: repo
            hostPath:
              path: /home/cic/repo
          - name: docker
            hostPath:
              path: /var/run/docker.sock
```

## Configuration

### Registry

Default: `registry.internal:5000`

Override:
```powershell
.\schedule-image-builds.ps1 -Registry "myregistry.azurecr.io"
```

### Schedule

Daily at 02:00 UTC (off-peak, allows 24h for verification before daytime load).

Change:
```powershell
.\schedule-image-builds.ps1 -Schedule "Daily"  # or custom cron
```

### Slack Notifications

Requires webhook URL:

```powershell
$env:SLACK_WEBHOOK = "https://hooks.slack.com/services/..."
.\schedule-image-builds.ps1
```

Sends on success/failure with:
- Build timestamp
- Registry URL
- Attempt count
- Log file path

## Retry Logic

- **Max attempts:** 3
- **Backoff:** 5 minutes between retries
- **Conditions:** Network failures, transient registry issues, image pull timeouts

## Logs

Location: `C:\dev\tasks\operator-image-build-{YYYYMMDD-HHmmss}.log`

View latest:
```powershell
Get-ChildItem C:\dev\tasks -Filter "operator-image-build-*.log" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 1 | 
  Get-Content -Tail 50
```

## Monitoring

### Task Status

```powershell
Get-ScheduledTaskInfo -TaskName "CIC-ImageBuild-Daily"
```

Output:
```
LastRunTime        : 2026-07-05 02:00:15
LastTaskResult     : 0 (success) or 1 (failure)
NextRunTime        : 2026-07-06 02:00:00
Status             : Ready
```

### Registry Verification

Skill includes verify action (final step):

```bash
node dist/index.js --action verify --registry registry.internal:5000
```

Checks:
- Images available in registry
- Layer hashes match SOURCE_DATE_EPOCH (reproducible build guarantee)
- Pull credentials valid

## Troubleshooting

### "Access Denied" on Task Registration

Run PowerShell as Administrator:
```powershell
Start-Process pwsh -Verb RunAs
cd C:\dev
.\scripts\schedule-image-builds.ps1 -Registry "registry.internal:5000"
```

### Build Fails on Schedule but Works Manually

Check:
1. Task Scheduler user has docker access: `docker run --rm hello-world` in task context
2. Network access: Ensure registry is reachable from scheduled context
3. Credentials: Registry auth mounted/available in Task Scheduler environment

### Slack Webhook Invalid

Verify URL:
```powershell
$webhook = "https://hooks.slack.com/services/..."
Invoke-RestMethod -Uri $webhook -Method Post -Body (@{ text = "Test" } | ConvertTo-Json) -ContentType "application/json"
```

## Disabling

```powershell
Unregister-ScheduledTask -TaskName "CIC-ImageBuild-Daily" -Confirm:$false
```

## Architecture

```
Task Scheduler (02:00 UTC daily)
  ↓
operator-image-build-task.ps1 (retry wrapper)
  ↓
npm run build (compile skill)
  ↓
node dist/index.js --action all
  ├─ Build (harness-v3, onnx-sidecar)
  ├─ Tag (deterministic SOURCE_DATE_EPOCH)
  ├─ Push (registry.internal:5000)
  └─ Verify (image availability + hash check)
  ↓
Slack notification (success/failure)
  ↓
Log file (C:\dev\tasks/operator-image-build-{timestamp}.log)
```

## Performance

Typical execution times (per image):
- Build: 60-90s (Docker layer caching)
- Tag: 2-5s
- Push: 30-60s (network-dependent)
- Verify: 5-10s

**Total window:** 2-3 minutes per full build cycle

If schedule conflicts with peak hours, adjust to off-peak (22:00-04:00 UTC typical).

## Next Steps

1. **Set environment variable:** `$env:SLACK_WEBHOOK = "..."`
2. **Run setup script:** `pwsh -NoProfile -File scripts\schedule-image-builds.ps1`
3. **Verify task:** `Get-ScheduledTask -TaskName "CIC-ImageBuild-Daily"`
4. **Monitor first run:** Check `C:\dev\tasks\` for log after 02:00 UTC
5. **Alert on failure:** Slack webhook will notify on build errors
