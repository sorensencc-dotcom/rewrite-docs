# Phase 26 — Architecture Decision Log (ADL)

**Version:** 1.0.0  
**Date:** July 1, 2026  
**Commit:** 8bbc49a  
**Domain:** xAI Docs MCP Integration

---

## Overview

This ADL documents all significant architectural choices made during Phase 26 implementation. Each decision is recorded with context, rationale, alternatives considered, and implications for future phases.

---

## ADL-1: MCP Client Architecture

**Status:** DECIDED ✅  
**Date:** June 28, 2026  
**Owner:** Chris

### Context

Need to integrate xAI Docs MCP (JSON-RPC 2.0 protocol) into TorqueQuery. Multiple approaches available for client implementation.

### Decision

**Build a deterministic, stateless JSON-RPC client over WebSocket.**

Implement `McpJsonRpcClient` class:
- Deterministic request IDs (SHA-256 hash of method + params)
- Fixed backoff retry logic (100ms intervals, 3 attempts max)
- No connection pooling or caching
- No ambient state (pure function semantics)
- Error mapping to deterministic error codes

### Rationale

1. **Determinism:** JSON-RPC envelope (id, method, params, result) is deterministic. SHA-256 hashing ensures reproducible request IDs even if clock skews.
2. **Simplicity:** Stateless design prevents race conditions and makes debugging trivial.
3. **Testability:** Pure functions are easy to unit-test and mock.
4. **Compatibility:** JSON-RPC 2.0 is a standard; no vendor lock-in.
5. **Observability:** Every request has a stable ID for tracing.

### Alternatives Considered

**Alt A:** Use existing HTTP client wrapper (TorqueQueryClient.ts pattern)
- ❌ Mismatch: xAI uses WebSocket, not HTTP
- ❌ Would require adapter layer

**Alt B:** Use `ws` npm package with automatic reconnect
- ❌ Introduces statefulness (connection pool)
- ❌ Harder to test (async setup/teardown)
- ❌ Adds external dependency (we already use native Node.js crypto)

**Alt C:** Use gRPC instead of JSON-RPC
- ❌ xAI doesn't expose gRPC
- ❌ Overkill for doc ingestion

### Implications

- Future MCP clients can reuse the same pattern
- Tracing tools need to parse SHA-256 IDs (low effort)
- Connection failures are visible in logs (no silent reconnects)
- Phase 27 world-corpus expansion can reuse this client

### References

- `services/torquequery/src/ingest/xai/client.ts`
- JSON-RPC 2.0 spec: https://www.jsonrpc.org/specification

---

## ADL-2: Embedding Extraction (Shared Module)

**Status:** DECIDED ✅  
**Date:** June 30, 2026  
**Owner:** Chris

### Context

Two ingestion layers exist that need deterministic embeddings:
1. `c:\dev\ingestion\unified-ingestion-adapter.ts` (LCG-based embedText)
2. `services\torquequery\src\shared\utils\embedding.ts` (duplicated same logic)

Duplication risk: small changes to LCG constants in one place cause silent algorithm drift elsewhere.

### Decision

**Extract `embedText()` and `embedImage()` to shared module.**

Create `c:\dev\shared\embedding.ts`:
- Single source of truth for deterministic LCG (Linear Congruential Generator)
- Export both `embedText(text: string): number[]` and `embedImage(buffer: Buffer): number[]`
- Both functions produce 768-dimensional vectors seeded by SHA-256 content hash
- LCG constants hardcoded: multiplier=1103515245, increment=12345, modulus=0x7fffffff

Update both layers to import from shared:
- `ingestion/unified-ingestion-adapter.ts` → import embedText
- `torquequery/src/shared/utils/embedding.ts` → import embedText, re-export for compatibility

### Rationale

1. **Drift Prevention:** Single source of truth eliminates algorithm divergence.
2. **Testability:** Easier to verify embeddings are deterministic (one place to test).
3. **Maintainability:** Future tweaks to LCG only need one change.
4. **Modularity:** Shared utilities are a natural home for cross-package algorithms.
5. **Auditability:** Easier to review cryptographic constants in one location.

### Alternatives Considered

**Alt A:** Keep duplication, document it
- ❌ Violates DRY principle
- ❌ Drift risk remains (human error in sync)
- ❌ Harder to audit (two places to check)

**Alt B:** Use external embedding service (OpenAI/Hugging Face)
- ❌ Breaks determinism (API changes version)
- ❌ Adds latency (network call per document)
- ❌ Adds cost (per-API pricing)
- ❌ Creates external dependency for core functionality

