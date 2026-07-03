#!/usr/bin/env bash
set -euo pipefail

echo "[validate-docs] Validating roadmap schema..."
node validate-schema.js \
  --schema schemas/roadmap.schema.json \
  --docs out/docs/roadmap

echo "[validate-docs] Validating phase configs..."
node validate-phases.js \
  --schema schemas/phase.schema.json \
  --phases ../roadmap-runner/phases

echo "[validate-docs] Running drift detection..."
node drift-detector.js \
  --graph out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json \
  --roadmaps ../docs/roadmap

echo "[validate-docs] All validation passed."
