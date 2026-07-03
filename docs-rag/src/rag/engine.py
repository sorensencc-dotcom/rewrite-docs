import math
import logging
import tiktoken
from llama_index.core import load_index_from_storage, Settings
from src.ingestion.indexer import build_storage, configure_models
from src.rag.prompts import build_prompt

logger = logging.getLogger("torquequery.engine")

_RERANKER = None

def get_reranker(model_name: str):
    """Lazily loads the sentence-transformers CrossEncoder for semantic reranking."""
    global _RERANKER
    if _RERANKER is None:
        logger.info(f"Loading CrossEncoder reranker model: {model_name}...")
        from sentence_transformers import CrossEncoder
        _RERANKER = CrossEncoder(model_name)
    return _RERANKER

def init_query_engine(cfg):
    """Initializes the vector storage and loads the persisted index.
    Returns the loaded index, or None if the storage is empty/not ingested yet.
    """
    configure_models(
        llm_model=cfg["models"]["llm"],
        embed_model=cfg["models"]["embedding"]
    )
    try:
        storage = build_storage(cfg["paths"]["chroma_dir"])
        index = load_index_from_storage(storage)
        logger.info("Persisted vector index loaded successfully.")
        return index
    except Exception as e:
        logger.warning(f"Could not load persisted index (it may not be built yet): {e}")
        return None

