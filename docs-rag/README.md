# TorqueQuery (Phase-26 Local Knowledge Engine)

TorqueQuery is a deterministic, offline, zero-token RAG subsystem designed to provide documentation intelligence for Conversational Intelligence Core (CIC) and Rewrite Labs agents.

It ingests MkDocs repositories, parses hierarchical navigation configurations, extracts page metadata (front-matter titles and tags), and executes a three-stage retrieval/reranking pipeline before synthesizing structured JSON answers using a local Ollama LLM.

---

## Architecture Blueprint

```
MkDocs Source (docs/, mkdocs.yml)
             │
             ▼
Ingestion Loader & YAML Parser
             │
             ▼
Deterministic Sentence Chunker
             │
             ▼
ChromaDB persistent collection (storage/chroma/)
             │
             ▲   1. Dense Retrieval (Similarity Search)
             │   2. Cross-Encoder Rerank (BAAI/bge-reranker-v2-m3)
             │   3. Section Hierarchy & Tag-Aware Boosting
             │
FastAPI API / Query CLI ────▶ Token-aware Context Packer ────▶ Ollama LLM ────▶ Strict JSON Response
```

---

## Setup & Installation

### 1. Prerequisites
- **Python**: 3.10+
- **Ollama**: Download and run Ollama locally. Pull the required models:
  ```bash
  ollama pull llama3.1
  ollama pull nomic-embed-text
  ```

### 2. Install Dependencies
Install the package locally in editable mode:
```bash
pip install -e .
```

### 3. Verify Configuration
Check `config/settings.yaml` to adjust models, paths, and retrieval parameters:
```yaml
version: "0.1.0-alpha"
models:
  llm: "llama3.1:8b"
  embedding: "nomic-embed-text"
  reranker: "BAAI/bge-reranker-v2-m3"
paths:
  docs_root: "../docs"
  chroma_dir: "./storage/chroma"
```

---

## Operating Runbook

### Run Ingestion CLI
Scans markdown files under `docs_root`, maps files to `mkdocs.yml` navigation headers, extracts YAML tags, embeds content, and populates the vector store:
```bash
python -m scripts.ingest
```

### Run Query CLI
Executes dense search, Cross-Encoder reranking, metadata boosting, token packing, and prints the strict JSON answer payload:
```bash
python -m scripts.query "What is the agent design guide routing rule?" --tags "cic, agents"
```

### Start File-System Watcher
Monitors the `docs_root` folder for any `.md` or `.yml` updates and automatically triggers ingestion (debounced at 3 seconds):
```bash
python -m scripts.watch_docs
```

### Start API Server
Launches the FastAPI HTTP endpoint layer locally:
```bash
python -m src.main
```
*(By default runs on `http://127.0.0.1:8000`)*

---

## API Documentation

### `POST /query`
**Request Body**:
```json
{
  "question": "What does Phase 26 do?",
  "taskLabels": ["cic", "torquequery"]
}
```

**Response Payload**:
```json
{
  "answer": "Phase-26 is the TorqueQuery subsystem representing a local, offline, deterministic knowledge resolver...",
  "sources": [
    {
      "file": "roadmap/MASTER_ROADMAP_v3.0.md",
      "section": "Shared Systems > TorqueQuery",
      "tags": ["roadmap", "architecture", "cic", "version-30"],
      "score": 0.9421
    }
  ],
  "confidence": 0.94,
  "not_in_docs": false
}
```

### `POST /ingest`
Re-runs the ingestion pipeline and reloads the active vector index.

### `GET /health`
Returns service health, version, loaded model tags, and context configurations.

---

## TypeScript SDK Usage

The client SDK is located under `src/sdk/`. To query TorqueQuery in a Node/TypeScript environment:

```typescript
import { TorqueQueryClient } from "./src/sdk/client";

const client = new TorqueQueryClient({ baseUrl: "http://localhost:8000" });

async function queryDocs() {
  const response = await client.resolveDocs(
    "How do we handle state naming conventions?",
    ["cic", "governance"]
  );

  console.log("Answer:", response.answer);
  console.log("Sources:", response.sources);
  console.log("Confidence:", response.confidence);
}
```
