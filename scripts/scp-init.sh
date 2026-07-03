#!/bin/bash
# SCP Docker Initialization - Phase 28a.2
# Runs migrations and initializes skill manifest system on container startup

set -e

echo "🚀 Starting CIC SCP (Phase 28a.2) initialization..."

# Wait for Postgres to be ready
echo "⏳ Waiting for Postgres..."
max_attempts=30
attempt=0
while ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ Postgres failed to start"
    exit 1
  fi
  sleep 1
done
echo "✅ Postgres ready"

# Create database if not exists
echo "📦 Setting up database..."
PGPASSWORD=${DB_PASSWORD:-postgres} psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -c "CREATE DATABASE ${DB_NAME:-cic_governance} OWNER ${DB_USER:-postgres};" 2>/dev/null || true

# Run migrations
echo "🔄 Running database migrations..."
cd /workspace/cic/src/governance/lineage/migrations

# Execute each migration file in order
for migration in 001_*.sql 002_*.sql 003_*.sql; do
  if [ -f "$migration" ]; then
    echo "  📝 $migration"
    PGPASSWORD=${DB_PASSWORD:-postgres} psql \
      -h ${DB_HOST:-localhost} \
      -U ${DB_USER:-postgres} \
      -d ${DB_NAME:-cic_governance} \
      -f "$migration" > /dev/null 2>&1 || echo "    ⚠️  Already applied or error"
  fi
done

echo "✅ Migrations completed"

# Initialize manifest if not exists
echo "📋 Checking skill manifest..."
MANIFEST_PATH="$HOME/.claude/skills/manifest.json"
if [ ! -f "$MANIFEST_PATH" ]; then
  echo "  Creating manifest at $MANIFEST_PATH"
  mkdir -p "$(dirname "$MANIFEST_PATH")"
  cat > "$MANIFEST_PATH" <<EOF
{
  "version": "1.0",
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "skills": []
}
EOF
  echo "  ✅ Manifest initialized"
else
  echo "  ✅ Manifest exists"
fi

echo ""
echo "🎉 SCP Phase 28a.2 initialization complete!"
echo ""
echo "Next steps:"
echo "  /skill-manifest register <repo-url> <skill-id>"
echo "  /skill-manifest list"
echo "  /skill-manifest view <skill-id>"
echo ""