**Alt C:** Compute embeddings at query time only
- ❌ Slower searches (no precomputed vectors)
- ❌ Less deterministic (different compute at different times)

### Implications

- Commit 8bbc49a locks this decision (extraction complete)
- Both `embedding.ts` files now import from `shared/embedding.ts`
- Tests verify zero drift across 100 runs
- Phase 27+ must use `shared/embedding.ts` for any new embeddings

### References

- `c:\dev\shared\embedding.ts` (source of truth)
- Commit 8bbc49a (extraction completion)
- LCG constants: multiplier=1103515245 (ANSI C standard)

---

## ADL-3: Deterministic Chunking Strategy

**Status:** DECIDED ✅  
**Date:** June 28, 2026  
**Owner:** Chris

### Context

Documents need to be split into chunks for embedding and storage. Chunking strategy must be deterministic (same input → same chunks every time).

### Decision

**Use fixed-size token window with no semantic heuristics.**

Chunking algorithm:
- Window size: 512 tokens (Phase 23 standard)
- No overlap by default (configurable)
- Chunk ID: `${docId}_${chunkIndex}` (deterministic)
- No paragraph/sentence boundary detection
- Simple sliding window, deterministic breaks

### Rationale

1. **Determinism:** Fixed window guarantees reproducible boundaries.
2. **Simplicity:** No NLP/ML needed (no model changes = no drift).
3. **Predictability:** Easy to test and validate outputs.
4. **Performance:** O(n) tokenization with no semantic analysis.
5. **Consistency:** Same doc structure across all ingestion layers.

### Alternatives Considered

**Alt A:** Semantic chunking (sentence/paragraph boundaries)
- ❌ Requires NLP (spaCy, NLTK)
- ❌ Non-deterministic (model versions change)
- ❌ Slower (ML inference per doc)
- ✅ Better readability (but not required here)

**Alt B:** Adaptive chunking (variable window based on content)
- ❌ Stochastic boundaries (non-deterministic)
- ❌ Harder to test

**Alt C:** No chunking (ingest full doc)
- ❌ Large embeddings (768-dim × 10MB = too much memory)
- ❌ Slower search (full doc comparison)

### Implications

- Chunk size is locked at 512 tokens (change requires major version bump)
- Chunk IDs are stable (can be used for deduplication)
- Phase 27 can improve chunking without re-ingesting existing docs (new version_id)

### References

- `services/torquequery/src/shared/utils/chunking.ts`
- Phase 23 standard: token window=512, no overlap

---

## ADL-4: Metadata Schema (Minimal)

**Status:** DECIDED ✅  
**Date:** June 28, 2026  
**Owner:** Chris

### Context

Each chunk needs metadata (source, doc ID, timestamp, etc.). Schema must be stable and queryable.

### Decision

**Minimal metadata schema with only essential fields:**

```sql
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY,                    -- ${docId}_${chunkIndex}
  doc_id TEXT NOT NULL,                   -- Original document ID
  chunk_index INTEGER NOT NULL,           -- 0-based index
  text TEXT NOT NULL,                     -- Raw chunk text
  embedding TEXT NOT NULL,                -- JSON-stringified 768-dim array
  source TEXT NOT NULL,                   -- e.g. "xai-docs-mcp"
  url TEXT,                               -- Optional source URL
  lineage TEXT,                           -- Optional JSON: requestId, timestamp
  createdAt TEXT NOT NULL                 -- ISO-8601 timestamp
);
```

No additional fields. No versioning, no tags, no custom metadata.

### Rationale

1. **Determinism:** Minimal schema = fewer fields to drift
2. **Queryability:** Only index what's searchable (doc_id, source)
3. **Storage:** No bloat (each field adds cost)
4. **Auditability:** Easy to audit what's stored
5. **Extensibility:** Can add fields via schema migration (backwards-compatible)

### Alternatives Considered

**Alt A:** Rich metadata (tags, versions, custom fields)
- ✅ More flexible for queries
- ❌ Harder to keep deterministic (many places to drift)
- ❌ Storage bloat (custom fields rarely used)
- ❌ Schema changes needed to add fields later

**Alt B:** Store in memory_events instead
- ❌ memory_events.payload is bare TEXT (no embedding column)
- ❌ Vector search requires brute-force scanning all rows
- ❌ No index on embeddings

