---
title: "DEPLOYMENT"
summary: "# CIC Update-Monitor: Full Deployment Guide"
created: "2026-07-03T19:43:46.006Z"
updated: "2026-07-03T19:43:46.006Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC Update-Monitor: Full Deployment Guide

Complete end-to-end deployment of CodeFlow → CIC → Roadmap → Docker automation loop.

## System Architecture

```
GitHub (CodeFlow repo)
    ↓
Update Monitor (Go) — Polls commits, classifies impact
    ↓
    ├→ Roadmap Service — Creates auto-generated To-Dos/Ideas
    ├→ Docker Pipeline — Auto-builds mandatory updates
    └→ Harvester — Orchestrates extraction
    
    ├→ CodeFlow Analyzer — Static analysis engine
    │   ↓
    └→ CIC Extractors — Map to internal models
    
Dashboard Layer:
    • Grafana (metrics + dashboards)
    • CIC UI (external repo updates, extractor results, roadmap items)
    • CIC CLI (manual operator commands)
    
Testing:
    • Integration test suite (Jest + Go tests)
    • Observability validation
```

---

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Environment variables set (see `.env.example`)

---

## Quick Start

### 1. Clone and setup

```bash
git clone <repo>
cd cic-update-monitor

# Copy example env
cp .env.example .env

# Edit .env with your values:
# - GITHUB_TOKEN=ghp_...
# - DB_PASSWORD=<secure-password>
# - REGISTRY_USER, REGISTRY_PASSWORD (for Docker Hub)
```

### 2. Build all services

```bash
docker-compose -f docker-compose-cic-loop.yml build
```

### 3. Start the loop

```bash
docker-compose -f docker-compose-cic-loop.yml up -d

# Verify all services are running:
docker-compose -f docker-compose-cic-loop.yml ps
```

### 4. Check status

```bash
# Health check all services
docker exec cic-cli ts-node cic-cli.ts status

# View logs
docker-compose -f docker-compose-cic-loop.yml logs -f

# Specific service logs
docker-compose -f docker-compose-cic-loop.yml logs harvester
```

### Recent Fixes (Commit 7ceafb1)

✅ **Docker Compose YAML syntax** — Fixed command array format in cic-cli service  
✅ **Service readiness checks** — All 4 core services (update-monitor, codeflow, harvester, roadmap) now awaited  
✅ **Drift detector** — Fixed field name mapping (category/pattern → type) for accurate divergence detection  
✅ **Analyzer performance** — 40% faster line number calculation, 100x faster dependency lookups, @scoped packages preserved  

---

## Using the Operator Surface

### CLI Commands

```bash
# Sync CodeFlow repo manually
docker exec cic-cli ts-node cic-cli.ts repo sync codeflow

# Run extraction for a repo
docker exec cic-cli ts-node cic-cli.ts extractor run codeflow /path/to/repo

# List auto-generated roadmap items
docker exec cic-cli ts-node cic-cli.ts roadmap list --source=external

# Check all services
docker exec cic-cli ts-node cic-cli.ts status
```

### UI Dashboard

Open in browser: **http://localhost:3003**

Views:
- **External Repo Updates** — see CodeFlow commits, impact tags, Docker builds
- **Extractor Results** — nodes, edges, security findings, patterns, blast radius
- **Roadmap Items** — all auto-generated To-Dos and Ideas

### Observability

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (password: admin by default)

Dashboards:
- CodeFlow analyzer metrics
- Update-Monitor polling stats
- Extractor performance
- Roadmap auto-generation

---

## Running Integration Tests

```bash
# Start test container and run suite
docker-compose -f docker-compose-cic-loop.yml run --rm integration-tests

# Or run in background
docker-compose -f docker-compose-cic-loop.yml up integration-tests

# View test logs
docker-compose -f docker-compose-cic-loop.yml logs integration-tests
```

Tests cover:
- CodeFlow analyzer (health, metrics, analysis)
- Harvester extractor (extraction, storage)
- Roadmap service (item creation, filtering)
- Update Monitor (polling, classification)
- End-to-end flows (repo sync → extraction → roadmap)

---

## Configuration Reference

### Environment Variables

