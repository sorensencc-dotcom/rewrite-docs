# Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] REVIEW.md findings fixed (5 BLOCK items)
- [ ] Real test cases implemented (70%+ coverage)
- [ ] Config schema validation added
- [ ] Null-check guards added to error paths
- [ ] `npm test` passes (all tests non-placeholder)

### Configuration
- [ ] `config.json` created from `config.example.json`
- [ ] Mailpit API URL verified reachable
- [ ] Google Drive folder IDs obtained
- [ ] Google OAuth2 credentials (clientId, clientSecret, refreshToken) stored
- [ ] Staging root directory path set (C:\research-intake)
- [ ] All required config fields populated

### Infrastructure
- [ ] Mailpit running locally (port 8025 API, 1025 SMTP)
- [ ] Google Drive authenticated and accessible
- [ ] Staging directories created (pending/, archive/, rejected/, cold/, logs/)
- [ ] Log directory writable by daemon process
- [ ] Drive folder IDs validated (verify access)

### Build
- [ ] TypeScript compiles: `npm run build`
- [ ] No TS errors in strict mode
- [ ] Dist/ directory created with JS + source maps
- [ ] All imports resolve correctly

---

## Installation Steps

### 1. Clone & Install

```bash
cd C:\dev\scripts\mailbox-intake-daemon
npm install
```

### 2. Configure

```bash
# Copy example config
copy config.example.json config.json

# Edit config.json with your values
notepad config.json
```

Required fields:
- `mailpit.baseUrl` — http://localhost:8025
- `validation.stagingRoot` — C:\research-intake
- `routing.tier1.destination` — Drive folder ID
- `routing.tier2.destination` — Drive folder ID
- `drive.clientId`, `drive.clientSecret`, `drive.refreshToken`

### 3. Build

```bash
npm run build
```

### 4. Test Locally

```bash
# Run test suite
npm test

# Or start daemon
npm start
```

---

## Production Deployment

### Option 1: Windows Task Scheduler (Recommended)

#### Create Task

```powershell
# Define action
$taskAction = New-ScheduledTaskAction `
  -Execute "C:\Program Files\nodejs\node.exe" `
  -Argument "C:\dev\scripts\mailbox-intake-daemon\dist\index.js" `
  -WorkingDirectory "C:\dev\scripts\mailbox-intake-daemon"

# Define trigger (at startup)
$taskTrigger = New-ScheduledTaskTrigger -AtStartup

# Register task
Register-ScheduledTask `
  -TaskName "Mailbox Intake Daemon" `
  -Action $taskAction `
  -Trigger $taskTrigger `
  -RunLevel Highest `
  -Description "Polls Mailpit, validates, classifies, uploads attachments"
```

#### Verify Task

```powershell
Get-ScheduledTask -TaskName "Mailbox Intake Daemon"
Start-ScheduledTask -TaskName "Mailbox Intake Daemon"
```

#### Check Logs

```bash
# Daemon logs
tail -f C:\dev\scripts\mailbox-intake-daemon\logs\daemon.log

# Batch logs
cat C:\research-intake\pending\{batchId}\intake.log
```

### Option 2: Windows Service

Install as service using NSSM:

```bash
nssm install "MailboxIntakeDaemon" "C:\Program Files\nodejs\node.exe" `
  "C:\dev\scripts\mailbox-intake-daemon\dist\index.js"

nssm set "MailboxIntakeDaemon" AppDirectory "C:\dev\scripts\mailbox-intake-daemon"
nssm set "MailboxIntakeDaemon" AppStdout "C:\dev\scripts\mailbox-intake-daemon\logs\daemon.log"
nssm set "MailboxIntakeDaemon" AppStderr "C:\dev\scripts\mailbox-intake-daemon\logs\daemon.err"

# Start service
net start "MailboxIntakeDaemon"
```

### Option 3: Manual (Development Only)

```bash
cd C:\dev\scripts\mailbox-intake-daemon
npm start
```

---

## Verification

### Health Check Endpoints

```bash
# Mailpit API
curl http://localhost:8025/api/v1/info

# Check staging root
dir C:\research-intake

# Verify daemon running
tasklist | find "node.exe"
```

### First Run

1. Send test email to Mailpit
2. Wait 5 seconds (poll interval)
3. Check pending/: batch directory created
4. Check batch manifest: `C:\research-intake\pending\batch-{id}\manifest.json`
5. Check intake log: `C:\research-intake\pending\batch-{id}\intake.log`
6. Wait for file watcher to trigger ingest (500ms debounce)
7. Check archive/: batch moved after successful upload

### Troubleshooting

#### Daemon won't start

```bash
# Check logs
type C:\dev\scripts\mailbox-intake-daemon\logs\daemon.log

