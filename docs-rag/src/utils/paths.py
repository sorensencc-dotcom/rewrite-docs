from pathlib import Path

# Project root is the directory containing the 'src' folder
PROJECT_ROOT = Path(__file__).resolve().parents[2]

def resolve_path(path_str: str) -> Path:
    """Resolves a path string to an absolute path.
    If the path is relative, it is resolved relative to the PROJECT_ROOT.
    """
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (PROJECT_ROOT / path).resolve()
