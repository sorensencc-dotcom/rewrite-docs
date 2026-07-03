#!/usr/bin/env bash
set -euo pipefail

echo "[build-docs] Cleaning output directory..."
rm -rf out/docs out/roadmap
mkdir -p out/docs/roadmap out/roadmap

echo "[build-docs] Copying roadmap markdown files..."
cp -v ../docs/roadmap/*.md out/docs/roadmap/ || true

echo "[build-docs] Linting markdown files..."
if command -v markdownlint &> /dev/null; then
  markdownlint --config .markdownlint.json out/docs/roadmap/*.md || {
    echo "[WARNING] Some markdown lint issues (non-fatal)"
  }
else
  echo "[WARNING] markdownlint not found, skipping lint"
fi

echo "[build-docs] Compiling roadmap dependency graph..."
node compile.js > out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json

echo "[build-docs] Copying compiled graph to docs/roadmap/"
cp out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json ../docs/roadmap/

echo "[build-docs] Done."
