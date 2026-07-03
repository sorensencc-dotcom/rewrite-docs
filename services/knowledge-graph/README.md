# Knowledge Graph Service

Phase 29: Knowledge Graph — unified, queryable store for CIC state.

## Overview

Transforms TorqueQuery + Vault + Repomix + Evolution Loop into a single queryable knowledge graph. Provides semantic memory index, governance records, repo metadata, and evolution history as a unified node/edge structure.

## Architecture

### Layers

1. **GraphStore:** SQLite-backed property graph (nodes, edges, indexes)
2. **Mappers:** Domain → graph transformations (TorqueQuery, Vault, Repomix, Evolution)
3. **Query Engine:** Paths, neighborhoods, patterns, causality
4. **API:** Express routes for ingestion, queries, introspection

## Setup

```bash
npm install
npm run build
npm start
```

### Configuration

- `KG_DB_PATH`: SQLite database path (default: `data/knowledge-graph.db`)
- `KG_PORT`: Server port (default: `3101`)

## API

### Introspection

- `GET /api/knowledge-graph/schema` — node/edge types + properties
- `GET /api/knowledge-graph/stats` — counts, last ingestion time

### Ingestion (Phase 29.1)

- `POST /api/knowledge-graph/ingest/torque` — TorqueQuery batches
- `POST /api/knowledge-graph/ingest/vault` — Vault records
- `POST /api/knowledge-graph/ingest/repos` — Repomix snapshots
- `POST /api/knowledge-graph/ingest/evolution` — Evolution Loop outputs

### Query (Phase 29.2)

- `POST /api/knowledge-graph/query/paths` — path finding
- `POST /api/knowledge-graph/query/neighborhood` — k-hop expansion
- `POST /api/knowledge-graph/query/patterns` — pattern matching
- `POST /api/knowledge-graph/query/causality` — causal chains

## Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Roadmap

- **Phase 29.0:** GraphStore + schema ✅
- **Phase 29.1:** Ingestion bridges (TorqueQuery, Vault, Repomix, Evolution)
- **Phase 29.2:** Query engine (paths, neighborhoods, patterns, causality)
- **Phase 29.3:** Governance integration (access control, digest chain)

---

See [Phase 29–31 ABB](../../docs/phase-29-31-architecture.md) for full architecture.
