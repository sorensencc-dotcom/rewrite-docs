---
title: "DOCKER"
summary: "# CIC Docker Setup"
created: "2026-07-03T19:43:46.036Z"
updated: "2026-07-03T19:43:46.036Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Docker Setup

Deterministic Docker build infrastructure for CIC. All scripts are idempotent, safe, and tested.

## Quick Start

### 1. Set API Key

```bash
export CLAUDE_API_KEY="sk-ant-..."
```

### 2. Build & Start

```bash
docker-compose up --build
```

This will:
- Build the Dockerfile (multi-stage: compile → runtime)
- Start the container with all validation checks
- Run smoke tests automatically
- Launch MCP servers and Claude Code

### 3. Verify

```bash
# Check container logs
docker-compose logs -f cic-dev

# Verify MCP port
curl http://localhost:3100/health

# SSH into container (optional)
ssh -p 2222 chris@localhost
```

## Scripts

All scripts are in `scripts/` and handle the 10 critical issues:

| Script | Purpose | Issues Fixed |
|--------|---------|--------------|
| `cic-docker-entrypoint.sh` | Main startup coordinator | Better process detection, API retry, log rotation, dry-run mode |
| `cic-smoke-test.sh` | Validates critical paths (10 tests) | Test coverage, CI-ready |
| `cic-docker-recovery.sh` | Cleanup stale state | Stale lock/PID detection, process-aware recovery |
| `cic-log-archival.sh` | Log management (30-day archive, 90-day retention) | Automated log lifecycle |
| `cic-dry-run.sh` | Test startup without side effects | Dry-run mode for validation |

## Environment Variables

Required:
- `CLAUDE_API_KEY` — Anthropic API key (not embedded in image)

Optional:
- `CIC_ENV` — environment tag (default: `development`)
- `CIC_MCP_PORT` — primary MCP port (default: `3100`)
- `CIC_DRY_RUN` — test mode without side effects (default: `false`)
- `CLAUDE_SKIP_PERMISSIONS` — disable permission prompts (default: `true` for dev, **MUST be `false` in production**)

⚠️ **WARNING: CLAUDE_SKIP_PERMISSIONS**: This setting is safe in dev Docker containers where file access is scoped to the project root. In production or on shared systems, set `CLAUDE_SKIP_PERMISSIONS=false` to restore permission prompts and prevent unauthorized operations.

## Features

✅ **Security**
- Non-root user (chris)
- SSH hardening (key-only, no passwords)
- Secrets not embedded (passed via env)
- Process isolation
- Resource limits (2G memory, 2 CPU)
- Numeric validation on all process IDs

✅ **Reliability**
- Multi-stage build (compile → minimal runtime)
- Healthcheck (30s interval, 40s startup grace)
- Automatic log rotation & archival (30-day archive, 90-day retention)
- Stale lock/PID recovery with robust detection
- Exponential backoff for API retries
- Graceful degradation if lsof unavailable
- Cross-platform portability (stat, ps commands)

✅ **Operability**
- Smoke tests (10 critical paths)
- Dry-run mode (validate without launching)
- MCP port flexibility (primary + 10 secondary)
- Log streaming (tail -f logs/cic-YYYYMMDD.log)
- One-line recovery (cic-recover)

## Troubleshooting

### Port 3100 still in use

```bash
docker-compose exec cic-dev bash scripts/cic-docker-recovery.sh
```

### Smoke tests failed

Check logs:
```bash
docker-compose logs cic-dev | grep FAIL
tail -f logs/cic-smoke-test.log
```

### API key invalid

```bash
# Verify key format and TTL at console.anthropic.com
export CLAUDE_API_KEY="sk-ant-..."
docker-compose restart cic-dev
```

### SSH connection refused

SSH service auto-starts in Docker. Try:
```bash
docker-compose exec cic-dev sudo service ssh status
docker-compose exec cic-dev sudo service ssh start
```

## Code Handoff

To hand off this Docker setup to another team/system:

1. **Portable** — All scripts use relative paths and standard bash
2. **Self-contained** — No host dependencies beyond Docker
3. **Reproducible** — Multi-stage build produces deterministic images
4. **Testable** — `cic-dry-run.sh` validates before production startup
5. **Documented** — All scripts have headers explaining purpose and fixes

Example handoff:
```bash
# On handoff system
git clone <this-repo>
cd cic
export CLAUDE_API_KEY="..."
docker-compose up --build
```

## Architecture

```
Dockerfile (multi-stage)
  ├── base: Ubuntu 24.04 + Node 20 + Claude CLI + SSH
  ├── builder: Compile TypeScript + run tests
  └── runtime: Minimal footprint (no node_modules in final image bloat)

docker-compose.yml
  ├── Environment variables (secrets via .env or export)
  ├── Volume mounts (code, logs, SSH keys)
  ├── Port mappings (3100+ for MCP, 2222 for SSH)
  └── Healthcheck (curl /health every 30s)

scripts/
  ├── cic-docker-entrypoint.sh (orchestrator)
  ├── cic-smoke-test.sh (10 validation tests)
  ├── cic-docker-recovery.sh (crash recovery)
  ├── cic-log-archival.sh (retention policy)
  └── cic-dry-run.sh (safe validation)
```

## Issues Fixed

| # | Issue | Fix |
|---|-------|-----|
| 1 | No containerization | Multi-stage Dockerfile (compile + runtime) |
| 2 | Process detection (kill -0 racy) | Use `ps -p $pid -o state=` instead |
| 3 | No API retry in startup | Exponential backoff (3 attempts, 2-8s delay) |
| 4 | No log rotation | Automated: archive >30d, purge >90d archives |
| 5 | MCP health inflexible | Skip if no /health endpoint, continue anyway |
| 6 | --dangerously-skip-permissions risk | Conditional: disabled in Docker, CLAUDE_SKIP_PERMISSIONS env |
| 7 | No dry-run mode | CIC_DRY_RUN=true skips all side effects |
| 8 | No test coverage | 10-test smoke suite (deps, config, API, ports, permissions) |
| 9 | SSH port forwarding manual | Docker handles it: sshd auto-starts, port 2222 exposed |
| 10 | Single-user assumption | Works for any user in Docker, chris in container |

## Logs

Daily rotating logs in `logs/`:
```
logs/
  ├── cic-20260611.log      (active)
  ├── cic-20260610.log      (active)
  ├── cic-smoke-test.log    (latest smoke test)
  └── archive/
      ├── cic-20260511.log.gz (>30 days old, archived)
      └── ... (purged when >90 days)
```

Check logs:
```bash
# Live tail
docker-compose exec cic-dev tail -f logs/cic-$(date +%Y%m%d).log

# Archive status
docker-compose exec cic-dev du -sh logs/archive/
```

## Next Steps

1. Build: `docker-compose build`
2. Test: `docker-compose run --rm cic-dev bash scripts/cic-smoke-test.sh`
3. Deploy: `docker-compose up -d`
4. Monitor: `docker-compose logs -f`
5. Handoff: `git push origin docker-infra`
