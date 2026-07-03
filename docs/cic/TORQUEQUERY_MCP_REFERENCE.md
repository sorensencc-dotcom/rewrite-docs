# TorqueQuery MCP Tools Reference

Quick reference for AI agents using TorqueQuery MCP server.

## Overview

8 tools for managing project context:
- **Store** - `store_chunk` (create new)
- **Search** - `search_chunks` (hybrid: BM25 + Vector + RRF)
- **Pack** - `get_task_context` (token-optimized retrieval)
- **Read** - `get_chunk`, `list_chunks` (retrieval)
- **Write** - `update_chunk` (modify)
- **Delete** - `delete_chunk` (soft-delete)
- **Inspect** - `get_stats` (diagnostics)

## Tool: `store_chunk`

Store a new chunk with automatic governance validation.

### Input
```json
{
  "namespace": "string (required)",
  "type": "SYSTEM | STATE | LIVING | SCRATCH (required)",
  "title": "string (optional)",
  "body": "string (optional, max 100KB)",
  "tags": ["string"] (optional),
  "importance": "number 0-1 (optional, default 0.5)",
  "ttl_days": "number (optional, ignored for SYSTEM/LIVING)",
  "provenance": {
    "source": "string (required)"
  },
  "embedding": "number[] (optional, 1536 dimensions)"
}
```

### Response
```json
{
  "id": "uuid",
  "namespace": "string",
  "type": "SYSTEM | STATE | LIVING | SCRATCH",
  "title": "string",
  "body": "string",
  "tags": ["string"],
  "importance": "number 0-1",
  "ttl_days": "number | null",
  "version": 1,
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp",
  "has_embedding": "boolean"
}
```

### Rules Applied Automatically
- Type: Validated (must be one of 4 types)
- Namespace: Required, non-empty
- Provenance.source: Required
- TTL: SYSTEM/LIVING → null, STATE → 30d, SCRATCH → 7d
- Importance: Clamped to [0.0, 1.0], defaults to 0.5
- Body: Max 100KB
- Tags: Auto-enriched with "error" if body contains "error"
- Version: Initialized to 1

### Examples

**System Architecture Decision:**
```json
{
  "namespace": "project/architecture",
  "type": "SYSTEM",
  "title": "Microservices Architecture Decision",
  "body": "We've decided to use a microservices architecture with...",
  "tags": ["architecture", "decision"],
  "importance": 0.95,
  "provenance": {
    "source": "adr-001.md",
    "author": "alice@example.com",
    "date": "2026-06-24"
  }
}
```

**Temporary Scratch Note:**
```json
{
  "namespace": "project/notes",
  "type": "SCRATCH",
  "title": "WIP: Refactoring ideas",
  "body": "TODO: Consider splitting the ingestion service...",
  "tags": ["wip", "refactoring"],
  "ttl_days": 3,
  "provenance": {
    "source": "slack-message",
    "channel": "engineering"
  }
}
```

---

## Tool: `search_chunks`

Execute hybrid search (BM25 + Vector + RRF fusion).

### Input
```json
{
  "namespace": "string (required)",
  "query": "string (required)",
  "embedding": "number[] (optional, 1536 dimensions)",
  "max_results": "number (optional, default 10)"
}
```

### Response
```json
[
  {
    "id": "uuid",
    "namespace": "string",
    "type": "SYSTEM | STATE | LIVING | SCRATCH",
    "title": "string",
    "body": "string",
    "tags": ["string"],
    "importance": "number 0-1",
    "ttl_days": "number | null",
    "version": "number",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp",
    "bm25_score": "number (text relevance)",
    "vector_score": "number (semantic similarity)",
    "fused_score": "number (combined ranking)"
  }
]
```

### Scoring
- **BM25:** Full-text search ranking (title weighted A, body weighted B)
- **Vector:** Cosine similarity on embeddings (if provided)
- **RRF:** Reciprocal Rank Fusion combines both signals
  - Formula: `1/(60 + rank_bm25) + 1/(60 + rank_vector)`
  - Higher = better match

### Behavior
- Text-only search: Returns BM25 results only
- With embedding: Returns fused BM25 + Vector results
- Results sorted by fused_score descending
- Max results limit respected

### Examples

**Text-only search:**
```json
{
  "namespace": "project/docs",
  "query": "database migration strategy",
  "max_results": 5
}
```

**Hybrid search (text + semantic):**
```json
{
  "namespace": "project/docs",
  "query": "how do we handle data consistency",
  "embedding": [0.0123, -0.0045, ...],
  "max_results": 10
}
```

---

## Tool: `get_task_context`

Retrieve optimized context for a task, packed within token budget.

### Input
```json
{
  "namespace": "string (required)",
  "task": "string (required, task description)",
  "embedding": "number[] (optional, 1536 dimensions)",
  "max_context_tokens": "number (optional, default 4000)",
  "preferred_types": ["SYSTEM", "LIVING", "STATE", "SCRATCH"] (optional)
}
```

