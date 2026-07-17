# Phase‑26 — torque-query-docs Readiness Checklist

Named `torque-query-docs` per Tier 1 decision 2026-07-17 (Option i, split and
rename) -- distinct from the memory/drift search service, which kept the name
`TorqueQuery`. See `docs/meta/phases/torquequery-reconciliation-charter.md` in
the main C:/dev repo.

## A. Workspace & Structure

- [x] `cic/torquequery/` workspace created (original scaffold location; this
      directory was later moved to `castironforge/torque-query-docs`, and the
      unrelated empty `cic/torquequery/` placeholder was retired 2026-07-17)
- [x] `pyproject.toml` defined
- [x] `config/settings.yaml` pinned
- [x] `src/` folder with ingestion + RAG engine
- [x] `scripts/ingest.py` present
- [x] `storage/chroma/` exists

## B. Ingestion Pipeline
- [x] MkDocs nav parsed from `mkdocs.yml`
- [x] YAML front‑matter extracted (title, tags)
- [x] Metadata attached to nodes:
  - `file_path`
  - `mkdocs_section`
  - `mkdocs_path`
  - `tags`
- [x] Chunking deterministic (`1024/128`)
- [x] Embeddings generated via Ollama
- [x] Vector index persisted to Chroma

## C. Retrieval Pipeline
- [x] Dense retrieval (embedding similarity)
- [x] Semantic reranker initialized (BGE‑Reranker)
- [x] Tag‑aware reranker implemented
- [x] Token‑aware context packing (8192 max)
- [x] Strict system prompt enforced

## D. API Layer
- [x] `/query` returns strict JSON schema
- [x] `/ingest` triggers ingestion
- [x] `/health` exposes version, models, config
- [x] FastAPI server starts cleanly
- [x] Uvicorn hot‑reload works

## E. CIC Integration
- [x] TypeScript SDK generated
- [x] CIC agent manifest created
- [x] Agent wrapper added to CIC graph
- [x] CIC orchestrator checks TorqueQuery before remote LLM
- [x] CIC autoscheduler rule added (nightly ingestion)

## F. Determinism & Stability
- [x] All model versions pinned
- [x] All chunking parameters pinned
- [x] All retrieval parameters pinned
- [x] JSON schema locked
- [x] Snapshot tests added

## G. Smoke Test
- [x] `make ingest` runs successfully
- [x] `make serve` starts server
- [x] `/health` returns healthy
- [x] `/query` returns valid JSON
- [x] CIC agent successfully resolves a real doc question

## H. Pre-Decision Hardening (2026-07-17)
- [x] Snapshot/determinism tests for `format_json_answer()` and `pack_context()`
      (`tests/test_query_snapshot.py`)
- [x] `make smoke` / `make ci` end-to-end harness (`scripts/smoke.py`) +
      `.github/workflows/torque-query-docs-smoke.yml`
- [x] Structured ingest logging, rerank decision logging, `GET /metrics`
- [x] `response_model` on `/query` and `/ingest`, structured `/ingest` error handling
      and precondition validation
- [x] Isolated CIC-facing TS client draft (`clients/ts/TorqueQueryDocsClient.ts`)

See `HARDENING-NOTES.md` for details. Tier 1 decision APPROVED 2026-07-17
(Option i, split and rename) -- this service is named `torque-query-docs`
going forward.
