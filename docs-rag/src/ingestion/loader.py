import re
import yaml
from pathlib import Path
from llama_index.core import Document
from src.utils.paths import resolve_path

FRONT_MATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)

def extract_front_matter(text: str) -> tuple[dict, str]:
    """Extracts YAML front-matter from the start of a string.
    Normalizes line endings to prevent matching failures.
    Returns:
        tuple: (metadata_dict, body_text)
    """
    text_normalized = text.replace("\r\n", "\n")
    m = FRONT_MATTER_RE.match(text_normalized)
    if not m:
        return {}, text
    try:
        meta = yaml.safe_load(m.group(1)) or {}
        match_len = len(m.group(0))
        body = text_normalized[match_len:]
        return meta, body
    except Exception:
        return {}, text

def flatten_nav(nav, parents=None, mapping=None) -> dict:
    """Recursively flattens MkDocs nav structure to map file paths to section hierarchies."""
    if mapping is None:
        mapping = {}
    if parents is None:
        parents = []

    if isinstance(nav, list):
        for item in nav:
            flatten_nav(item, parents, mapping)
    elif isinstance(nav, dict):
        for title, value in nav.items():
            if isinstance(value, str):
                normalized_key = value.replace("\\", "/")
                mapping[normalized_key] = parents + [title]
            else:
                flatten_nav(value, parents + [title], mapping)
    return mapping

def load_mkdocs_nav(mkdocs_yaml_path: Path) -> dict:
    """Loads and flattens navigation map from mkdocs.yml if it exists."""
    if not mkdocs_yaml_path.exists():
        return {}
    try:
        with mkdocs_yaml_path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        nav = data.get("nav", [])
        return flatten_nav(nav)
    except Exception:
        return {}

def load_documents_with_tags(docs_root: str) -> list[Document]:
    """Scans and loads all markdown files in docs_root, attaching hierarchy maps and tags.
    Returns a list of LlamaIndex Document instances.
    """
    docs_path = resolve_path(docs_root).resolve()
    
    # Locate mkdocs.yml in docs_root's parent
    mkdocs_yaml_path = docs_path.parent / "mkdocs.yml"
    nav_map = load_mkdocs_nav(mkdocs_yaml_path)
    
    docs = []
    for path in docs_path.rglob("*.md"):
        if not path.is_file():
            continue
        try:
            raw = path.read_text(encoding="utf-8")
        except Exception:
            continue
            
        meta, body = extract_front_matter(raw)
        
        # Standardize relative path key
        rel_path = path.relative_to(docs_path).as_posix()
        
        # Resolve section mapping
        hierarchy = nav_map.get(rel_path)
        if not hierarchy:
            # Fallback to subdirectory names
            hierarchy = [p.name for p in path.parents if p != docs_path and p.is_relative_to(docs_path)]
            hierarchy.reverse()
            
        title = meta.get("title", path.stem.replace("-", " ").replace("_", " ").title())
        tags = meta.get("tags", [])
        if not isinstance(tags, list):
            tags = [tags] if tags else []
            
        docs.append(
            Document(
                text=body,
                metadata={
                    "file_path": rel_path,
                    "tags": [str(t) for t in tags],
                    "title": str(title),
                    "mkdocs_section": hierarchy,
                    "mkdocs_path": " > ".join(hierarchy) if hierarchy else "Home"
                },
            )
        )
    return docs
