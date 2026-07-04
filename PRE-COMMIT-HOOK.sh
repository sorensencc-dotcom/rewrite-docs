#!/bin/bash
# Pre-commit hook: Enforce governance rules
# Copy this to .git/hooks/pre-commit and chmod +x

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Running governance validation...${NC}"

# Try to run validation script
if command -v pwsh &> /dev/null; then
    pwsh -NoProfile -File "C:\dev\validate-governance.ps1" -Verbose
    EXIT_CODE=$?
elif command -v powershell &> /dev/null; then
    powershell -NoProfile -File "C:\dev\validate-governance.ps1" -Verbose
    EXIT_CODE=$?
else
    echo -e "${YELLOW}Warning: PowerShell not available, skipping governance check${NC}"
    exit 0
fi

if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Governance validation FAILED${NC}"
    echo -e "${RED}Commit blocked: Fix violations in REPOSITORY_GOVERNANCE_AUDIT.md${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Governance validation PASSED${NC}"
exit 0
