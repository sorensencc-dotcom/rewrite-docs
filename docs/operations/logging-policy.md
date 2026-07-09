# Logging Policy

## Overview

Structured logging across CIC ecosystem. Logs organized by project/service with retention and archival policies.

## Directory Structure

```
<project>/logs/
├── YYYY-MM-DD/           # Daily rotation
│   ├── service-name.log
│   ├── deployment.log
│   └── test-results.log
├── archive/              # Compressed logs >30 days
│   ├── 2026-06-*.tar.gz
│   └── 2026-05-*.tar.gz
└── README.md            # Local logging guide
```

## Log Categories & Owners

| Category | Project | Path | Retention | Compression |
|----------|---------|------|-----------|-------------|
| Deployment | all | `{project}/logs/deployment/` | 90 days | 30 days+ |
| Build | build-system, docker | `build/logs/` | 60 days | 30 days+ |
| Service Runtime | ingestion, cic-os | `{service}/logs/runtime/` | 30 days | 7 days+ |
| Test Results | tests | `tests/logs/` | 14 days | 7 days+ |
| Bootstrap/Init | root | `operations/logs/bootstrap/` | 60 days | 30 days+ |
| Sync/Cron | governance, vault-sync | `governance/logs/sync/` | 30 days | 7 days+ |

## Naming Convention

```
{service}-{type}-{YYYY-MM-DD}.log
cic-deployment-2026-07-08.log
ingestion-runtime-2026-07-08.log
test-unit-2026-07-08.log
```

## Rotation & Archival

**Daily Rotation:**
- New file per day (00:00 UTC)
- File naming: `{service}-{type}-{date}.log`
- Previous day's log moves to archive after compression

**Compression (7+ days old):**
```bash
# Archive script (weekly cron)
find {project}/logs -mtime +7 -name "*.log" \
  -exec tar -czf archive/{date}.tar.gz {} \;
```

**Purge Policy:**
- Test logs: delete after 14 days
- Service logs: delete after 30 days
- Build logs: delete after 60 days
- Bootstrap logs: delete after 60 days
- Deployment logs: keep 90 days

## File Size Limits

- **Per-file max**: 100MB (triggers rotation)
- **Per-directory max**: 1GB (triggers cleanup)
- **Total logs space**: <5GB

## Query & Analysis

### Search logs by date
```bash
ls -la ingestion/logs/2026-07-08/*.log
```

### Search logs by service
```bash
grep -r "error\|ERROR\|FATAL" governance/logs/sync/
```

### Tail live logs
```bash
tail -f ingestion/logs/runtime/ingestion-runtime-2026-07-08.log
```

## Integration with mkdocs

Each project's logging guide linked from:
- `docs/operations/logging-policy.md` (this file)
- Project-specific `docs/{project}/logging.md`
- Dashboard queries point to log directories

## Tools & Scripts

**Log rotation script**: `scripts/archive-logs.sh`
- Runs weekly via cron
- Compresses logs >7 days
- Deletes logs >retention

**Log analyzer**: `scripts/analyze-logs.ts`
- Aggregates errors/warnings
- Generates daily reports
- Posts to monitoring dashboard

## Examples by Project

### CIC Ingestion
- Path: `cic-ingestion/logs/`
- Types: `runtime`, `error`, `sync`
- Retention: 30 days

### Governance
- Path: `governance/logs/sync/`
- Types: `vault-sync`, `audit`, `reconciliation`
- Retention: 30 days

### Build System
- Path: `build/logs/`
- Types: `docker-build`, `test-run`, `deploy`
- Retention: 60 days

## Monitoring & Alerts

Log errors/warnings indexed in:
- Grafana dashboards (ingestion/logs)
- CloudWatch (if deployed)
- Local monitoring via log tails

Critical patterns trigger alerts:
- `FATAL`, `ERROR` (production services)
- Test failures in `tests/logs/`
- Deployment failures in deployment logs
