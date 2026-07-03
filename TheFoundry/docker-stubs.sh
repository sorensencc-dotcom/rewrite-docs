#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  Creating Docker Stub Images"
echo "=========================================="
echo ""

REGISTRY="${REGISTRY:-docker.io}"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

# Base stub image (minimal node:20 with test script)
echo "Building base stub image..."

cat > /tmp/Dockerfile.stub << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Create minimal test script
RUN echo '#!/bin/sh' > test.sh && \
    echo 'echo "Stub test passed"' >> test.sh && \
    echo 'exit 0' >> test.sh && \
    chmod +x test.sh

ENTRYPOINT ["sh", "-c"]
EOF

docker build -t roadmap-stub:latest -f /tmp/Dockerfile.stub . > /dev/null 2>&1

echo -e "${GREEN}✅${NC} Base stub image built"

# Create phase stub images
PHASES=(
  "RL-4.6"
  "RL-4.0"
  "RL-4.1"
  "RL-4.2"
  "RL-4.3"
  "RL-4.4"
  "RL-4.5"
  "PHASE-0.9"
  "PHASE-26"
)

for PHASE in "${PHASES[@]}"; do
  docker tag roadmap-stub:latest "$REGISTRY/rewrite-labs/${PHASE,,}:latest"
  echo -e "${GREEN}✅${NC} Created stub: $REGISTRY/rewrite-labs/${PHASE,,}:latest"
done

echo ""
echo "=========================================="
echo "Stub images created. You can now:"
echo "  cd roadmap-runner && make once"
echo ""
echo "Scheduler will use these stubs if real images aren't available."
echo ""
echo "To replace stubs with real images later:"
echo "  docker build -t rewrite-labs/RL-4.0:latest ./packages/agents/"
echo "  ... (repeat for each phase)"
