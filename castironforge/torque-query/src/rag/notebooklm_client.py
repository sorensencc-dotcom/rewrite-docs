import yaml
import os
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, List

# Load notebooks configuration
CONFIG_PATH = Path("C:/dev/castironforge/cic-ingestion/config/cic_notebooks.yaml")

def load_notebooks_config() -> Dict[str, Any]:
    if not CONFIG_PATH.exists():
        return {"authuser_index": 2, "notebook_mappings": {}}
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)

class NotebookLMClient:
    """
    Python interface to call the NotebookLM skill's action_router.py.
    """
    def __init__(self, skill_scripts_path: str = "C:/dev/claude-skills/integrations/antigravity/notebooklm/scripts"):
        self.skill_scripts_path = skill_scripts_path
        self.notebooks_config = load_notebooks_config()

    def query(self, namespace: str, question: str, timeout: float = 15.0) -> Dict[str, Any]:
        notebook_id = self.notebooks_config.get("notebook_mappings", {}).get(namespace)
        if not notebook_id:
            return {
                "success": False,
                "error": f"Namespace '{namespace}' not found in cic_notebooks.yaml",
                "notebooklm_error_code": "NAMESPACE_NOT_FOUND"
            }
        
        authuser = self.notebooks_config.get("authuser_index", 2)
        notebook_url = f"https://notebooklm.google.com/notebook/{notebook_id}?authuser={authuser}"
        
        action_router = os.path.join(self.skill_scripts_path, "action_router.py")
        cmd = [
            "python", action_router,
            "--action", "read_extract",
            "--notebook", notebook_url,
            "--question", question,
            "--output", "json"
        ]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            if res.returncode != 0:
                return {
                    "success": False,
                    "error": f"action_router.py failed: {res.stderr.strip()}",
                    "notebooklm_error_code": "SCRIPT_ERROR"
                }
            
            parsed = json.loads(res.stdout)
            # Normalize response matching spec §5.1 / §4
            # We map it to a simulated chunk
            answer_text = parsed.get("parameters", {}).get("question", "(no answer extracted)")
            
            return {
                "success": True,
                "results": [
                    {
                        "chunk_id": f"nb_chunk_{notebook_id[:8]}",
                        "body": answer_text,
                        "importance": 0.9,
                        "namespace": namespace,
                        "provenance": {
                            "source": f"notebooklm:{notebook_id}",
                            "timestamp": "2026-07-08T22:00:00Z"
                        },
                        "fused_score": 1.0
                    }
                ]
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"NotebookLM query exceeded timeout budget of {int(timeout*1000)}ms",
                "notebooklm_error_code": "TIMEOUT"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "notebooklm_error_code": "SCRIPT_ERROR"
            }