**Alt C:** Separate tables for metadata
- ❌ Extra JOIN complexity
- ❌ Denormalization risk

### Implications

- Chunk schema is frozen (no new fields without migration)
- Lineage is optional JSON (preserve audit trail without schema lock)
- URL is optional (not all sources have URLs)
- Future vector indexes (sqlite-vss, vec) can sit on top without changes

### References

- `services/torquequery/src/db/schema.sql`
- Test schema validation: `services/torquequery/tests/schema.test.ts`

---

## ADL-5: TorqueQuery Routing Pattern

**Status:** DECIDED ✅  
**Date:** June 28, 2026  
**Owner:** Chris

### Context

TorqueQuery has mostly inline route handlers. Phase 26 adds xAI-specific routes (`/mcp/xai/search`, `/mcp/xai/ingest`). Need to modularize without breaking existing patterns.

### Decision

**Create modular webhook-router pattern for xAI routes.**

Structure:
```
services/torquequery/src/ingest/xai/
  ├── mcp-xai.ts                    # Router factory
  └── handlers/
      ├── search.ts                 # /search handler
      └── ingest.ts                 # /ingest handler

server.ts:
  app.use('/mcp/xai', mcpXaiRouter(dependencies));
```

Router mounts at `/mcp/xai`, exposes:
- `POST /mcp/xai/search` → query document_chunks
- `POST /mcp/xai/ingest` → write to document_chunks

### Rationale

1. **Modularity:** xAI logic isolated (easy to debug, test, remove)
2. **Precedent:** Matches existing webhook-router pattern (webhook-listener.ts)
3. **Testability:** Router can be tested in isolation
4. **Scalability:** Easy to add `/mcp/xyz/` routers in future (other MCP providers)
5. **Separation of Concerns:** TorqueQuery handlers don't know about xAI internals

### Alternatives Considered

**Alt A:** Inline handlers in server.ts
- ✅ Simpler for small changes
- ❌ server.ts becomes bloated
- ❌ Harder to test (full server startup needed)
- ❌ Hard to reuse router in other services

**Alt B:** Separate service (mcp-service)
- ✅ Full decoupling
- ❌ More services to operate
- ❌ Network latency between services
- ❌ Overkill for Phase 26 scope

**Alt C:** Express subapp pattern
- ✅ Similar to router pattern
- ❌ Subapps are less flexible than middleware

### Implications

- Future MCP channels (Meituan, etc.) can follow same pattern
- Webhook-listener.ts is now canonical example
- Router testability is guaranteed (no integration test needed)

### References

- `services/torquequery/src/ingest/xai/mcp-xai.ts`
- Existing pattern: `services/torquequery/src/shared/webhook-listener.ts`
- Express routing docs: https://expressjs.com/en/guide/routing.html

---

## ADL-6: Error Handling (Deterministic Codes)

**Status:** DECIDED ✅  
**Date:** June 29, 2026  
**Owner:** Chris

### Context

Phase 26 has multiple failure modes (MCP timeout, DB write failure, invalid input). Errors must be deterministic (same failure → same error code every time) for audit and debugging.

### Decision

**Deterministic error codes and messages.**

Error mapping:
- **400 BAD_REQUEST** → Invalid input (missing docId, empty text, etc.)
- **404 NOT_FOUND** → Document not found
- **408 REQUEST_TIMEOUT** → MCP timeout (30s)
- **500 INTERNAL_ERROR** → Unexpected error (DB write failure, etc.)
- **503 SERVICE_UNAVAILABLE** → MCP unreachable (after 3 retries)

Each error includes:
- Stable error code (not a random trace ID)
- Deterministic message (no timestamps, no PII)
- Deterministic retry logic (fixed backoff)

### Rationale

1. **Auditability:** Same error code = same root cause (easier to track)
2. **Determinism:** No random error messages (important for testing)
3. **Observability:** Error codes are indexable in logs
4. **Debugging:** Retry logic is predictable (helps narrow down issues)

### Alternatives Considered

**Alt A:** Random error IDs (UUID for each error)
- ❌ Makes deduplication hard (same error has different ID each time)
- ❌ Audit trail becomes noisy

**Alt B:** HTTP status only (no error codes)
- ❌ Multiple causes map to same status (ambiguous)

**Alt C:** Error strings with timestamps
- ❌ Non-deterministic (timestamp varies)
- ❌ Harder to deduplicate in logs

### Implications

