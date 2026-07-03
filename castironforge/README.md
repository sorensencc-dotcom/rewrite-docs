# CastIronForge Monorepo

Chat-driven FamilySearch temporal pipeline with multi-provider genealogical data integration (Ancestry, WikiData, FamilySearch).

## Structure

- **chat-frontend** — Vite/React UI (port 5173)
- **chat-agent** — Express/TypeScript backend (port 8000)
- **torque-query** — Temporal query engine (port 9000)
- **cic-ingestion** — Data ingestion pipeline (port 3000)
- **shared** — Shared types/utilities (placeholder)

## Prerequisites

- Node 20+
- pnpm
- Docker (optional, for compose)

## Install

```bash
pnpm install
```

## Run (local)

```bash
# Individual services
pnpm --filter chat-frontend dev -- --port 5173
PORT=8000 pnpm --filter chat-agent dev
PORT=9000 pnpm --filter torque-query dev
PORT=3000 pnpm --filter cic-ingestion dev
```

Or use bootstrap script:

```bash
.\bootstrap.ps1
```

Or Docker Compose:

```bash
docker-compose up --build
```

## FamilySearch Pipeline

1. Open `http://localhost:5173`
2. Select model: `torque:familysearch`
3. Run:

   ```text
   /pipeline person <PID>
   ```

Expected output:
- Temporal knowledge graph
- Life events
- Relationships
- Sources
- Confidence scores
- Narrative summary

## Health Check

```bash
.\health-check.ps1
```

All services should show **OK**.

## Status

✅ **Reconstruction complete**

- ✅ chat-frontend — 4205 files
- ✅ chat-agent — 1988 files
- ✅ torque-query — 98 files
- ✅ cic-ingestion — 24295 files
- ⏳ shared — Placeholder

## Archived Fragments

Original fragments archived at: `C:\dev\_cic-fragments-archive`

Safe to delete after validation.
