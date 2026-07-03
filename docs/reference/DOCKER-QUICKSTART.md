# CIC Docker — Quick Reference

## One-Minute Start

```bash
# 1. Set your API key
export CLAUDE_API_KEY="sk-ant-..."

# 2. Build and start
docker-compose up --build

# Done! Logs stream automatically. Ctrl+C to exit.
```

## Common Commands

```bash
# View logs
docker-compose logs -f cic-dev

# Run smoke tests
docker-compose exec cic-dev bash scripts/cic-smoke-test.sh

# Dry-run (safe validation, no side effects)
docker-compose exec cic-dev bash scripts/cic-dry-run.sh

# SSH into container
ssh -p 2222 chris@localhost

# Recovery (fix stale locks/ports)
docker-compose exec cic-dev bash scripts/cic-docker-recovery.sh

# Check MCP health
curl http://localhost:3100/health

# View log archival status
docker-compose exec cic-dev du -sh logs/archive/

# Stop container
docker-compose down

# Stop & remove everything (clean slate)
docker-compose down -v
```

## Environment Setup

```bash
# Copy example config
cp .env.example .env

# Edit and add your API key
nano .env

# Source it (or docker-compose will load automatically)
source .env
```

⚠️ **Security Note**: Default `CLAUDE_SKIP_PERMISSIONS=true` is dev-only. For production, set to `false` to restore permission prompts.

## Issues

| Issue | Fix |
|-------|-----|
| Port 3100 in use | `docker-compose exec cic-dev bash scripts/cic-docker-recovery.sh` |
| Smoke tests fail | Check logs: `docker-compose logs cic-dev \| grep FAIL` |
| API key invalid | Verify at console.anthropic.com, update .env, restart |
| SSH connection refused | `docker-compose exec cic-dev sudo service ssh restart` |

## What's Running

- **Port 3100** — MCP primary server
- **Port 2222** — SSH (for mobile access)
- **Port 3101-3110** — MCP secondary servers (git, filesystem, etc.)
- **logs/** — Daily rotating logs + 30/90-day archive policy
- **Process** — Claude Code daemon (non-root user: chris)

## Files

| File | Purpose |
|------|---------|
| Dockerfile | Multi-stage build (compile → minimal runtime) |
| docker-compose.yml | Orchestration + env vars + volumes + ports |
| scripts/cic-docker-entrypoint.sh | Main startup (10 fixes: process detection, API retry, log rotation, dry-run) |
| scripts/cic-smoke-test.sh | 10 critical path tests |
| scripts/cic-docker-recovery.sh | Stale lock/PID cleanup + crash recovery |
| scripts/cic-log-archival.sh | Archive >30d, purge >90d |
| scripts/cic-dry-run.sh | Test startup without side effects |
| .env.example | Config template |
| DOCKER.md | Full documentation |

## Why This Setup

✅ **Deterministic** — Same build, same startup, every time  
✅ **Secure** — Non-root user, key-only SSH, no secrets in image  
✅ **Testable** — Smoke tests + dry-run mode before production  
✅ **Portable** — Hand off to any team/system with Docker  
✅ **Observable** — Daily logs, automated archival, healthcheck  

## Production Readiness

This setup is ready for handoff to other teams/systems:
- All scripts use relative paths (portable)
- Self-contained (no host dependencies beyond Docker)
- Reproducible (multi-stage build)
- Testable (smoke test suite)
- Documented (this file + DOCKER.md)

Example handoff:
```bash
git clone <repo>
cd cic
cp .env.example .env
# Edit .env with your CLAUDE_API_KEY
docker-compose up --build
```

---

For full details, see [DOCKER.md](DOCKER.md)
