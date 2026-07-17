"""
Smoke harness for the documentation RAG service ("torque-query-docs" working name).

Boots the real FastAPI app with uvicorn, waits for /health to report healthy, then
exercises /query and /ingest end-to-end (real HTTP, real subprocess -- not a unit test).

Live-LLM behavior:
  - /health turns "healthy" as soon as the query engine + Chroma index are wired up.
    That does NOT require a reachable Ollama server (embeddings/LLM calls only happen
    at query/ingest time), so the health-check leg of this smoke test is meaningful
    with or without Ollama running.
  - /query and /ingest DO require a reachable Ollama server with the models pinned in
    config/settings.yaml (llm + embedding). This script probes OLLAMA_HOST first: if
    Ollama isn't reachable, it prints a clear warning and SKIPS the /query and /ingest
    live checks rather than failing the whole harness -- this keeps `make smoke` usable
    in CI (no GPU/Ollama available) while still being a real end-to-end check on any
    machine that has Ollama running with the pinned models pulled.

Exit code is non-zero on any failure (server never became healthy, or a live check that
WAS attempted came back non-2xx / with an unexpected shape).
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = os.environ.get("SMOKE_HOST", "127.0.0.1")
PORT = int(os.environ.get("SMOKE_PORT", "8000"))
BASE_URL = f"http://{HOST}:{PORT}"
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
HEALTH_TIMEOUT_S = int(os.environ.get("SMOKE_HEALTH_TIMEOUT", "60"))


def _http_json(method, url, payload=None, timeout=10):
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, (json.loads(body) if body else None)
    except urllib.error.HTTPError as e:
        # Non-2xx still carries a structured JSON error body (post-hardening) -- surface
        # it instead of swallowing it behind a bare "HTTP Error 500" message.
        raw = e.read().decode("utf-8") if e.fp else ""
        try:
            body = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            body = raw
        return e.code, body


def _ollama_reachable():
    try:
        with urllib.request.urlopen(f"{OLLAMA_HOST}/api/tags", timeout=3):
            return True
    except Exception:
        return False


def wait_for_health(timeout_s):
    # Cold start loads torch/sentence-transformers/chroma synchronously in a worker
    # thread; that CPU-heavy work commonly stalls the whole process under the GIL for
    # 20-50s on a modest machine, so give each individual poll real headroom too (a
    # short per-request timeout here causes false "timed out" reads while init is
    # still legitimately in progress, not a real outage).
    deadline = time.time() + timeout_s
    last_error = None
    while time.time() < deadline:
        try:
            status, body = _http_json("GET", f"{BASE_URL}/health", timeout=15)
            if status == 200 and body and body.get("status") == "healthy":
                print(f"[smoke] /health healthy: {body}")
                return body
            last_error = body
        except Exception as e:
            last_error = e
        time.sleep(1.0)
    raise RuntimeError(f"Service did not become healthy within {timeout_s}s (last: {last_error})")


def check_query():
    # CPU-only Ollama completion for a small model still commonly takes 1-3 minutes
    # end to end (embedding + rerank + generation) -- give it real headroom.
    status, body = _http_json(
        "POST",
        f"{BASE_URL}/query",
        {"question": "What is the retrieval top_k configured for this service?"},
        timeout=int(os.environ.get("SMOKE_QUERY_TIMEOUT", "300")),
    )
    if status != 200:
        raise RuntimeError(f"/query returned status {status}: {body}")
    expected_keys = {"answer", "sources", "confidence", "not_in_docs"}
    missing = expected_keys - set(body.keys())
    if missing:
        raise RuntimeError(f"/query response missing expected keys: {missing} (body={body})")
    print(f"[smoke] /query OK: confidence={body.get('confidence')} not_in_docs={body.get('not_in_docs')}")


def check_ingest():
    # /ingest re-embeds the FULL configured docs corpus (hundreds of files in this repo's
    # case) -- on CPU-only Ollama this can take many minutes. SMOKE_SKIP_INGEST=1 lets a
    # developer run a fast `make smoke` (health + query only) without paying that cost
    # every time; the full-corpus reingest is still exercised by default per the brief.
    if os.environ.get("SMOKE_SKIP_INGEST") == "1":
        print("[smoke] SMOKE_SKIP_INGEST=1 -- skipping /ingest live check.")
        return
    status, body = _http_json(
        "POST",
        f"{BASE_URL}/ingest",
        timeout=int(os.environ.get("SMOKE_INGEST_TIMEOUT", "900")),
    )
    if status != 200:
        raise RuntimeError(f"/ingest returned status {status}: {body}")
    if not body or "status" not in body:
        raise RuntimeError(f"/ingest response missing expected 'status' key (body={body})")
    print(f"[smoke] /ingest OK: {body}")


def main():
    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "src.main:app",
            "--host",
            HOST,
            "--port",
            str(PORT),
        ],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    failures = []
    try:
        try:
            wait_for_health(HEALTH_TIMEOUT_S)
        except Exception as e:
            failures.append(str(e))
        else:
            if _ollama_reachable():
                for name, fn in (("query", check_query), ("ingest", check_ingest)):
                    try:
                        fn()
                    except Exception as e:
                        failures.append(f"{name}: {e}")
            else:
                print(
                    f"[smoke] WARNING: Ollama not reachable at {OLLAMA_HOST} -- "
                    "skipping live /query and /ingest checks (health check still ran)."
                )
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=10)

        if proc.stdout:
            output = proc.stdout.read()
            if output:
                print("[smoke] --- server log ---")
                print(output)

    if failures:
        print("[smoke] FAILURES:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)

    print("[smoke] All checks passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()
