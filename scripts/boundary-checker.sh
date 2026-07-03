#!/bin/bash
# Repo boundary checker — prevents cross-package contamination
# Called by git pre-commit hook

set -e

# Get staged files
STAGED=$(git diff --cached --name-only)

# Boundary rules
BOUNDARIES=(
  "cic/**:cic-ingestion:tools:projects"  # CIC core only
  "cic-ingestion/**:cic:tools:projects"  # Ingestion isolated
  "rewrite-mcp/**:cic:cic-ingestion"     # MCP isolated
  "projects/**:cic:cic-ingestion:rewrite-mcp:scripts"  # UI isolated
  "scripts/**:cic:cic-ingestion:rewrite-mcp:projects"  # Scripts isolated
  "tools/**:cic:cic-ingestion:rewrite-mcp"  # Tools isolated
)

# Check each staged file against boundaries
VIOLATIONS=0
while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue

  # Find which package owns this file
  OWNER=""
  if [[ "$FILE" =~ ^cic/ ]]; then OWNER="cic"; fi
  if [[ "$FILE" =~ ^cic-ingestion/ ]]; then OWNER="cic-ingestion"; fi
  if [[ "$FILE" =~ ^rewrite-mcp/ ]]; then OWNER="rewrite-mcp"; fi
  if [[ "$FILE" =~ ^projects/ ]]; then OWNER="projects"; fi
  if [[ "$FILE" =~ ^scripts/ ]]; then OWNER="scripts"; fi
  if [[ "$FILE" =~ ^tools/ ]]; then OWNER="tools"; fi

  [ -z "$OWNER" ] && continue

  # Check if file violates boundaries
  case "$OWNER" in
    cic)
      if [[ "$FILE" =~ ^(cic-ingestion|tools|projects|rewrite-mcp)/ ]]; then
        echo "❌ BOUNDARY VIOLATION: $FILE (cic core can't export to other packages)"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
      ;;
    cic-ingestion)
      if [[ "$FILE" =~ ^(cic|tools|projects|rewrite-mcp)/.*[^type|interface].ts$ ]]; then
        echo "❌ BOUNDARY VIOLATION: $FILE (ingestion can't import from non-type exports)"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
      ;;
    projects)
      if [[ "$FILE" =~ ^(cic-ingestion)/ ]]; then
        echo "❌ BOUNDARY VIOLATION: $FILE (UI can't import from ingestion)"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
      ;;
  esac
done <<< "$STAGED"

if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo "💥 Pre-commit check FAILED: $VIOLATIONS boundary violation(s)"
  echo "Run: git diff --cached --name-only | grep -E '(cic|cic-ingestion|projects|rewrite-mcp)'"
  exit 1
fi

exit 0