- Error codes are part of the API contract (cannot change without breaking clients)
- Retry logic is deterministic (fixed backoff, no jitter)
- Monitoring tools can key off error codes (not messages)

### References

- HTTP status codes: https://httpwg.org/specs/rfc7231.html#status.codes
- `services/torquequery/src/ingest/xai/handlers/search.ts` (error mapping)

---

## ADL-7: CIC Adapter Integration Point

**Status:** DECIDED ✅  
**Date:** June 29, 2026  
**Owner:** Chris

### Context

xAI ingestion must integrate with CIC's full pipeline (Ingest → Enrichment → Orchestration → Synthesis → Audit). Where does Phase 26 plug in?

### Decision

**Phase 26 plugs into the INGEST stage.**

XaiDocsMcpAdapter:
- Implements BaseAdapter interface
- normalize() → splits input doc into chunks + embeddings
- run() → calls TorqueQuery endpoints
- validate() → checks output format
- confidence() → returns stability score

Adapter registered in AdapterRegistry:
```ts
registry.register("xai-docs-mcp", new XaiDocsMcpAdapter(config));
```

Produces world-corpus entries for downstream consumption.

### Rationale

1. **Consistency:** Matches FamilySearchAdapter pattern (proven)
2. **Pipeline Integration:** Automatic audit trail (Audit stage logs all events)
3. **Drift Scoring:** CIC drift system already wired to BaseAdapter outputs
4. **Testability:** Full pipeline testable via adapter mock
5. **Modularity:** xAI can be disabled without touching CIC core

### Alternatives Considered

**Alt A:** Bypass CIC pipeline (direct to TorqueQuery only)
- ❌ Skips enrichment and orchestration
- ❌ No audit trail
- ❌ Not integrated with drift scoring
- ✅ Simpler (but less powerful)

**Alt B:** Create new Aperture adapter (tool-execution)
- ❌ Aperture is for tools, not content ingestion
- ❌ Wrong abstraction level

**Alt C:** Direct SQL inserts to document_chunks
- ❌ No audit trail
- ❌ Bypasses all normalization

### Implications

- Phase 27+ world-corpus expansion will use same adapter pattern
- Audit logs automatically track all xAI ingestions
- Drift scoring works out-of-the-box (no extra wiring needed)

### References

- `cic-ingestion/src/adapters/xai/XaiDocsMcpAdapter.ts`
- Existing pattern: `cic-ingestion/src/adapters/familysearch/FamilySearchAdapter.ts`
- BaseAdapter interface: `cic-ingestion/src/adapters/BaseAdapter.ts`

---

## ADL-8: Determinism Testing Strategy

**Status:** DECIDED ✅  
**Date:** June 30, 2026  
**Owner:** Chris

### Context

Phase 26 is "deterministic" by design. How do we test and verify this claim?

### Decision

**Three-tier determinism testing:**

1. **Unit tier:** Single component reproducibility
   - Same input → same output across 10 runs
   - Test: `embedText("hello")` produces identical 768-dim array 10× in a row

2. **Integration tier:** Full pipeline reproducibility
   - Same document → same chunks, same embeddings, same DB rows across 10 runs
   - Test: Ingest same doc 10×, verify byte-identical results

3. **Regression tier:** Drift scoring integration
   - Embedding hashes remain stable across releases
   - Test: Hash mismatch = immediate alert

### Rationale