### Response
```json
{
  "chunks": [
    {
      "id": "uuid",
      "namespace": "string",
      "type": "SYSTEM | STATE | LIVING | SCRATCH",
      "title": "string",
      "body": "string",
      "tags": ["string"],
      "importance": "number 0-1",
      "ttl_days": "number | null",
      "version": "number",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp",
      "fused_score": "number"
    }
  ],
  "token_count": "number (estimated)"
}
```

### Packing Algorithm
1. **Search** - Hybrid search for task query (up to 50 results)
2. **Sort** - By type preference, then fused score
3. **Pack** - Greedily add chunks until budget exceeded
4. **Skip** - Oversized chunks are skipped, not truncated

### Type Preference (Default)
1. SYSTEM (permanent, critical knowledge) - Priority 4
2. LIVING (evolving reference docs) - Priority 3
3. STATE (current snapshots, 30d TTL) - Priority 2
4. SCRATCH (temporary notes, 7d TTL) - Priority 1

Custom order overrides default.

### Token Estimation
```
estimated_tokens = (title.length + body.length) / 4
```

### Examples

**Get context for refactoring task:**
```json
{
  "namespace": "project/codebase",
  "task": "Refactor the ingestion pipeline for better error handling",
  "max_context_tokens": 4000,
  "preferred_types": ["SYSTEM", "LIVING", "STATE"]
}
```

**Get context with semantic search:**
```json
{
  "namespace": "project/docs",
  "task": "Implement a new cache invalidation strategy",
  "embedding": [0.0123, -0.0045, ...],
  "max_context_tokens": 8000
}
```

**Custom type order (prioritize recent state):**
```json
{
  "namespace": "project/operations",
  "task": "Check deployment status and recent issues",
  "preferred_types": ["STATE", "SCRATCH", "SYSTEM", "LIVING"],
  "max_context_tokens": 2000
}
```

---

## Tool: `get_chunk`

Retrieve a specific chunk by ID.

### Input
```json
{
  "id": "uuid (required)"
}
```

### Response
```json
{
  "id": "uuid",
  "namespace": "string",
  "type": "SYSTEM | STATE | LIVING | SCRATCH",
  "title": "string",
  "body": "string",
  "tags": ["string"],
  "importance": "number 0-1",
  "ttl_days": "number | null",
  "version": "number",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp",
  "deleted_at": "ISO timestamp | null"
}
```

### Behavior
- Returns 404 if chunk not found
- Returns 404 if chunk is soft-deleted (deleted_at IS NOT NULL)
- Does not return tsvector field (internal to database)

---

## Tool: `list_chunks`

List chunks in a namespace with pagination.

### Input
```json
{
  "namespace": "string (required)",
  "limit": "number (optional, default 50, max 1000)",
  "offset": "number (optional, default 0)"
}
```

### Response
```json
[
  {
    "id": "uuid",
    "namespace": "string",
    "type": "SYSTEM | STATE | LIVING | SCRATCH",
    "title": "string",
    "body": "string",
    "tags": ["string"],
    "importance": "number 0-1",
    "ttl_days": "number | null",
    "version": "number",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
]
```

### Behavior
- Ordered by created_at descending (newest first)
- Excludes soft-deleted chunks
- Empty array if namespace not found

### Examples

**Get first 10 chunks:**
```json
{
  "namespace": "project/docs",
  "limit": 10,
  "offset": 0
}
```

**Paginate through large namespace:**
```json
{
  "namespace": "project/docs",
  "limit": 50,
  "offset": 100
}
```

---

## Tool: `update_chunk`

Update a chunk with full re-validation.

### Input
```json
{
  "id": "uuid (required)",
  "namespace": "string (required)",
  "type": "SYSTEM | STATE | LIVING | SCRATCH (required)",
  "title": "string (optional)",
  "body": "string (optional, max 100KB)",
  "tags": ["string"] (optional),
  "importance": "number 0-1 (optional)",
  "ttl_days": "number (optional)",
  "provenance": {
    "source": "string (required)"
  },
  "embedding": "number[] (optional, 1536 dimensions)"
}
```

### Response
```json
{
  "id": "uuid",
  "namespace": "string",
  "type": "SYSTEM | STATE | LIVING | SCRATCH",
  "title": "string",
  "body": "string",
  "tags": ["string"],
  "importance": "number 0-1",
  "ttl_days": "number | null",
  "version": "number (incremented)",
  "created_at": "ISO timestamp (unchanged)",
  "updated_at": "ISO timestamp (current)"
}
```

### Rules Applied on Update
- All governance rules re-applied
- Version incremented by 1
- created_at unchanged
- updated_at set to now
- Soft-deleted chunks cannot be updated (404)

### Examples

