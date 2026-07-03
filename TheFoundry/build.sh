#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  TheFoundry v3.0 — Full Docs Pipeline"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Trap errors
trap 'echo -e "${RED}[ERROR] Build failed${NC}"; exit 1' ERR

echo -e "${YELLOW}[1/4] Building docs...${NC}"
bash build-docs.sh

echo ""
echo -e "${YELLOW}[2/4] Validating docs...${NC}"
bash validate-docs.sh

echo ""
echo -e "${YELLOW}[3/4] Generating manifest...${NC}"
node generate-manifest.js

echo ""
echo -e "${GREEN}[4/4] Build complete!${NC}"
echo ""
echo "Output:"
echo "  - Docs: out/docs/"
echo "  - Roadmap graph: out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json"
echo "  - Manifest: out/manifest.json"
echo ""
echo -e "${GREEN}✓ TheFoundry build succeeded${NC}"
