from llama_index.core.node_parser import SentenceSplitter

def build_node_parser(chunk_size: int, chunk_overlap: int) -> SentenceSplitter:
    """Builds a LlamaIndex SentenceSplitter parser."""
    return SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

def chunk_documents(documents, chunk_size: int, chunk_overlap: int) -> list:
    """Chunks LlamaIndex Document instances into TextNodes with metadata retained."""
    parser = build_node_parser(chunk_size, chunk_overlap)
    return parser.get_nodes_from_documents(documents)
