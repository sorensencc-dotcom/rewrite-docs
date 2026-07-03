import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from src.utils.config import load_config
from src.utils.logging import setup_logging
from src.rag.engine import init_query_engine, answer
from src.ingestion.loader import load_documents_with_tags
from src.ingestion.chunker import chunk_documents
from src.ingestion.indexer import build_storage, build_index, configure_models

# Initialize logging
setup_logging()
logger = logging.getLogger("torquequery.api")

cfg = load_config()

# Global query engine (index) reference
query_engine = init_query_engine(cfg)

app = FastAPI(
    title="TorqueQuery Local Knowledge Engine",
    version=cfg.get("version", "0.1.0-alpha")
)

# Enable CORS for local cross-origin calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    task_labels: Optional[List[str]] = Field(default=None, alias="taskLabels")

    class Config:
        populate_by_name = True

def run_ingestion_internal():
    """Runs the ingestion pipeline end-to-end."""
    logger.info("Starting ingestion pipeline...")
    
    # Configure llama-index settings
    configure_models(
        llm_model=cfg["models"]["llm"],
        embed_model=cfg["models"]["embedding"]
    )
    
    # 1. Load documents
    docs = load_documents_with_tags(cfg["paths"]["docs_root"])
    logger.info(f"Loaded {len(docs)} documents from {cfg['paths']['docs_root']}.")
    
    if not docs:
        raise ValueError(f"No markdown documents found in {cfg['paths']['docs_root']}")
        
    # 2. Chunk documents
    nodes = chunk_documents(
        docs,
        cfg["chunking"]["chunk_size"],
        cfg["chunking"]["chunk_overlap"]
    )
    logger.info(f"Created {len(nodes)} document chunks.")
    
    # 3. Persist to storage
    storage_context = build_storage(cfg["paths"]["chroma_dir"])
    build_index(nodes, storage_context)
    logger.info("Ingestion completed and vector index persisted.")

@app.post("/query")
def query(req: QueryRequest):
    """Answers documentation query using local RAG flow."""
    if query_engine is None:
        raise HTTPException(
            status_code=503,
            detail="TorqueQuery index not initialized. Trigger /ingest to index docs first."
        )
    try:
        ans = answer(cfg, query_engine, req.question, req.task_labels)
        return ans
    except Exception as e:
        logger.exception("Error during query resolution")
        raise HTTPException(status_code=500, detail=f"Query error: {str(e)}")

@app.post("/ingest")
def ingest():
    """Rebuilds the persistent vector index from source documentation."""
    global query_engine
    try:
        run_ingestion_internal()
        # Reload index
        query_engine = init_query_engine(cfg)
        return {"status": "ok", "message": "Ingestion pipeline executed successfully. Index reloaded."}
    except Exception as e:
        logger.exception("Error during ingestion pipeline execution")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    """Returns service health status, versions, and configuration limits."""
    return {
        "status": "healthy" if query_engine is not None else "degraded",
        "version": cfg.get("version", "0.1.0-alpha"),
        "models": {
            "llm": cfg["models"]["llm"],
            "embedding": cfg["models"]["embedding"],
            "reranker": cfg["models"]["reranker"]
        },
        "config": {
            "chunkSize": cfg["chunking"]["chunk_size"],
            "chunkOverlap": cfg["chunking"]["chunk_overlap"],
            "topK": cfg["retrieval"]["top_k"],
            "maxContextTokens": cfg["retrieval"]["max_context_tokens"]
        }
    }
