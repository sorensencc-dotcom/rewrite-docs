# Phase 29: Knowledge Graph Architecture

## Overview

Phase 29 implements a unified, queryable knowledge graph for CIC state: agents, repositories, governance records, and signals. The KG is:

- **Append-only**: Immutable event log with versioning
- **Temporal**: Time-ranged queries for drift detection and historical analysis
- **Digest-chained**: Cryptographically auditable mutation trail
- **Dual-write compatible**: TorqueQuery as source of truth, KG as derived view

## Core Components

### 1. GraphStore (SQLite-backed property graph)

**Purpose**: Persistent, ACID node/edge storage with temporal ranges and digest chains.

**Schema**:
- `kg_node`: UUID id, type, created_at, created_by_event_id, is_deleted, valid_from, valid_to, payload_json, version, digest_id
- `kg_edge`: UUID id, src_node_id, dst_node_id, type, created_at, is_deleted, valid_from, valid_to, payload_json, version, digest_id
- `kg_digest`: id, chain_id, prev_digest_id, mutation_type, entity_type, event_id, timestamp, digest_hex, payload_hash_hex, meta_json
- `kg_event_cursor`: id, source, last_event_id, last_event_timestamp, meta_json

**Key Operations**:
- `createNode(node)`: Insert node + digest, return node ID
- `createEdge(edge)`: Insert edge + digest, return edge ID
- `getNode(id)`: Fetch active node by ID
- `getNodeAsOf(externalId, timestamp)`: Fetch node at point in time
- `findNodesInTimeRange(type, validFromMin, validToMax)`: Range query

### 2. EventIntakeServer (HTTP API)

**Endpoints**:
- `POST /api/knowledge-graph/ingest/torque`: Single event
- `POST /api/knowledge-graph/ingest/torque/batch`: Batch events

**Flow**:
1. Validate schema (required fields, version)
2. Check idempotency (event ID, source)
3. Route to EventRouter
4. Update cursor

### 3. EventRouter (Domain-based routing)

**Domains**:
- `memory.*`: Agent skill links, repo ingestion
- `agent.*`: Agent lifecycle (created, deleted)
- `governance.*`: Policies, records, constraints
- `correlation.*`: Correlation clusters

**Example mappings**:
- `memory.agent.skill.linked` → Agent node + Skill node + USES_SKILL edge
- `governance.policy.created` → Policy node
- `correlation.cluster.created` → CorrelationCluster node

### 4. IdempotencyManager (Cursor + deduplication)

**Purpose**: Prevent duplicate event processing, track cursor position per source.

**Schema**:
- `kg_event_cache`: event_id, source, timestamp (dedup lookup)
- `kg_cursor`: source, last_event_id, last_event_timestamp (cursor position)

**Key Operations**:
- `isDuplicate(eventId, source)`: Check if event was processed
- `updateCursor(source, eventId, timestamp)`: Record event as processed
- `getCursorStatus(source)`: Get lag + last event
- `clearDuplicates(source, beforeTimestamp)`: Garbage collection

### 5. TorqueQueryClient (Upstream integration)

**Purpose**: Fetch events from TorqueQuery for backfill and streaming.

**Key Operations**:
- `getEventsByTimeRange(start, end, type)`: Historical backfill
- `getEventsAfter(eventId, limit)`: Cursor-based pagination
- `streamEvents(cursor, pollInterval)`: Async generator, long-polling compatible
- `healthCheck()`: Service availability

### 6. BootstrapTooling (CLI operations)

**Functions**:
- `bootstrapFromTorqueQuery(store, { startTimestamp, eventType })`: Backfill KG from TQ
- `replayEvents(store, eventIds)`: Replay specific events
- `checkCursorStatus(idempotency, source)`: Monitor lag

## API Surfaces

### Introspection

- `GET /api/knowledge-graph/schema`: Node/edge types + properties
- `GET /api/knowledge-graph/stats`: Counts, density, last ingestion

### Ingestion

- `POST /api/knowledge-graph/ingest/torque`: Single event
- `POST /api/knowledge-graph/ingest/torque/batch`: Batch events

### Diagnostics

- `GET /api/knowledge-graph/diagnostics/integrity`: Digest chain + table health
- `GET /api/knowledge-graph/diagnostics/cursor?source=torque`: Event lag + cursor position
- `GET /api/knowledge-graph/diagnostics/lag`: Lag across all sources

### Metrics

- `GET /metrics`: Prometheus-compatible metrics (nodes, edges, digests, ingest rate)

## Data Model

### Node Types

- `Agent`: Logical agent identity
- `Skill`: Reusable skill definition
- `Repo`: Repository
- `File`: File within repo
- `Commit`: Versioned change
- `Signal`: Drift/health/anomaly signal
- `CorrelationCluster`: Grouped signals
- `GovernanceRecord`: Governance decision
- `AuditEvent`: Audit trail entry
- `Policy`: Governance policy
- `Constraint`: Governance constraint
- `Amendment`: Constitutional amendment

### Edge Types

