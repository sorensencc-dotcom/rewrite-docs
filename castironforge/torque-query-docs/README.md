# torque-query-docs

A local, deterministic, MkDocs-aware documentation RAG service.

Named `torque-query-docs` per Tier 1 decision 2026-07-17 (split/rename to
resolve a naming collision with an unrelated memory/drift search service
of the same former name in `cic-ingestion/src/services/torquequery`). See
`docs/meta/phases/torquequery-reconciliation-charter.md` in the main
`C:/dev` repo for the full decision record.

## Installation

```bash
pip install -e .
```

## Usage

1. Ingest docs:
```bash
python scripts/ingest.py
```

2. Run server:
```bash
uvicorn src.main:app --reload
```
