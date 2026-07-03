# TorqueQuery v0.1.0-alpha — Test Suite Specification

This document details the test scenarios, assertions, and verification criteria for testing TorqueQuery components.

---

## 1. Ingestion Tests

### 1.1 MkDocs nav parsing
- **Goal:** Ensure `mkdocs.yml` nav is correctly mapped to `mkdocs_section` / `mkdocs_path`.
- **Cases:**
  - Nested sections (e.g. CIC → System → Phase 3).
  - Flat sections.
  - Mixed lists and dicts.
- **Assertions:**
  - Each document node has correct `mkdocs_section` array.
  - `mkdocs_path` string matches expected "Section > Subsection".

### 1.2 Front-matter extraction
- **Goal:** Ensure YAML front-matter tags and title are extracted.
- **Cases:**
  - With `tags` and `title`.
  - Without front-matter.
  - Invalid YAML.
- **Assertions:**
  - `metadata["tags"]` is list or empty list.
  - `metadata["title"]` falls back to filename when missing.

### 1.3 Chunking determinism
- **Goal:** Ensure chunk boundaries are stable.
- **Cases:**
  - Same input docs, multiple runs.
- **Assertions:**
  - Number of chunks per file is identical across runs.
  - Chunk texts are byte-identical.

---

## 2. Retrieval & Ranking Tests

### 2.1 Dense retrieval sanity
- **Goal:** Ensure relevant docs appear in top-K.
- **Cases:**
  - Query directly referencing a known section.
- **Assertions:**
  - At least one source node from the expected file in top-K.

### 2.2 Semantic reranking effectiveness
- **Goal:** Ensure cross-encoder reranking improves ordering.
- **Cases:**
  - Ambiguous query with multiple candidate docs.
- **Assertions:**
  - Node with semantically closest content ranks higher after rerank.

### 2.3 Tag-aware reranking
- **Goal:** Ensure tags + taskLabels affect ranking deterministically.
- **Cases:**
  - Nodes with tags matching taskLabels.
  - Nodes without matching tags.
- **Assertions:**
  - Matching-tag nodes have higher final scores than non-matching nodes with similar dense scores.
  - Changing `taskLabels` changes ranking in expected direction.

---

## 3. Context Packing Tests

### 3.1 Token budget enforcement
- **Goal:** Ensure context never exceeds `maxContextTokens`.
- **Cases:**
  - Many large chunks.
- **Assertions:**
  - Sum of token counts for included chunks ≤ `maxContextTokens - reserved`.

### 3.2 Deterministic packing
- **Goal:** Ensure same inputs produce same packed context.
- **Cases:**
  - Same nodes, multiple runs.
- **Assertions:**
  - Same chunk ordering and selection across runs.

---

## 4. Answer Schema & Behavior Tests

### 4.1 JSON schema compliance
- **Goal:** Ensure all responses match the locked schema.
- **Assertions:**
  - `answer` is string.
  - `sources` is array of objects with `file`, `section`, `tags`, `score`.
  - `confidence` is number.
  - `not_in_docs` is boolean.

### 4.2 Not-in-docs behavior
- **Goal:** Ensure unknown questions are flagged correctly.
- **Cases:**
  - Query about content not present in any docs.
- **Assertions:**
  - `not_in_docs = true`.
  - `answer` explicitly states that the information is not in the docs.

---

## 5. API & SDK Tests

### 5.1 HTTP API contract
- **Goal:** Ensure `/query`, `/ingest`, `/health` behave as specified.
- **Assertions:**
  - `/query` returns 200 + valid JSON for valid input.
  - `/ingest` completes and updates index.
  - `/health` returns version, models, config.

### 5.2 TypeScript SDK
- **Goal:** Ensure `TorqueQueryClient.resolveDocs` works end-to-end.
- **Assertions:**
  - Correct typing of `DocsRagAnswer`.
  - Proper error handling on non-200 responses.
  - Stable behavior under repeated calls.

---

## 6. Determinism & Regression

### 6.1 Snapshot tests
- **Goal:** Ensure outputs remain stable across versions unless explicitly changed.
- **Method:**
  - Maintain a set of canonical queries + expected JSON outputs.
  - Run snapshot comparison in CI.
- **Assertions:**
  - Any change to outputs must be accompanied by a spec/version bump.
