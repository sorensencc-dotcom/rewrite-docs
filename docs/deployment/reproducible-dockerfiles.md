---
name: deployment-reproducible-dockerfiles
description: Deterministic and reproducible Dockerfile patterns
metadata:
  type: deployment
---

# Reproducible Dockerfiles

Multi-stage, deterministic builds with SOURCE_DATE_EPOCH sealing for reproducible layer hashes.

## harness-v3

```dockerfile
# filename: Dockerfile (harness-v3)
# reproducible, multi-stage, node 20, sealed runtime

FROM node:20-slim AS build
ENV SOURCE_DATE_EPOCH=1710000000
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
ENV NODE_ENV=production
ENV SOURCE_DATE_EPOCH=1710000000

CMD ["node", "dist/index.js"]
```

**Deterministic guarantees:**
- Fixed epoch for all timestamps in layers
- No git metadata leakage
- Multi-stage avoids bloat in final image
- No inline secrets (use build args for sensitive values)

## onnx-sidecar

```dockerfile
# filename: Dockerfile (onnx-sidecar)
# reproducible, multi-stage, node 20 + ONNX runtime, sealed

FROM node:20-slim AS build
ENV SOURCE_DATE_EPOCH=1710000000
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app

# ONNX runtime layer (example: CPU-only)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libgomp1 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
ENV NODE_ENV=production
ENV SOURCE_DATE_EPOCH=1710000000

CMD ["node", "dist/onnx-sidecar.js"]
```

**Deterministic guarantees:**
- ONNX runtime dependencies pinned
- No package manager cache bloat (rm -rf /var/lib/apt/lists/*)
- SOURCE_DATE_EPOCH locked across both stages
- Production environment sealed at build time

## Build & Verify

Test reproducibility locally:

```bash
# Build once
docker build -t harness-v3:latest ./harness-v3
docker build -t onnx-sidecar:latest ./onnx-sidecar

# Hash the image layers
docker inspect harness-v3:latest | jq '.RootFS.Layers'
docker inspect onnx-sidecar:latest | jq '.RootFS.Layers'

# Rebuild and compare hashes
docker build -t harness-v3:v2 ./harness-v3
docker inspect harness-v3:v2 | jq '.RootFS.Layers'

# Hashes should match layer-for-layer
```
