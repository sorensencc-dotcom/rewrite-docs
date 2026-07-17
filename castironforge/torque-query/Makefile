.PHONY: ingest serve test watch smoke ci

PYTHON := python3

ingest:
	$(PYTHON) scripts/ingest.py

serve:
	uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

test:
	pytest -q

watch:
	$(PYTHON) scripts/watch.py

# Boots the real server, waits for /health, then exercises /query and /ingest
# end-to-end. See scripts/smoke.py for live-Ollama-detection behavior.
smoke:
	$(PYTHON) scripts/smoke.py

# Full pre-ship gate: unit tests + end-to-end smoke check.
ci: test smoke
