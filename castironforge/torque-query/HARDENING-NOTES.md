# Hardening Notes -- 2026-07-17

Pre-decision production hardening pass on the documentation RAG service in
`castironforge/torque-query`. This service answers questions against ingested
MkDocs content (embeddings + reranking + LLM synthesis) -- it is explicitly
**not** the other (memory-search) TorqueQuery service that lives elsewhere in
this org; the two share a name only because of the 2026-07-10 governance split
that separated TorqueQuery without assigning an owner.

## What changed and why

1. **Snapshot tests for `/query`** (`tests/test_query_snapshot.py`,
   `tests/snapshots/*.json`). The full `/query` HTTP flow calls a live, non-deterministic
   Ollama LLM that isn't available in CI, so these tests snapshot the two pure functions
   that fully determine the response shape given fixed inputs: `format_json_answer()`
   (`src/rag/engine.py`) and `pack_context()` (`src/rag/context.py`). Fixed synthetic
   node objects stand in for real retrieval output, so shape/ordering/determinism are
   locked without needing a real LLM.

2. **Smoke harness** (`scripts/smoke.py`, `make smoke`, `make ci`). Boots the real
   FastAPI app, polls `/health`, then exercises `/query` and `/ingest` over real HTTP.
   `/health` turns healthy without a live Ollama (embeddings/LLM calls only happen at
   query time), so that leg is meaningful everywhere. `/query` and `/ingest` require a
   reachable Ollama with the models pinned in `config/settings.yaml`; the script probes
   Ollama first and skips those two live checks (with a clear warning, not a silent pass)
   when it isn't reachable -- this is what keeps `make smoke` usable in CI (no GPU/Ollama
   there) while still being a real end-to-end check on a dev machine.
   `SMOKE_SKIP_INGEST=1` skips just the `/ingest` leg for fast local iteration, since a
   full run re-embeds the entire configured docs corpus (455 files in this environment)
   and can take many minutes on CPU-only Ollama.
   CI wiring: `.github/workflows/torque-query-docs-smoke.yml` runs `pytest` then
   `scripts/smoke.py` on push/PR touching `castironforge/torque-query/**`. No Ollama is
   provisioned on the GitHub-hosted runner, so the CI run only exercises the
   boot + health leg (still a real regression gate for import errors, config load
   failures, and route-wiring bugs) -- the full live-LLM path is the local/pre-merge
   check, matching the same "can't test the live LLM in CI" constraint noted for the
   snapshot tests above.

   **Real finding from running the full smoke harness locally against real Ollama**:
   `/ingest` failed against the actual docs corpus with a YAML frontmatter parse error
   in `docs/00-EIGHT-ITEM-BUILD-PLAN.md` (unescaped backslash in a quoted scalar). This
   is a pre-existing docs-content bug in the shared `rewrite-docs/docs` tree, unrelated
   to this service and out of scope to fix here -- but it's exactly the kind of failure
   the `/ingest` error-handling hardening (item 4 below) was meant to surface cleanly:
   it now comes back as a structured `500 {"errorCode": "INGESTION_FAILED", ...}` JSON
   body instead of an unhandled traceback.

3. **Observability.**
   - `scripts/ingest.py` now emits structured JSONL events (`ingest.start`,
     `ingest.documents_loaded`, `ingest.chunked`, `ingest.complete`, `ingest.error`) via
     the existing `log_metric()` convention in `src/utils/metrics.py`, so a real
     ingestion run's doc/node counts, duration, and any error are traceable after the
     fact from `storage/metrics/metrics.jsonl`.
   - `src/rag/rerank_semantic.py` and `src/rag/rerank_tags.py` now log (via the stdlib
     `logging` module, matching the codebase's existing style rather than introducing a
     new framework) which nodes were kept vs dropped and their pre/post scores, so a
     real query's rerank decision is traceable.
   - Added `GET /metrics`, distinct from the existing `GET /api/fs/metrics`. Chose to
     reuse `get_metrics_summary()` (JSON counts + p50/p90/p99 latency) rather than adding
     a second Prometheus-text-format exporter, because it already aggregates the same
     `storage/metrics/metrics.jsonl` feed that both the existing HTTP middleware and the
     new ingest logging write to -- one summary covers `/query`, `/ingest`, and the
     ingestion pipeline without maintaining two parallel metrics representations.

4. **Interface hardening** (`src/main.py`).
   - `/query` now has `response_model=QueryResponse` (with a `QuerySource` model for
     each source entry), freezing the schema in OpenAPI instead of returning a raw dict.
   - `/ingest` now has `response_model=IngestResponse` and a documented `IngestErrorResponse`
     for the 400/500 cases, wrapped in try/except so ingestion failures return a clean
     structured JSON error (`errorCode` + `message`) instead of leaking FastAPI's default
     unhandled-exception traceback.
   - `/ingest` takes no request body, but does have real preconditions: it now validates
     that the configured `docs_root` and `mkdocs_yml` exist before attempting ingestion,
     returning a clean `400 DOCS_ROOT_NOT_FOUND` / `MKDOCS_YML_NOT_FOUND` instead of
     failing deep inside the ingestion pipeline.

5. **CIC-facing TypeScript shim** (`clients/ts/TorqueQueryDocsClient.ts`, new folder).
   Typed `query()` / `ingest()` / `health()` client matching the response models frozen
   in item 4. Isolated from `cic-ingestion`'s existing `TorqueQueryClient.ts` (the other,
   memory-search TorqueQuery service, default port 3110) -- not touched, not aliased.
   Header comment: `// Phase 26 SDK draft -- pre-Tier-1-decision, not wired into any
   adapter yet.` Type-checked clean with `tsc --strict` (no build tooling exists yet in
   this repo to wire it into, intentionally -- it's a draft).

## Known pre-existing issue found, not fixed (out of scope)

`tests/test_validation.py::TestFsReadValidation::test_zero_limit_rejected` fails on
main: `validate_fs_read`'s `safe_limit = limit or 50000` treats `limit=0` as falsy and
silently substitutes the default instead of rejecting it. Pre-existing, unrelated to this
hardening pass; flagging rather than fixing since it's outside the five deliverables
scoped for this work.

## Governance

This is pre-decision hardening -- no governance or naming decision was made as part of
this work; see docs/meta/phases/torquequery-reconciliation-charter.md in the main
c:\dev repo for the pending Tier 1 decision.
