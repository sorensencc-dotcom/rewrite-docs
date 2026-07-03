# TorqueQuery v0.1.0-alpha — CHANGESET

## Summary
Initial locked release of TorqueQuery as CIC Phase-26 Local Knowledge Engine.
Provides deterministic, local, zero-token documentation intelligence over MkDocs repos.

## New
- Introduced TorqueQuery as a first-class CIC subsystem.
- Implemented MkDocs-aware ingestion:
  - Parse `mkdocs.yml` nav hierarchy.
  - Extract YAML front-matter (title, tags).
  - Attach `file_path`, `mkdocs_section`, `mkdocs_path`, `tags` to nodes.
- Implemented deterministic chunking:
  - `chunkSize = 1024`
  - `chunkOverlap = 128`

- Implemented three-stage retrieval pipeline:
  1. Dense retrieval via embedding similarity.
  2. Semantic reranking via cross-encoder (BGE-Reranker or equivalent).
  3. Tag-aware reranking:
     - Boost nodes whose `tags` intersect with CIC `taskLabels`.
     - `final_score = dense_score * (1 + 0.3 * tag_overlap_ratio)`.

- Implemented token-aware context packing:
  - Fixed `maxContextTokens = 8192`.
  - Reserved budget for system prompt + answer.
  - Greedy packing by score under token budget.

- Implemented strict JSON answer schema:
  ```json
  {
    "answer": "string",
    "sources": [
      {
        "file": "string",
        "section": "string",
        "tags": ["string"],
        "score": 0.0
      }
    ],
    "confidence": 0.0,
    "not_in_docs": false
  }
  ```

- Implemented HTTP API:
  - `POST /query` — question + taskLabels → JSON answer.
  - `POST /ingest` — trigger ingestion pipeline.
  - `GET /health` — status, version, models, config.

- Implemented TypeScript SDK:
  - `TorqueQueryClient.resolveDocs(question, taskLabels)` → `DocsRagAnswer`.

## Config (locked defaults)
- Models:
  - `llm = "llama3.1:8b"`
  - `embedding = "nomic-embed-text"`
  - `reranker = "BAAI/bge-reranker-v2-m3"`
- Retrieval:
  - `topK = 5`
- Context:
  - `maxContextTokens = 8192`

## Guarantees
- All model identifiers pinned.
- Chunking and retrieval parameters pinned.
- Strict JSON schema enforced.
- Health endpoint exposes version + config for reproducibility.

## Known Limitations
- Single MkDocs repo per instance (multi-repo support deferred).
- Reranker model assumed available locally.
- No remote fallbacks; escalation handled by CIC, not TorqueQuery.
