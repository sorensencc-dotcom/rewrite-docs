from typing import Dict, Any, List

def rrf_fuse(local_results: List[Dict[str, Any]], notebooklm_results: List[Dict[str, Any]], rrf_constant: int = 60, notebooklm_weight: float = 1.0) -> List[Dict[str, Any]]:
    """
    Fuses two lists of retrieval results using Reciprocal Rank Fusion (RRF).
    Funnels and normalizes local sources and notebook results.
    """
    scores: Dict[str, float] = {}
    items: Dict[str, Dict[str, Any]] = {}

    # Helper to calculate rank scores
    def add_results(results_list: List[Dict[str, Any]], weight: float):
        for rank, res in enumerate(results_list):
            # Unique key per chunk body to merge duplicates/near duplicates
            body = res.get("body") or res.get("text") or ""
            chunk_id = res.get("chunk_id") or res.get("file") or res.get("section") or f"doc_{hash(body)}"
            
            if chunk_id not in scores:
                scores[chunk_id] = 0.0
                # Standardize shape
                items[chunk_id] = {
                    "chunk_id": chunk_id,
                    "body": body,
                    "importance": res.get("importance") or res.get("score") or 0.5,
                    "namespace": res.get("namespace", "unknown"),
                    "provenance": res.get("provenance") or {
                        "source": res.get("file", "local"),
                        "section": res.get("section", "")
                    }
                }
            
            scores[chunk_id] += weight * (1.0 / (rrf_constant + rank + 1))

    # Add both paths
    add_results(local_results, 1.0)
    add_results(notebooklm_results, notebooklm_weight)

    # Sort by fused score
    sorted_keys = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
    fused_results = []
    for k in sorted_keys:
        item = items[k]
        item["fused_score"] = float(scores[k])
        fused_results.append(item)

    return fused_results
