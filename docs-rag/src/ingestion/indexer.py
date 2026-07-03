import chromadb
from pathlib import Path
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext, VectorStoreIndex, Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from src.utils.paths import resolve_path

def configure_models(llm_model: str, embed_model: str, base_url: str = "http://localhost:11434"):
    """Configures llama-index Settings globally for Ollama generation and embeddings."""
    Settings.llm = Ollama(
        model=llm_model,
        base_url=base_url,
        request_timeout=60.0
    )
    Settings.embed_model = OllamaEmbedding(
        model_name=embed_model,
        base_url=base_url
    )

def build_storage(chroma_dir: str):
    """Initializes and resolves ChromaDB persistent storage client and collection."""
    abs_chroma_dir = resolve_path(chroma_dir)
    abs_chroma_dir.mkdir(parents=True, exist_ok=True)
    
    # Persistent Chroma client
    db = chromadb.PersistentClient(path=str(abs_chroma_dir))
    chroma_collection = db.get_or_create_collection("torquequery_docs")
    
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    return storage_context

def build_index(nodes, storage_context) -> VectorStoreIndex:
    """Builds VectorStoreIndex from document nodes and persists storage context."""
    index = VectorStoreIndex.from_nodes(
        nodes,
        storage_context=storage_context,
    )
    return index
