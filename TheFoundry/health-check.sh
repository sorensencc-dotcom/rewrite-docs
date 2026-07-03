#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  Roadmap Automation Health Check"
echo "=========================================="
echo ""

FAILED=0

# Check 1: Docker is running
echo "[1/8] Checking Docker..."
if ! docker ps &> /dev/null; then
  echo "❌ Docker not running. Start Docker Desktop or systemctl start docker"
  FAILED=1
else
  echo "✅ Docker running"
fi

# Check 2: .env.local exists
echo "[2/8] Checking .env.local..."
if [ ! -f roadmap-runner/.env.local ]; then
  echo "❌ roadmap-runner/.env.local missing. Run: cp roadmap-runner/.env.local.example roadmap-runner/.env.local"
  FAILED=1
else
  echo "✅ .env.local exists"
fi

# Check 3: TheFoundry can build
echo "[3/8] Checking TheFoundry build..."
if ! cd TheFoundry && npm install &> /dev/null; then
  echo "❌ TheFoundry npm install failed"
  FAILED=1
else
  echo "✅ TheFoundry dependencies ok"
  cd ..
fi

# Check 4: Phase configs valid
echo "[4/8] Validating phase configs..."
PHASE_COUNT=$(ls -1 roadmap-runner/phases/*.yaml 2>/dev/null | wc -l)
if [ "$PHASE_COUNT" -lt 8 ]; then
  echo "❌ Phase config count ($PHASE_COUNT) less than 8"
  FAILED=1
else
  echo "✅ Phase configs present ($PHASE_COUNT files)"
fi

# Check 5: Scheduler can parse
echo "[5/8] Checking scheduler syntax..."
if ! node -c roadmap-runner/scheduler.js &> /dev/null; then
  echo "❌ scheduler.js has syntax errors"
  FAILED=1
else
  echo "✅ scheduler.js syntax ok"
fi

# Check 6: Roadmap graph exists
echo "[6/8] Checking roadmap graph..."
if [ ! -f docs/roadmap/ROADMAP_DEPENDENCY_GRAPH.json ]; then
  echo "❌ ROADMAP_DEPENDENCY_GRAPH.json missing. Run: cd TheFoundry && make build"
  FAILED=1
else
  NODES=$(jq '.nodes | length' docs/roadmap/ROADMAP_DEPENDENCY_GRAPH.json)
  echo "✅ Roadmap graph exists ($NODES nodes)"
fi

# Check 7: Manifest exists
echo "[7/8] Checking TheFoundry manifest..."
if [ ! -f TheFoundry/out/manifest.json ]; then
  echo "❌ TheFoundry/out/manifest.json missing. Run: cd TheFoundry && make build"
  FAILED=1
else
  echo "✅ Manifest exists"
fi

# Check 8: Docker can run containers
echo "[8/8] Checking Docker connectivity..."
if ! docker run --rm hello-world &> /dev/null; then
  echo "❌ Docker cannot run containers"
  FAILED=1
else
  echo "✅ Docker container runtime ok"
fi

echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
  echo "✅ All checks passed. Ready to launch at 6am."
  echo ""
  echo "Next steps:"
  echo "  cd TheFoundry && make build      (compile roadmap)"
  echo "  cd ../roadmap-runner && make up  (start services)"
  exit 0
else
  echo "❌ $FAILED checks failed. Fix above before launching."
  exit 1
fi
