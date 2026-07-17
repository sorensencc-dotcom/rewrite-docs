import sys
import os
import time

# Ensure project root is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.config import load_config
from src.utils.metrics import log_metric
from src.ingestion.loader import load_documents
from src.ingestion.chunker import chunk_documents
from src.ingestion.indexer import configure_models, build_storage, build_index


def main():
    """
    Run a full ingestion pass (docs -> chunks -> embeddings -> Chroma index).

    Emits structured JSONL events to storage/metrics/metrics.jsonl (same convention
    as src/utils/metrics.log_metric) for: ingest start, doc/node counts, duration,
    and errors -- so a real ingestion run is traceable after the fact.
    """
    start_time = time.time()
    log_metric("ingest.start", 0.0, {})

    try:
        cfg = load_config()
        configure_models(cfg["models"]["llm"], cfg["models"]["embedding"])

        docs = load_documents(cfg["paths"]["docs_root"], cfg["paths"]["mkdocs_yml"])
        log_metric("ingest.documents_loaded", (time.time() - start_time) * 1000, {
            "docCount": len(docs),
        })

        nodes = chunk_documents(docs, cfg["chunking"]["chunk_size"], cfg["chunking"]["chunk_overlap"])
        log_metric("ingest.chunked", (time.time() - start_time) * 1000, {
            "docCount": len(docs),
            "nodeCount": len(nodes),
            "chunkSize": cfg["chunking"]["chunk_size"],
            "chunkOverlap": cfg["chunking"]["chunk_overlap"],
        })

        storage = build_storage(cfg["paths"]["chroma_dir"])
        build_index(nodes, storage)

        duration_ms = (time.time() - start_time) * 1000
        log_metric("ingest.complete", duration_ms, {
            "docCount": len(docs),
            "nodeCount": len(nodes),
        })
        print(f"[ingest] Ingested {len(docs)} docs / {len(nodes)} chunks in {duration_ms:.0f}ms", flush=True)
        return {"docCount": len(docs), "nodeCount": len(nodes), "durationMs": round(duration_ms, 2)}
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_metric("ingest.error", duration_ms, {
            "errorType": type(e).__name__,
            "errorMessage": str(e),
        })
        print(f"[ingest] FAILED after {duration_ms:.0f}ms: {type(e).__name__}: {e}", flush=True)
        raise


if __name__ == "__main__":
    main()