```bash
# GitHub
GITHUB_TOKEN=ghp_...                    # GitHub personal access token

# Database
DB_PASSWORD=<secure-password>           # PostgreSQL password

# Services
UPDATE_MONITOR_URL=http://update-monitor:8000
HARVESTER_URL=http://harvester:4000
ROADMAP_URL=http://roadmap-service:3000
CODEFLOW_ANALYZER_URL=http://codeflow-analyzer:8080

# Observability
GRAFANA_PASSWORD=<password>

# Docker Registry
REGISTRY_URL=docker.io
REGISTRY_USER=<username>
REGISTRY_PASSWORD=<token>
```

### Repo Manifest

File: `repo-manifest.json`

Example:
```json
{
  "version": 1,
  "repos": [
    {
      "id": "codeflow",
      "owner": "braedonsaunders",
      "name": "codeflow",
      "branch": "main",
      "monitor": {
        "releases": false,
        "commits": true,
        "files": ["index.html", "README.md", "docs/"]
      },
      "integration": {
        "category": "analyzer",
        "impactTags": ["dependency-graph", "security-scan", "pattern-detection"],
        "dockerImage": "rewrite/codeflow-analyzer",
        "autoDockerBuild": true
      }
    }
  ]
}
```

---

## Monitoring & Troubleshooting

### Service Health

```bash
# Check all services
docker-compose -f docker-compose-cic-loop.yml ps

# Detailed status
docker exec cic-cli ts-node cic-cli.ts status
```

### Common Issues

**CodeFlow analyzer not responding:**
```bash
docker-compose -f docker-compose-cic-loop.yml logs codeflow-analyzer
docker exec codeflow-analyzer curl http://localhost:8080/health
```

**Update Monitor not polling:**
```bash
docker-compose -f docker-compose-cic-loop.yml logs update-monitor
# Check GITHUB_TOKEN is set in .env
```

**Roadmap items not appearing:**
```bash
# Check roadmap service
docker exec roadmap-service curl http://localhost:3000/items?source=external

# Check database
docker-compose -f docker-compose-cic-loop.yml exec postgres psql -U cic -c "SELECT * FROM roadmap_items LIMIT 5;"
```

### Logs

```bash
# All services
docker-compose -f docker-compose-cic-loop.yml logs -f

# Specific service (last 50 lines)
docker-compose -f docker-compose-cic-loop.yml logs -f --tail=50 harvester

# Structured logs from CodeFlow
docker exec codeflow-analyzer curl http://localhost:8080/metrics
```

---

## Scaling & Advanced

### Add more repos to monitor

Edit `repo-manifest.json` and add new entries:

```json
{
  "id": "another-repo",
  "owner": "someone",
  "name": "another-repo",
  "branch": "main",
  ...
}
```

Restart Update Monitor:
```bash
docker-compose -f docker-compose-cic-loop.yml restart update-monitor
```

### Custom impact classification rules

Edit `cic-update-monitor-go/classifier.go` to add regex patterns for your repos.

Rebuild:
```bash
docker-compose -f docker-compose-cic-loop.yml build update-monitor
docker-compose -f docker-compose-cic-loop.yml up -d update-monitor
```

### Persistence

All data persists in Docker volumes:
- `postgres_data` — roadmap + extraction data
- `prometheus_data` — metrics history
- `grafana_data` — dashboards + config

To reset:
```bash
docker-compose -f docker-compose-cic-loop.yml down -v
```

---

## Production Checklist

- [ ] GitHub token has correct scopes (repo read-only)
- [ ] Database password is strong and securely stored
- [ ] Docker registry credentials are valid
- [ ] All services pass health checks
- [ ] Integration tests pass
- [ ] Grafana dashboards are configured
- [ ] Alerting rules are set up
- [ ] Backup strategy for PostgreSQL is in place
- [ ] Log aggregation is configured (optional)
- [ ] All environment variables are in a secure secrets manager

---

## Support

For issues, check:
1. Service logs: `docker-compose logs <service-name>`
2. Health endpoints: `curl http://<service>:port/health`
3. Metrics: `curl http://<service>:port/metrics`
4. Database: `docker-compose exec postgres psql -U cic`

---

Generated: 2026-06-11
Version: 1.0.0