# Verify config
npm run build && npm start

# Check Mailpit
curl http://localhost:8025/api/v1/info
```

#### Batches stuck in pending/

```bash
# Check manifest
cat C:\research-intake\pending\batch-123\manifest.json

# Check intake log
cat C:\research-intake\pending\batch-123\intake.log

# Manually trigger ingest
# (via MCP tool: mailbox-intake-trigger-ingest)
```

#### Drive upload failures

```bash
# Verify credentials
cat config.json | findstr /i "clientid"

# Check folder IDs exist
# (manually via Drive UI)

# Check quota
# (Drive API quota endpoint)
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Batch counts
ls C:\research-intake\pending\    # Should be ~0
ls C:\research-intake\archive\    # Growing

# Log size
dir C:\dev\scripts\mailbox-intake-daemon\logs\

# Error rate
grep ERROR C:\dev\scripts\mailbox-intake-daemon\logs\daemon.log | wc -l
```

### Weekly Tasks

```bash
# Archive rotation (90-day default)
# Automatically moves old batches from archive/ to cold/

# Credential refresh
# Google refresh token may expire — verify still valid

# Quota check
# Monitor Drive quota usage
```

### Performance Tuning

| Parameter | Default | Range | Impact |
|-----------|---------|-------|--------|
| pollIntervalMs | 5000 | 1000-30000 | Higher = less responsive, lower CPU |
| maxMessagesPerPoll | 50 | 10-200 | Higher = more throughput, higher memory |
| debounceMs | 500 | 100-2000 | Higher = less CPU, higher latency |
| maxConcurrentUploads | 3 | 1-10 | Higher = faster uploads, more bandwidth |

---

## Backup & Recovery

### Backup Strategy

```bash
# Weekly backup of config
Copy-Item config.json "config.backup.$(Get-Date -Format yyyy-MM-dd).json"

# Monthly backup of staging
Compress-Archive -Path C:\research-intake -DestinationPath "C:\backups\research-intake-$(Get-Date -Format yyyy-MM-dd).zip"
```

### Recovery Procedure

1. **Lost daemon process**: Restart via Task Scheduler or manual `npm start`
2. **Lost config**: Restore from backup or recreate from example
3. **Stuck batches**: Check intake.log for errors, retry via MCP tool
4. **Drive sync issues**: Re-upload batch via `mailbox-intake-trigger-ingest`
5. **Disk full**: Archive old batches to external storage

---

## Scaling Considerations

### Single-Machine Limits

- **Polling rate**: ~10 msgs/sec (5000ms interval × 50 msgs)
- **Extraction rate**: ~12 files/sec (3 concurrent downloads)
- **Upload rate**: depends on file size + Drive API quota

### To Increase Throughput

1. Reduce `pollIntervalMs` (2000 instead of 5000)
2. Increase `maxMessagesPerPoll` (100 instead of 50)
3. Increase `maxConcurrentUploads` (5-10 instead of 3)
4. Monitor CPU/memory/network impact

### Multi-Machine Deployment

Future versions could support distributed processing:
- Separate polling nodes (Mailpit clients)
- Separate processing nodes (BatchProcessor)
- Shared staging (network drive or S3)
- Shared state (Redis or database)

---

## Security Hardening

### Before Production

- [ ] Move credentials to environment variables (not JSON)
- [ ] Enable log sanitization (remove tokens/secrets)
- [ ] Restrict file permissions on logs/ and staging/
- [ ] Enable HTTPS for Drive API (already default)
- [ ] Audit Google service account permissions (principle of least privilege)

### Firewall Rules

```bash
# Outbound: Allow to Google Drive
# Inbound: Reject all (daemon is client-only)

# Mailpit (local only)
netsh advfirewall firewall add rule `
  name="Mailpit API" `
  dir=in action=allow protocol=tcp `
  localport=8025 `
  remoteip=127.0.0.1
```

### Audit Logging

- Enable Windows Event Log → Application
- Drain daemon.log to central syslog/SIEM
- Alert on ERROR level events
- Alert on validation failures (rejected/)

---

## Rollback Procedure

```bash
# Stop daemon
Stop-ScheduledTask -TaskName "Mailbox Intake Daemon"

# Downgrade to previous version
git checkout <previous-commit>
npm install
npm run build

# Restart
Start-ScheduledTask -TaskName "Mailbox Intake Daemon"
```

---

## Support & Troubleshooting

See `README.md` § Troubleshooting for common issues.

For detailed API reference, see `docs/API.md`.

For implementation details, see `MAILBOX_INTAKE_DAEMON_SPEC_EXPANDED.md`.
