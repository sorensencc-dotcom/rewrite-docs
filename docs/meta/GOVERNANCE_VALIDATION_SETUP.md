# Governance Validation Setup Guide

**Date:** 2026-07-02  
**Status:** Ready to Deploy  
**Purpose:** Enforce CLAUDE.md rules automatically

---

## Overview

This validation system prevents governance violations by:

1. **Local Validation** — Run before each commit
2. **Pre-commit Hook** — Block violations at commit time
3. **CI/CD Pipeline** — Run on every push/PR
4. **Compliance Reports** — Track violations over time

---

## Files Created

| File | Purpose |
|------|---------|
| `validate-governance.ps1` | Main validation script (PowerShell) |
| `PRE-COMMIT-HOOK.sh` | Pre-commit hook template |
| `.github/workflows/governance-validation.yml` | GitHub Actions CI/CD |
| `GOVERNANCE_VALIDATION_SETUP.md` | This file |

---

## Setup Instructions

### Option 1: Local Validation Only (Quick Start)

**Run manually before committing:**
```powershell
cd C:\dev
pwsh .\validate-governance.ps1 -Verbose
```

**Output:**
- ✅ Green text = PASS
- ❌ Red text = FAIL (commit blocked)
- ⚠️ Yellow text = WARNING

---

### Option 2: Pre-Commit Hook (Automatic Local)

**Install the hook:**

```bash
# For Windows + Git Bash
cp C:\dev\PRE-COMMIT-HOOK.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Or manually:
# 1. Copy PRE-COMMIT-HOOK.sh content
# 2. Paste into .git/hooks/pre-commit
# 3. Save (no extension)
```

**How it works:**
- Runs automatically before `git commit`
- Validates governance rules
- Blocks commit if violations found
- Shows detailed error messages

**To bypass (emergency only):**
```bash
git commit --no-verify
```

---

### Option 3: GitHub Actions CI/CD (Full Enforcement)

**Already configured:**
```
.github/workflows/governance-validation.yml
```

**How it works:**
- Runs on every push to main/develop
- Runs on every PR
- Blocks merge if validation fails
- Comments PR with results
- Uploads compliance report as artifact

**To enable:**
1. Ensure `.github/workflows/governance-validation.yml` exists
2. Push to GitHub
3. Validation runs automatically on next push

---

## Running the Validator

### Basic Run
```powershell
pwsh .\validate-governance.ps1
```

### Verbose Output
```powershell
pwsh .\validate-governance.ps1 -Verbose
```

### Generate Report
```powershell
pwsh .\validate-governance.ps1 -Report
```

Creates: `GOVERNANCE_VALIDATION_REPORT.json`

### Combined
```powershell
pwsh .\validate-governance.ps1 -Verbose -Report
```

---

## Understanding Violations

### RULE 1: Markdown Files in Root
**Violation:** Files like `KB_SYNC_*.md` in `C:\dev\` root  
**Fix:** Move to `C:\dev\docs/meta/` or appropriate category  
**Why:** Keeps docs organized and enables mkdocs automation

### RULE 2: Toolforge Skills Structure
**Violation:** Skills outside `C:\dev\toolforge\skills/{name}/`  
**Fix:** Move to toolforge with required structure:
```
toolforge/skills/{name}/
├── skill.json
├── README.md
├── src/
├── tests/
└── docs/
```
**Why:** Enables skill registry, versioning, and automation

### RULE 3: Code/Config Location
**Violation:** Config files scattered across directories  
**Fix:** Organize into standard locations (toolforge/config/, etc.)  
**Why:** Simplifies deployment and configuration management

---

## Example Workflow

### Before Committing
```bash
# Terminal
cd C:\dev
pwsh .\validate-governance.ps1 -Verbose

# Output shows:
# ✅ RULE 1: No orphaned markdown files
# ✅ RULE 2: All skills have required structure
# ✅ RULE 3: Code/Config location OK
```

### If Violations Found
```bash
# Output shows:
# ❌ RULE 1: Found 3 markdown files in root
#   - KB_SYNC_IMPLEMENTATION_COMPLETE.md
#   - KB_SYNC_UPDATE_TRACKER.md
#   - SYNC_ANALYSIS.md

# Fix: Move these files to docs/meta/ or docs/reference/
mv C:\dev\KB_SYNC_*.md C:\dev\docs\meta\
mv C:\dev\SYNC_ANALYSIS.md C:\dev\docs\reference\

# Re-run validation
pwsh .\validate-governance.ps1 -Verbose

