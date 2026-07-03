import yaml
from src.utils.paths import resolve_path

CONFIG_PATH = resolve_path("config/settings.yaml")

def load_config() -> dict:
    """Loads settings from settings.yaml."""
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)