- `USES_SKILL`: Agent → Skill (capability link)
- `AGENT_EXECUTED_EVENT`: Agent → RunEvent
- `EVENT_TOUCHES_REPO`: RunEvent → Repo
- `EVENT_TOUCHES_FILE`: RunEvent → File
- `EVENT_EMITS_SIGNAL`: RunEvent → Signal
- `SIGNAL_OBSERVED_ON_AGENT`: Signal → Agent
- `SIGNAL_OBSERVED_ON_REPO`: Signal → Repo
- `PART_OF_CLUSTER`: Signal → CorrelationCluster
- `CORRELATED_WITH`: Signal ↔ Signal
- `RECORD_AMENDS_POLICY`: GovernanceRecord → Policy
- `RECORD_CREATES_CONSTRAINT`: GovernanceRecord → Constraint
- `EVENT_AUTHORED_BY_AGENT`: Agent → GovernanceRecord/AuditEvent

## Temporal Model

Every node and edge has:
- `valid_from`: Start of validity window (epoch ms)
- `valid_to`: End of validity window (epoch ms); NULL = open-ended
- `is_deleted`: Soft delete flag (1 = deleted, 0 = active)

**Queries respect temporal boundaries**:
- `getNodeAsOf(externalId, timestamp)`: Node state at point in time
- `findNodesInTimeRange(type, validFromMin, validToMax)`: Nodes active during range

## Digest Chain

Every mutation produces a cryptographic audit trail:

1. **Canonical payload**: Normalize node/edge JSON (sorted keys)
2. **Payload hash**: SHA256(canonical_json)
3. **Digest input**: Concatenate: chainId | prevDigestHex | mutationType | entityType | entityId | eventId | timestamp | payloadHashHex
4. **Digest**: SHA256(digest_input)

**Chain semantics**:
- `chain_id = "kg_node:<external_id>"` for nodes
- `chain_id = "kg_edge:<src_id>-<type>-<dst_id>"` for edges
- `prev_digest_id` links to previous mutation in chain
- First mutation has `prev_digest_id = NULL` (chain head)

**Replay**:
- Apply mutations in ascending ID (or timestamp) order
- Recompute digests to verify integrity
- Reconstruct temporal state at any point

## Dual-Write Integration with TorqueQuery

**Architecture**:
```
TorqueQuery (event stream, semantic index)
     ↓
EventIntakeServer (validate, route)
     ↓
EventRouter (domain-based transformation)
     ↓
GraphStore (append, digest)
```

**Semantics**:
- TorqueQuery is canonical source of truth
- KG is derived, query-optimized view
- Events flow one-way: TQ → KG
- No circular dependencies

**Cursor management**:
- `kg_event_cursor` tracks last event processed from TQ
- Idempotency via `kg_event_cache`
- Resume from cursor on restart

## Testing

### Unit Tests (31 tests)

**Schema & Persistence (8 tests)**:
- Node CRUD + indexing
- Edge CRUD + indexing
- Temporal ranges (valid_from/valid_to)
- Soft deletes

**Digest Chain (8 tests)**:
- Digest creation + chaining
- Payload hash stability
- Integrity verification
- Historical replay

**Temporal Queries (15 tests)**:
- As-of queries (point-in-time)
- Time-range queries
- Drift detection (compare current vs historical)
- Multi-entity joins

### Integration Tests (pending)

**Event Routing (10 tests)**:
- Domain-based routing
- Event type → node/edge mapping
- Payload preservation
- Error handling

**Idempotency (8 tests)**:
- Duplicate detection
- Cursor-based resume
- Event lag monitoring
- Concurrent updates

## Docker Deployment

**Image**: `dev-knowledge-graph:latest`
- Based on `node:20` (native module support)
- Includes `python3 build-essential` (for better-sqlite3)
- Port: 3107
- Health check: `GET /health`

**Environment**:
- `KG_PORT`: Server port (default 3107)
- `KG_DB_PATH`: SQLite DB path (default /tmp/knowledge-graph.db)
- `LOG_LEVEL`: Log verbosity (default info)
- `NODE_ENV`: Environment (development/production)

## Migration Strategy

### Phase A — Prep ✅
- Inventory TorqueQuery outputs
- Define mapping spec

### Phase B — Dual Write (Current)
- TorqueQuery emits events to KG ingestion
- KG dual-writes from TQ
- Enable cursor-based resume

### Phase C — Backfill
- Export historical TQ data
- Ingest into KG
- Validate counts + sample paths

### Phase D — Read Migration
- Implement KG-backed query variants
- Shadow mode (compare TQ vs KG outputs)
- Flip feature flags → KG primary
- Keep TQ as fallback

### Phase E — Re-scope TorqueQuery
- Reduce to semantic index + local queries
- KG becomes source of truth for global relationships

## Production Checklist

- [ ] Cursor persistence (survive restarts)
- [ ] Event backlog monitoring (lag alerts)
- [ ] Digest chain integrity checks (scheduled)
- [ ] Operator runbooks (bootstrap, replay, recovery)
- [ ] Performance baseline (latency SLO)
- [ ] High-availability setup (replicated SQLite or migration to PostgreSQL)

## Future Phases

- **Phase 29.3**: Vector embeddings (Qdrant) for semantic similarity
- **Phase 30**: Causal reasoning engine (why, impact, counterfactuals)
- **Phase 31**: Autonomous orchestration (plan & execute via KG + reasoning)
