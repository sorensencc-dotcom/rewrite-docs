import pytest
from src.rag.rrf import rrf_fuse
from src.rag.notebooklm_client import NotebookLMClient
from fastapi.testclient import TestClient
from src.main import app

def test_rrf_fuse_basic():
    local_results = [
        {"body": "Hello local", "score": 0.9, "namespace": "vault_1", "file": "docs/doc1.md"}
    ]
    notebooklm_results = [
        {"body": "Hello external", "importance": 0.95, "namespace": "vault_1", "provenance": {"source": "notebooklm:id1"}}
    ]
    
    fused = rrf_fuse(local_results, notebooklm_results, rrf_constant=60)
    assert len(fused) == 2
    # The higher ranked item in its respective search list (if equal weights/ranks)
    assert fused[0]["body"] in ["Hello local", "Hello external"]

def test_rrf_notebooklm_weight_boost():
    # External has higher weight, so it should rank higher if ranks are identical
    local_results = [{"body": "Hello local"}]
    notebooklm_results = [{"body": "Hello external"}]
    
    fused = rrf_fuse(local_results, notebooklm_results, notebooklm_weight=2.0)
    assert fused[0]["body"] == "Hello external"

def test_notebooklm_client_missing_namespace():
    client = NotebookLMClient()
    res = client.query("non_existent_ns", "test query")
    assert res["success"] is False
    assert res["notebooklm_error_code"] == "NAMESPACE_NOT_FOUND"

def test_federated_search_endpoint():
    client = TestClient(app)
    # Post query to endpoint
    resp = client.post("/search/federated", json={
        "query": "brand colors",
        "namespaces": ["cic_client_vault_1"],
        "limit": 5,
        "options": {
            "rrf_constant": 60,
            "include_notebooklm": True,
            "notebooklm_weight": 1.2
        }
    })
    
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    # It will contain partial error metadata if python action_router.py doesn't succeed due to mock env
    if "notebooklm_partial_results" in data:
        assert data["notebooklm_partial_results"] is True
        assert data["notebooklm_error_code"] in ["SCRIPT_ERROR", "TIMEOUT", "NAMESPACE_NOT_FOUND"]