1. **Proactive Detection:** Catch drift early (before it spreads)
2. **Auditability:** Clear test trail (good for compliance)
3. **Confidence:** "Deterministic" is not an opinion (it's measurable)
4. **Debugging:** Three tiers narrow down where drift happens

### Alternatives Considered

**Alt A:** Single E2E test
- ❌ Passes if all 3 tiers pass, fails if any one fails (hard to isolate)

**Alt B:** No determinism testing
- ❌ Dangerous (drift happens silently)
- ❌ Audit risk (can't prove determinism)

**Alt C:** Statistical testing (e.g., 99% similarity)
- ❌ Allows small drifts (unacceptable for embeddings)
- ❌ Not determinism (determinism = 100%)

### Implications

- Tests are slow (10 runs × 3 tiers = 30 test runs)
- Phase 27+ must maintain same testing strategy
- Drift detection is now automatic (not manual)

### References

- Test suite: `services/torquequery/tests/embedding.test.ts` (unit tier)
- Test suite: `cic-ingestion/src/tests/xai-ingestion-flow.test.ts` (integration tier)
- Test suite: `cic/src/tests/drift-scoring.test.ts` (regression tier)

---

## ADL-9: TorqueQuery Database Choice

**Status:** DECIDED (Confirmed) ✅  
**Date:** Inherited from Phase 5, Confirmed in Phase 26

### Context

TorqueQuery uses SQLite as its embedded database. Phase 26 adds vector storage (document_chunks with embeddings). Is SQLite sufficient?

### Decision

**Keep SQLite for Phase 26. Plan migration to sqlite-vss or vec extension for Phase 27.**

Rationale:
- SQLite is sufficient for embedded vectors (JSON storage)
- Deterministic (no external DB needed)
- Easy to test (in-memory mode)
- Vector indexes (sqlite-vss) are available but optional for now
- Brute-force search works for initial world-corpus size

### Alternatives Considered

**Alt A:** Upgrade to PostgreSQL + pgvector
- ❌ Requires external DB (less deterministic)
- ❌ Adds operational overhead (not needed for Phase 26 scope)
- ✅ Better for scale (relevant for Phase 27+)

**Alt B:** External vector DB (Qdrant, Weaviate)
- ❌ Same issues as PostgreSQL
- ❌ Overkill for Phase 26

### Implications

- Phase 26 JSON storage is temporary
- Phase 27 should plan vector index migration
- Queries are O(n) in chunk count (fine for now, problematic at scale)

### References

- Current implementation: SQLite with JSON storage
- sqlite-vss docs: https://github.com/asg017/sqlite-vss
- Future consideration: Phase 27 scale planning

---

## ADL-10: Future Extensibility (Roadmap)

**Status:** DECIDED ✅  
**Date:** June 30, 2026  
**Owner:** Architecture

### Context

Phase 26 implements one MCP channel (xAI Docs). Future phases will add more (Meituan, others). How do we design for extensibility?

### Decision

**New MCP channels follow Phase 26 template:**

1. Create `services/torquequery/src/ingest/{provider}/` directory
2. Implement router (`{provider}-router.ts`)
3. Mount in `server.ts` at `/mcp/{provider}`
4. Create `cic-ingestion/src/adapters/{provider}/` adapter
5. Register in AdapterRegistry
6. Add tests (unit + integration)
7. Document in ADL

No shared code changes needed (pattern is reusable).

### Rationale

1. **Modularity:** Each provider is self-contained
2. **Testability:** Can enable/disable providers without touching core
3. **Auditability:** Clear history of what was added when
4. **Scalability:** Scales to 10+ providers without architectural changes

### Implications

- Phase 27 (Meituan, others) can reuse this exact pattern
- Core systems (CIC, TorqueQuery) never need to change
- Documentation is the only coupling point (ADL extends)

### References

- Phase 26 template: `services/torquequery/src/ingest/xai/`
- Phase 27 roadmap: Begin Meituan MCP integration

---

## Summary Table

| Decision | Status | Owner | Date | Implication |
|----------|--------|-------|------|-------------|
| ADL-1: MCP Client | ✅ DECIDED | Chris | Jun 28 | Deterministic JSON-RPC over WebSocket |
| ADL-2: Embedding Extraction | ✅ DECIDED | Chris | Jun 30 | Commit 8bbc49a (shared/embedding.ts) |
| ADL-3: Chunking Strategy | ✅ DECIDED | Chris | Jun 28 | Fixed 512-token window, no overlap |
| ADL-4: Metadata Schema | ✅ DECIDED | Chris | Jun 28 | Minimal schema, lineage optional |
| ADL-5: Routing Pattern | ✅ DECIDED | Chris | Jun 28 | Modular webhook-router, scalable |
| ADL-6: Error Codes | ✅ DECIDED | Chris | Jun 29 | Deterministic error mapping, fixed backoff |
| ADL-7: CIC Integration | ✅ DECIDED | Chris | Jun 29 | BaseAdapter in INGEST stage |
| ADL-8: Testing | ✅ DECIDED | Chris | Jun 30 | Three-tier determinism validation |
| ADL-9: Database | ✅ DECIDED (Confirmed) | Phase 5 | Jun 30 | SQLite now, migrate to vector DB Phase 27 |
| ADL-10: Extensibility | ✅ DECIDED | Arch | Jun 30 | Template pattern for future providers |

---

## Approval & Sign-Off

**Reviewed by:** Architecture Review Board  
**Date:** July 1, 2026  
**Status:** ✅ ALL DECISIONS APPROVED

Next: Phase 27 (World-Corpus Expansion) begins.
