#!/bin/bash
# Audit script: Detect committed build artifacts across monorepo
# Usage: ./scripts/audit-build-artifacts.sh
# Exit 0: no artifacts found. Exit 1: artifacts found.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 Auditing committed build artifacts..."
echo

ARTIFACTS_FOUND=0

# Patterns to check for in git index
PATTERNS=(
  "node_modules/"
  "dist/"
  "build/"
  ".tsbuildinfo"
  "coverage/"
  ".nyc_output/"
  "\.sqlite$"
  "\.sqlite3$"
  "\.db$"
)

echo "Checking git index for committed build artifacts..."
for pattern in "${PATTERNS[@]}"; do
  # Use git ls-files to check what's tracked
  if git ls-files | grep -E "$pattern" > /dev/null; then
    echo "❌ Found committed: $pattern"
    git ls-files | grep -E "$pattern" | head -10
    echo
    ARTIFACTS_FOUND=$((ARTIFACTS_FOUND + 1))
  fi
done

# Check for untracked files that should be ignored
echo
echo "Checking working directory for tracked files missing from .gitignore..."
UNTRACKED=$(git ls-files --others --exclude-standard)
SHOULD_IGNORE=0

if [ -n "$UNTRACKED" ]; then
  # Filter for build-like patterns
  echo "$UNTRACKED" | while read -r file; do
    if [[ "$file" =~ (node_modules|dist|build|\.tsbuildinfo|coverage|\.sqlite|\.db) ]]; then
      echo "⚠️  Untracked (should add to .gitignore): $file"
      SHOULD_IGNORE=$((SHOULD_IGNORE + 1))
    fi
  done
fi

# Summary
echo
echo "═════════════════════════════════════════════════════════════"
if [ $ARTIFACTS_FOUND -eq 0 ]; then
  echo "✅ No committed build artifacts found."
  exit 0
else
  echo "❌ Found $ARTIFACTS_FOUND category/categories of committed artifacts."
  echo "    Run: git rm -r --cached <path>"
  echo "    Then commit the removal."
  exit 1
fi
