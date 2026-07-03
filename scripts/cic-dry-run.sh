#!/usr/bin/env bash
# CIC Dry-Run Mode — Test startup sequence without side effects
# Validates all checks without launching services or modifying state
# Usage: CIC_DRY_RUN=true bash scripts/cic-docker-entrypoint.sh start
# Version: 1.0.0

set -euo pipefail

export CIC_DRY_RUN=true
export CLAUDE_SKIP_PERMISSIONS=true

echo "═══════════════════════════════════════════════════"
echo "CIC DRY-RUN MODE"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Running startup validation without side effects..."
echo "  - No services will be launched"
echo "  - No files will be modified"
echo "  - No API calls will be made"
echo "  - Config will be validated only"
echo ""

bash "$(dirname "$0")/cic-docker-entrypoint.sh" start

echo ""
echo "Dry-run complete. Safe to proceed with real startup."
