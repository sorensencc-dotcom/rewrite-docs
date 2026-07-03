#!/usr/bin/env bash
# Pre-flight validation for docker-compose.cic-os.yml
# Ensures required config files exist before startup.

set -e

CONFIG_DIR="$(dirname "$0")/cic-ingestion/config"
REQUIRED_FILES=(
  "prometheus.yml"
  "loki-config.yml"
  "promtail-config.yml"
  "grafana-datasources.yml"
)

echo "Checking required config files..."
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$CONFIG_DIR/$file" ]; then
    echo "ERROR: Missing $file at $CONFIG_DIR/$file"
    exit 1
  fi
  echo "  ✓ $file"
done

echo "All config files present. Ready to start."
