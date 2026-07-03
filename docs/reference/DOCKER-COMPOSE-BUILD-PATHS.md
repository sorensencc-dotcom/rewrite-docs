---
title: "DOCKER COMPOSE BUILD PATHS"
summary: "# Docker-Compose Build Paths Reference"
created: "2026-07-03T19:43:46.026Z"
updated: "2026-07-03T19:43:46.026Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Docker-Compose Build Paths Reference

## Phase 5e v1 — 10 Core Services

### Infrastructure Services (Pre-built Images)

```yaml
# PostgreSQL
postgres:
  image: postgres:15-alpine
  ports: ["5433:5432"]

# Redis
redis:
  image: redis:7-alpine
  ports: ["6380:6379"]

# Qdrant
qdrant:
  image: qdrant/qdrant:latest
  ports: ["6333:6333"]
```

### Core Services (From ./services directory)

All located in `c:\dev\services/*` with Dockerfiles present.

```yaml
# Vault — Evidence store
vault:
  build:
    context: ./services/vault
    dockerfile: Dockerfile
  ports: ["3111:3111"]

# Unified API — API Gateway
unified-api:
  build:
    context: ./services/unified-api
    dockerfile: Dockerfile
  ports: ["3100:3100"]

# TorqueQuery — Memory engine
torquequery:
  build:
    context: ./services/torquequery
    dockerfile: Dockerfile
  ports: ["3110:3110"]

# CIC Governance — Council + voting
cic-governance:
  build:
    context: ./services/cic-governance
    dockerfile: Dockerfile
  ports: ["3113:3113"]

# Repomix Ingestion — Repo analysis
repomix-ingestion:
  build:
    context: ./services/repomix-ingestion
    dockerfile: Dockerfile
  ports: ["3112:3112"]

# Knowledge Graph — Lineage store
knowledge-graph:
  build:
    context: ./services/knowledge-graph
    dockerfile: Dockerfile
  ports: ["3107:3107"]
```

### CIC Ingestion (Autonomy API)

Located in `c:\dev\cic-ingestion` (separate monorepo).

```yaml
cic-ingestion:
  build:
    context: ./cic-ingestion
    dockerfile: Dockerfile
  ports: ["3116:3116"]
```

### Planning Console (React UI)

Located in `c:\dev\rewrite-mcp` (separate monorepo).

```yaml
planning-console:
  build:
    context: ./rewrite-mcp
    dockerfile: Dockerfile.planning-console
  ports: ["3000:3000"]
```

---

## Phase 6 — Deferred Services (12 Additional)

### Planning Engine & Harvester (with Fixed Paths)

```yaml
# ✓ CORRECTED: planning-engine dockerfile
planning-engine:
  build:
    context: ./cic
    dockerfile: Dockerfile.planning-engine
  ports: ["3114:3114"]

# ✓ CORRECTED: harvester-v2 dockerfile
harvester-v2:
  build:
    context: ./cic-ingestion
    dockerfile: Dockerfile.harvester-v2
  ports: ["3115:3115"]
```

### Build System (6 services)

All located in `c:\dev\build-system` with specialized Dockerfiles.

```yaml
lineage-registry:
  build:
    context: ./build-system
    dockerfile: docker/Dockerfile.lineage-registry
  ports: ["3102:3102"]

routing-validator:
  build:
    context: ./build-system
    dockerfile: docker/Dockerfile.routing-validator
  ports: ["3103:3103"]

build-executor:
  build:
    context: ./build-system
    dockerfile: docker/Dockerfile.build-executor
  ports: ["3101:3101"]

build-orchestrator:
  build:
    context: ./build-system
    dockerfile: docker/Dockerfile.orchestrator
  ports: ["3104:3104"]

performance-store:
  build:
    context: ./build-system
    dockerfile: docker/Dockerfile.performance-store
  ports: ["3105:3105"]

predictive-routing-engine:
  build:
    context: ./build-system
    dockerfile: docker/Dockerfile.predictive-routing-engine
  ports: ["3106:3106"]
```

### MCP Sidecars

```yaml
executive-intelligence:
  build:
    context: ./rewrite-mcp/projects/cic/ingestion/mcp-servers/executive-intelligence-engine
    dockerfile: Dockerfile

helm-server:
  build:
    context: ./rewrite-mcp/tools/helm
    dockerfile: Dockerfile

prompt-telemetry:
  build:
    context: ./rewrite-mcp/tools/prompt-telemetry
    dockerfile: Dockerfile
```

---

## Quick Path Validation

Run this to verify all services and Dockerfiles exist:

```bash
# Verify 6 services in c:\dev\services
for svc in vault unified-api torquequery cic-governance repomix-ingestion knowledge-graph; do
  test -f "c:/dev/services/$svc/package.json" && echo "✓ $svc" || echo "✗ $svc"
done

# Verify special Dockerfiles
test -f "c:/dev/cic/Dockerfile.planning-engine" && echo "✓ planning-engine" || echo "✗ planning-engine"
test -f "c:/dev/cic-ingestion/Dockerfile.harvester-v2" && echo "✓ harvester-v2" || echo "✗ harvester-v2"

# Verify build-system structure
test -d "c:/dev/build-system" && echo "✓ build-system found"
```

---

## Docker-Compose Usage

### Start 10-service minimal (Phase 5e v1):
```bash
cd c:\dev
docker-compose -f cic-os-runtime-v1-core.yml build --no-cache
docker-compose -f cic-os-runtime-v1-core.yml up -d
```

### Start full 20-service runtime (with Phase 6):
```bash
cd c:\dev
docker-compose -f cic-os-runtime-v1-full.yml build --no-cache
docker-compose -f cic-os-runtime-v1-full.yml up -d
```

### Health check:
```bash
docker-compose -f cic-os-runtime-v1-core.yml ps
curl http://localhost:3100/health    # unified-api
curl http://localhost:3111/health    # vault
curl http://localhost:3113/health    # cic-governance
curl http://localhost:3000           # planning-console (UI)
```