def sigmoid(x: float) -> float:
    """Applies sigmoid function to map CrossEncoder scores to 0-1 range."""
    try:
        return 1 / (1 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0

def rerank_nodes(question: str, source_nodes, top_k: int, model_name: str) -> list:
    """Stage 2: Cross-Encoder semantic reranker."""
    if not source_nodes:
        return []
    
    reranker = get_reranker(model_name)
    pairs = [(question, sn.node.text) for sn in source_nodes]
    scores = reranker.predict(pairs)
    
    # Assign sigmoid-normalized scores to the retrieved nodes
    for sn, raw_score in zip(source_nodes, scores):
        sn.score = float(sigmoid(raw_score))
        
    ranked = sorted(
        source_nodes,
        key=lambda x: x.score,
        reverse=True,
    )
    return ranked[:top_k]

def apply_section_boost(nodes_with_score, question: str) -> list:
    """Stage 3a: Boost nodes whose section hierarchy matches keywords in the question."""
    for sn in nodes_with_score:
        score = sn.score or 0.0
        section_path = sn.node.metadata.get("mkdocs_path", "")
        
        # Exact/partial matches in query string
        if section_path and section_path.lower() in question.lower():
            score *= 1.2
        else:
            section_list = sn.node.metadata.get("mkdocs_section", [])
            for segment in section_list:
                if segment.lower() in question.lower():
                    score *= 1.15
                    break
        sn.score = score
    return nodes_with_score

def tag_overlap_score(node_tags, task_labels) -> float:
    """Computes Jaccard-like overlap ratio between node tags and query task labels."""
    if not node_tags or not task_labels:
        return 0.0
    node_set = set(t.lower() for t in node_tags)
    task_set = set(l.lower() for l in task_labels)
    overlap = node_set & task_set
    return float(len(overlap)) / float(len(task_set))

def apply_tag_boost(nodes_with_score, task_labels: list, base_weight: float = 1.0, tag_boost: float = 0.3) -> list:
    """Stage 3b: Boost nodes whose tags overlap with the CIC task labels."""
    if not task_labels:
        return nodes_with_score
        
    for sn in nodes_with_score:
        node_tags = sn.node.metadata.get("tags", [])
        overlap = tag_overlap_score(node_tags, task_labels)
        sn.score = (sn.score or 0.0) * (base_weight + tag_boost * overlap)
    return nodes_with_score

def count_tokens(text: str) -> int:
    """Estimates the token count of a text string using tiktoken."""
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        # Fallback approximation: ~4 chars per token
        return len(text) // 4

def pack_context(chunks: list, max_tokens: int, reserved: int = 1024) -> list:
    """Greedily packs retrieved chunks within the context token budget."""
    budget = max_tokens - reserved
    included = []
    used = 0
    
    for c in chunks:
        t = count_tokens(c["text"])
        if used + t > budget:
            break
        included.append(c)
        used += t
        
    return included

def build_context_from_nodes(nodes, max_tokens: int) -> tuple[str, list]:
    """Sorts nodes by final score, extracts texts, packs within budget, and returns formatted context."""
    chunks = [
        {
            "text": n.node.text,
            "score": float(n.score or 0.0),
            "meta": n.node.metadata
        }
        for n in nodes
    ]
    # Sort chunks by boosted score descending
    chunks.sort(key=lambda c: c["score"], reverse=True)
    
    packed = pack_context(chunks, max_tokens)
    
    # Format with clear source markings
    formatted_texts = []
    for c in packed:
        source_path = c["meta"].get("mkdocs_path", "Home")
        file_name = c["meta"].get("file_path", "unknown")
        formatted_texts.append(f"### Source: {file_name} ({source_path})\n{c['text']}")
        
    return "\n\n---\n\n".join(formatted_texts), packed

def format_json_answer(answer_text: str, packed_chunks: list, not_in_docs: bool) -> dict:
    """Formats the final response object conforming to the strict JSON schema."""
    sources = []
    for c in packed_chunks:
        sources.append({
            "file": c["meta"].get("file_path", "unknown"),
            "section": c["meta"].get("mkdocs_path", "Home"),
            "tags": c["meta"].get("tags", []),
            "score": float(round(c["score"], 4))
        })
        
    # Heuristic confidence based on top-1 chunk score if available
    confidence = 0.0
    if not not_in_docs and packed_chunks:
        # Average score of included chunks, clamped to [0.1, 1.0]
        avg_score = sum(c["score"] for c in packed_chunks) / len(packed_chunks)
        confidence = min(1.0, max(0.1, float(round(avg_score, 2))))
        
    return {
        "answer": answer_text,
        "sources": sources,
        "confidence": confidence,
        "not_in_docs": not_in_docs
    }

def answer(cfg, index, question: str, task_labels: list = None) -> dict:
    """Executes the complete query resolution pipeline."""
    if index is None:
        return format_json_answer(
            answer_text="Index is not initialized. Please trigger ingestion via /ingest first.",
            packed_chunks=[],
            not_in_docs=True
        )
        
    # Stage 1: Dense Retrieval (fetch 3x top_k to allow reranking range)
    retriever = index.as_retriever(similarity_top_k=cfg["retrieval"]["top_k"] * 3)
    source_nodes = retriever.retrieve(question)
    
    if not source_nodes:
        return format_json_answer(
            answer_text="No relevant context found in documentation.",
            packed_chunks=[],
            not_in_docs=True
        )
        
    # Stage 2: Semantic Reranking (BAAI/bge-reranker-v2-m3)
    reranker_model = cfg["models"]["reranker"]
    reranked_nodes = rerank_nodes(question, source_nodes, cfg["retrieval"]["top_k"] * 2, reranker_model)
    
    # Stage 3a: Section Hierarchy Boosting
    boosted_nodes = apply_section_boost(reranked_nodes, question)
    
    # Stage 3b: Tag-Aware Boosting
    boosted_nodes = apply_tag_boost(boosted_nodes, task_labels or [])
    
    # Stage 4: Context Window Packing
    max_tokens = cfg["retrieval"]["max_context_tokens"]
    context_str, packed_chunks = build_context_from_nodes(boosted_nodes, max_tokens)
    
    if not packed_chunks:
        return format_json_answer(
            answer_text="Context budget exceeded or no nodes packed.",
            packed_chunks=[],
            not_in_docs=True
        )
        
    # Stage 5: Answer Generation (Ollama)
    prompt = build_prompt(context_str, question)
    
    try:
        llm = Settings.llm
        response = llm.complete(prompt)
        response_text = str(response).strip()
    except Exception as e:
        logger.error(f"Error during Ollama generation: {e}")
        return format_json_answer(
            answer_text=f"Failed to query Ollama model: {e}",
            packed_chunks=packed_chunks,
            not_in_docs=False
        )
        
    # Stage 6: Analyze response for Not-in-Docs indicator
    not_in_docs_indicators = [
        "not found in the provided context",
        "not in the docs",
        "is not mentioned",
        "does not contain",
        "no information",
        "i cannot find",
        "not provided"
    ]
    not_in_docs = any(ind in response_text.lower() for ind in not_in_docs_indicators)
    
    return format_json_answer(response_text, packed_chunks, not_in_docs)