# Now: ✅ RULE 1: No orphaned markdown files
```

### Commit
```bash
git add .
git commit -m "Move KB sync docs to docs/meta/"
# Pre-commit hook runs validation
# If PASS: commit succeeds
# If FAIL: commit blocked, fix violations
```

---

## Monitoring Compliance

### Weekly Review
```powershell
pwsh .\validate-governance.ps1 -Report
cat .\GOVERNANCE_VALIDATION_REPORT.json
```

### Historical Tracking
```powershell
# Save reports with timestamp
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
pwsh .\validate-governance.ps1 -Report
mv GOVERNANCE_VALIDATION_REPORT.json "GOVERNANCE_VALIDATION_REPORT_$date.json"
```

### Trend Analysis
Compare reports over time to see if violations are increasing/decreasing.

---

## Customization

### Add Custom Rules

Edit `validate-governance.ps1`:

```powershell
# Add new rule function
function Validate-Rule4 {
    Write-Host "`n=== RULE 4: Your Custom Rule ===" -ForegroundColor Magenta

    # Validation logic here
    if ($violationsFound) {
        Write-Fail "Found X violations"
        return $false
    }
    else {
        Write-Pass "Rule 4 compliant"
        return $true
    }
}

# Call in Main()
$rule4Pass = Validate-Rule4
```

### Adjust Strictness

Modify thresholds in `validate-governance.ps1`:

```powershell
# More lenient (fewer violations caught)
if ($violations.Count -gt 10) { ... }

# More strict (more violations caught)
if ($violations.Count -gt 0) { ... }
```

---

## Troubleshooting

### Pre-commit hook not running
```bash
# Check hook exists and is executable
ls -la .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit

# Test manually
.git/hooks/pre-commit
```

### PowerShell not found
```bash
# Install PowerShell 7+
# Then use: pwsh (not powershell)

# Or check available shells
which pwsh
which powershell
```

### GitHub Actions failing
```bash
# Check workflow file syntax
# View runs: https://github.com/yourrepo/actions

# Common issues:
# - Missing .github/workflows/ directory
# - Invalid YAML syntax
# - PowerShell not available in runner
```

---

## Integration with CI/CD

### GitHub
✅ Validation runs automatically  
✅ Blocks merge on failure  
✅ Comments PR with results

### GitLab CI
Add to `.gitlab-ci.yml`:
```yaml
validate-governance:
  script:
    - pwsh .\validate-governance.ps1 -Verbose
  allow_failure: false
```

### Jenkins
Add to Jenkinsfile:
```groovy
stage('Governance Validation') {
    steps {
        sh 'pwsh ./validate-governance.ps1 -Verbose'
    }
}
```

---

## Enforcement Levels

### Level 0: Manual (No Enforcement)
```
User runs: pwsh .\validate-governance.ps1
No blocking, just awareness
```

### Level 1: Local (Pre-commit Hook)
```
Pre-commit hook blocks commits
User can bypass with --no-verify
Catches most violations before push
```

### Level 2: Remote (CI/CD)
```
GitHub Actions validates every push
Blocks PR merge on failure
Prevents violations from reaching main branch
```

### Level 3: Automated Enforcement + Quarantine
```
Level 2 + automated fixes (if implemented)
Violations auto-moved to _archive/
Requires manual review before re-enabling
```

**Recommended:** Combine Level 1 (local) + Level 2 (remote)

---

## Success Metrics

Track compliance over time:

| Metric | Target | Current |
|--------|--------|---------|
| Governance Pass Rate | 100% | TBD |
| RULE 1 Violations | 0 | 15 |
| RULE 2 Violations | 0 | 1 |
| RULE 3 Violations | 0 | 0 |
| Average Fix Time | <1 day | TBD |

---

## Support

### Check Validation Status
```powershell
pwsh .\validate-governance.ps1 -Verbose
```

### View Compliance Report
```powershell
cat .\GOVERNANCE_VALIDATION_REPORT.json
```

### Review Rules
See: `C:\dev\CLAUDE.md` (Governance section)

### Debug Validation Script
```powershell
# Add Debug to script
pwsh .\validate-governance.ps1 -Debug
```

---

## Next Steps

1. **Install pre-commit hook:**
   ```bash
   cp C:\dev\PRE-COMMIT-HOOK.sh .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

2. **Test locally:**
   ```powershell
   pwsh .\validate-governance.ps1 -Verbose
   ```

3. **Fix existing violations:**
   - Review: `REPOSITORY_GOVERNANCE_AUDIT.md`
   - Move files per recommendations
   - Re-run validation

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Fix governance violations, add validation"
   ```

5. **Monitor compliance:**
   - Weekly: Run validation report
   - Track violations over time
   - Adjust rules as needed

---

## Conclusion

✅ **Validation system is ready to deploy.**

This setup ensures:
- Rules are checked before every commit
- Violations are caught early
- Team compliance is tracked
- Automated enforcement is possible

**Start with:** Local validation → Pre-commit hook → CI/CD integration

