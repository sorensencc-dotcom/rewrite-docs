#!/bin/bash
# Phase 27.4 Database Migration Script
# Runs budget ledger v2 schema migration

set -e

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-cic_lineage}
DB_USER=${DB_USER:-cic}
DB_PASSWORD=${DB_PASSWORD:-cic_dev_pass}

MIGRATION_FILE="$(dirname "$0")/../../../cic/budget_ledger/migrations/274_budget_ledger_v2.sql"

echo "Running Phase 27.4 Migration: $MIGRATION_FILE"
echo "Target: $DB_HOST:$DB_PORT/$DB_NAME"

# Option 1: Using psql
if command -v psql &> /dev/null; then
  echo "Using psql..."
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$MIGRATION_FILE" \
    -v ON_ERROR_STOP=1

  echo "✓ Migration completed successfully"
  exit 0
fi

# Option 2: Using Flyway (if available)
if command -v flyway &> /dev/null; then
  echo "Using Flyway..."
  flyway \
    -url="jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME" \
    -user="$DB_USER" \
    -password="$DB_PASSWORD" \
    -locations="filesystem:$(dirname "$MIGRATION_FILE")" \
    migrate

  echo "✓ Flyway migration completed successfully"
  exit 0
fi

echo "✗ Neither psql nor flyway found. Install PostgreSQL client tools."
exit 1
