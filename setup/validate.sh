#!/bin/sh
set -e

ERRORS=0

log() {
  echo "  $*"
}

pass() {
  echo "✔️  $*"
}

fail() {
  echo "❌ $*"
  ERRORS=$((ERRORS + 1))
}

echo "Validating repository structure..."
echo ""

# Check .github/workflows
if [ -d ".github/workflows" ]; then
  pass ".github/workflows exists"

  if [ -f ".github/workflows/bootstrap.yml" ]; then
    pass ".github/workflows/bootstrap.yml exists"
  else
    fail ".github/workflows/bootstrap.yml missing"
  fi

  if [ -f ".github/workflows/dashboard.yml" ]; then
    pass ".github/workflows/dashboard.yml exists"
  else
    fail ".github/workflows/dashboard.yml missing"
  fi

  if [ -f ".github/workflows/nightly-validate.yml" ]; then
    pass ".github/workflows/nightly-validate.yml exists"
  else
    fail ".github/workflows/nightly-validate.yml missing"
  fi
else
  fail ".github/workflows directory missing"
fi

# Check setup directory
if [ -d "setup" ]; then
  pass "setup/ directory exists"

  if [ -f "setup/validate.sh" ]; then
    pass "setup/validate.sh exists"
  else
    fail "setup/validate.sh missing"
  fi
else
  fail "setup/ directory missing"
fi

# Check for main repo files
if [ -f "README.md" ]; then
  pass "README.md exists"
else
  log "Warning: README.md not found"
fi

if [ -f ".gitignore" ]; then
  pass ".gitignore exists"
else
  log "Warning: .gitignore not found"
fi

echo ""

if [ "$ERRORS" -eq 0 ]; then
  echo "✔️  All validations passed"
  exit 0
else
  echo "❌ $ERRORS validation(s) failed"
  exit 1
fi
