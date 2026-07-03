import logging
from src.utils.config import load_config
from src.utils.logging import setup_logging
from src.ingestion.loader import load_documents_with_tags
from src.ingestion.chunker import chunk_documents
from src.ingestion.indexer import build_storage, build_index, configure_models

def main():
    setup_logging()
    logger = logging.getLogger("torquequery.cli.ingest")
    cfg = load_config()

    logger.info("Initializing models...")
    configure_models(
        llm_model=cfg["models"]["llm"],
        embed_model=cfg["models"]["embedding"]
    )

    logger.info(f"Loading docs from directory: {cfg['paths']['docs_root']}...")
    docs = load_documents_with_tags(cfg["paths"]["docs_root"])
    logger.info(f"Loaded {len(docs)} markdown files.")

    if not docs:
        logger.error("Aborting: No markdown files found to ingest.")
        return

    logger.info("Chunking documents into nodes...")
    nodes = chunk_documents(
        docs,
        cfg["chunking"]["chunk_size"],
        cfg["chunking"]["chunk_overlap"]
    )
    logger.info(f"Generated {len(nodes)} chunks.")

    logger.info(f"Configuring vector storage at: {cfg['paths']['chroma_dir']}...")
    storage_context = build_storage(cfg["paths"]["chroma_dir"])

    logger.info("Indexing chunks and writing to ChromaDB persistent collection...")
    build_index(nodes, storage_context)
    logger.info("Ingestion finished successfully.")

if __name__ == "__main__":
    main()
