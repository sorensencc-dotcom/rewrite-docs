#!/bin/bash
# startup.sh - One-command deployment of CIC Update-Monitor full loop

set -e

echo "=========================================="
echo "CIC Update-Monitor Deployment"
echo "=========================================="
echo ""

# Check prerequisites
echo "[1/6] Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker 20.10+"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose 2.0+"
    exit 1
fi

echo "✓ Docker $(docker --version | awk '{print $3}')"
echo "✓ Docker Compose $(docker-compose --version | awk '{print $3}')"
echo ""

# Check .env file
echo "[2/6] Checking configuration..."
if [ ! -f .env ]; then
    echo "⚠ .env file not found"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Created .env (please edit with your values)"
        echo "⚠ You must set GITHUB_TOKEN before starting services"
        exit 1
    else
        echo "❌ .env.example not found"
        exit 1
    fi
fi

if ! grep -q "GITHUB_TOKEN" .env; then
    echo "❌ GITHUB_TOKEN not set in .env"
    exit 1
fi

echo "✓ .env configured"
echo ""

# Build services
echo "[3/6] Building services..."
docker-compose -f docker-compose-cic-loop.yml build --quiet
echo "✓ Services built"
echo ""

# Start services
echo "[4/6] Starting services..."
docker-compose -f docker-compose-cic-loop.yml up -d
echo "✓ Services started"
echo ""

# Wait for services
echo "[5/6] Waiting for services to be ready..."
for i in {1..30}; do
    if docker exec codeflow-analyzer curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✓ All services ready"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 1
done
echo ""

# Show status
echo "[6/6] Verifying status..."
docker-compose -f docker-compose-cic-loop.yml ps
echo ""

# Summary
echo "=========================================="
echo "✅ CIC Update-Monitor deployed successfully!"
echo "=========================================="
echo ""
echo "📊 Dashboards:"
echo "   • UI Dashboard:     http://localhost:3003"
echo "   • Grafana:          http://localhost:3002 (admin / admin)"
echo "   • Prometheus:       http://localhost:9090"
echo ""
echo "🎮 CLI Usage:"
echo "   docker exec cic-cli ts-node cic-cli.ts repo sync codeflow"
echo "   docker exec cic-cli ts-node cic-cli.ts extractor run codeflow"
echo "   docker exec cic-cli ts-node cic-cli.ts roadmap list --source=external"
echo "   docker exec cic-cli ts-node cic-cli.ts status"
echo ""
echo "🧪 Run integration tests:"
echo "   docker-compose -f docker-compose-cic-loop.yml run --rm integration-tests"
echo ""
echo "📖 Full documentation: see DEPLOYMENT.md"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose-cic-loop.yml down"
echo ""