**Update importance and tags:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "namespace": "project/docs",
  "type": "LIVING",
  "title": "API Design Guidelines",
  "body": "Updated content here...",
  "tags": ["api", "design", "critical"],
  "importance": 0.9,
  "provenance": {
    "source": "api-design.md"
  }
}
```

---

## Tool: `delete_chunk`

Soft-delete a chunk.

### Input
```json
{
  "id": "uuid (required)"
}
```

### Response
```json
{
  "success": true,
  "id": "uuid"
}
```

### Behavior
- Soft-delete only (does not remove from DB)
- Sets deleted_at to current timestamp
- Soft-deleted chunks excluded from search/list
- Can be undeleted by re-ingesting with same ID (future feature)
- Returns 404 if already deleted

---

## Tool: `get_stats`

Get service-wide statistics.

### Input
```json
{}
```

### Response
```json
[
  {
    "type": "SYSTEM",
    "namespace": "project/docs",
    "total_chunks": 42,
    "active_chunks": 38
  },
  {
    "type": "LIVING",
    "namespace": "project/docs",
    "total_chunks": 156,
    "active_chunks": 151
  },
  {
    "type": "STATE",
    "namespace": "project/docs",
    "total_chunks": 89,
    "active_chunks": 45
  },
  {
    "type": "SCRATCH",
    "namespace": "project/docs",
    "total_chunks": 203,
    "active_chunks": 12
  }
]
```

### Behavior
- Grouped by type and namespace
- active_chunks = chunks without deleted_at
- total_chunks = all chunks (including deleted)
- Useful for monitoring storage usage

---

## Common Workflows

### 1. Store Architecture Decision
```
store_chunk({
  namespace: "project/architecture",
  type: "SYSTEM",
  title: "Cache Layer Decision",
  body: "We've chosen Redis for high-speed caching because...",
  tags: ["architecture", "caching", "decision"],
  importance: 0.95,
  provenance: { source: "adr-005.md" }
})
```

### 2. Find Context for Task
```
get_task_context({
  namespace: "project/codebase",
  task: "Refactor the authentication middleware",
  max_context_tokens: 6000,
  preferred_types: ["SYSTEM", "LIVING", "STATE"]
})
```

### 3. Search for Similar Issues
```
search_chunks({
  namespace: "project/issues",
  query: "database connection timeout error",
  max_results: 5
})
```

### 4. Track Temporary Insights
```
store_chunk({
  namespace: "project/research",
  type: "SCRATCH",
  title: "WIP: Performance optimization ideas",
  body: "Consider caching expensive queries...",
  ttl_days: 7,
  provenance: { source: "slack-discussion" }
})
```

### 5. Store Current Deployment State
```
store_chunk({
  namespace: "project/operations",
  type: "STATE",
  title: "Production Deployment Status 2026-06-24",
  body: "Production: v2.3.1, 3 replicas, 99.98% uptime",
  ttl_days: 30,
  provenance: { source: "monitoring-system" }
})
```

---

## Error Handling

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Namespace is required` | Missing namespace field | Add namespace |
| `Invalid type. Must be one of: SYSTEM, STATE, LIVING, SCRATCH` | Invalid type | Use correct type |
| `Provenance with a "source" field is required` | Missing provenance.source | Add provenance.source |
| `Chunk body is oversized (exceeds 100,000 characters)` | Body > 100KB | Truncate body |
| `Chunk not found` | ID doesn't exist or is deleted | Check ID |
| `HTTP 500: Unexpected error on idle client` | Database connection issue | Retry or restart service |

### Handling Errors in Code

```typescript
try {
  const chunk = await client.storeChunk({
    namespace: "project",
    type: "SYSTEM",
    provenance: { source: "test" }
  });
} catch (error) {
  if (error.response?.status === 400) {
    console.error("Validation error:", error.response.data.error);
  } else if (error.response?.status === 404) {
    console.error("Not found:", error.response.data.error);
  } else {
    console.error("Unexpected error:", error.message);
  }
}
```

---

## Best Practices

### Namespaces
- Use hierarchical names: `project/component/area`
- Keep chunks within same namespace for context coherence
- Example: `payment-system/fraud-detection/rules`

### Types
- **SYSTEM**: Immutable knowledge (architecture, standards, decisions)
- **LIVING**: Evolving reference (guidelines, patterns, docs)
- **STATE**: Current snapshots (deployment status, config, metrics)
- **SCRATCH**: Temporary work (WIP notes, experiments, ideas)

### Importance
- 0.9-1.0: Critical, high-priority knowledge
- 0.7-0.9: Important context, frequently used
- 0.5-0.7: Regular documentation
- 0.0-0.5: Supplementary, optional info

### Tags
- Use for semantic grouping beyond type
- Auto-enriched with "error" if body contains error
- Examples: `["api", "design"]`, `["database", "migration", "breaking"]`

### Provenance
- Always include `source` (filename, URL, system)
- Add context: author, timestamp, link, channel
- Enables traceability and attribution

### Context Packing
- Default budget (4000 tokens) ≈ 2000 words
- Use `preferred_types` to prioritize recent state vs. permanent knowledge
- For task-specific context, include task description in `task` field
- With embedding, gets semantic relevance + text ranking

---

**Last Updated:** 2026-06-24  
**Version:** 1.0.0
