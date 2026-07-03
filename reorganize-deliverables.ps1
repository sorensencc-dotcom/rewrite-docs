# Reorganization Script: 8-Item Deliverables
# Purpose: Move all deliverable files from C:\dev\ root to proper mkdocs + toolforge structure
# Safety: Creates directories, moves files, logs all actions
# Rollback: All moves are logged to reorganization.log

param(
  [switch]$DryRun = $false,
  [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = "C:\dev\reorganization.log"

function Log {
  param([string]$Message, [string]$Level = "INFO")
  $entry = "[$timestamp] [$Level] $Message"
  Write-Host $entry
  Add-Content -Path $logFile -Value $entry
}

function EnsureDir {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -Path $Path -ItemType Directory -Force | Out-Null
    Log "Created directory: $Path"
  }
}

function MoveFile {
  param([string]$Source, [string]$Dest)

  if (-not (Test-Path $Source)) {
    Log "Source not found: $Source" "WARN"
    return $false
  }

  $destDir = Split-Path -Parent $Dest
  EnsureDir $destDir

  if ($DryRun) {
    Log "[DRY RUN] Would move: $Source → $Dest" "DRY"
  } else {
    Move-Item -Path $Source -Destination $Dest -Force -ErrorAction Continue
    Log "Moved: $Source → $Dest"
  }
  return $true
}

Log "=== REORGANIZATION START ===" "START"
Log "Dry Run: $DryRun"

# ============================================================================
# ITEM 1: Research Skill
# ============================================================================

Log "ITEM 1: Research Skill" "PHASE"
EnsureDir "C:\dev\docs\cic\research-skill"
EnsureDir "C:\dev\docs\cic\research-skill\test-results"

MoveFile "C:\dev\cic-research\SKILL.md" "C:\dev\docs\cic\research-skill\SKILL.md"
MoveFile "C:\dev\cic-research\evals\evals.json" "C:\dev\docs\cic\research-skill\test-results\test-cases.json"
MoveFile "C:\dev\cic-research\evals\grading-results.md" "C:\dev\docs\cic\research-skill\test-results\iteration-1-grading.md"
MoveFile "C:\dev\cic-research\evals\iteration-2-summary.md" "C:\dev\docs\cic\research-skill\test-results\iteration-2-grading.md"

# ============================================================================
# ITEM 2: Observability Dashboard
# ============================================================================

Log "ITEM 2: Observability Dashboard" "PHASE"
EnsureDir "C:\dev\docs\dashboard\spec"
EnsureDir "C:\dev\docs\dashboard\implementation"

# Note: Dashboard spec files need to be identified - they're in outputs or root
# For now, log missing files
Log "Dashboard spec files (verify location): CIC_OBSERVABILITY_DASHBOARD_SPEC.md, etc." "WARN"

# ============================================================================
# ITEM 3: Vault Analysis
# ============================================================================

Log "ITEM 3: Vault Analysis" "PHASE"
EnsureDir "C:\dev\docs\cic\vault-analysis"

Log "Vault analysis files (verify location): topology-map.*, gap-analysis.md, etc." "WARN"

# ============================================================================
# ITEM 4: Rewrite Labs Vault Mirror
# ============================================================================

Log "ITEM 4: Rewrite Labs Vault Mirror" "PHASE"
EnsureDir "C:\dev\docs\rewrite-labs\vault-mirror"

# Note: RL mirror docs need to be identified
Log "RL mirror docs (verify location): sync setup guides, etc." "WARN"

# Scripts and configs stay in C:\dev\ root - do NOT move
Log "Scripts/configs stay in C:\dev\: sync-vault.ps1, sync-vault.sh, vault-sync-config.json"

# ============================================================================
# ITEM 5: Operational Skills → Toolforge
# ============================================================================

Log "ITEM 5: Operational Skills" "PHASE"

$skills = @(
  "run-cic-phase",
  "debug-cic-issue",
  "monitor-phase-health",
  "configure-cic-environment",
  "investigate-data-flow",
  "onboard-new-extractor"
)

foreach ($skill in $skills) {
  $skillPath = "C:\dev\toolforge\skills\$skill"
  EnsureDir $skillPath
  EnsureDir "$skillPath\src"
  EnsureDir "$skillPath\tests"
  EnsureDir "$skillPath\docs"

  Log "Skill structure created: $skill (awaiting content population)" "SKILL"
}

Log "Skill supporting docs (verify location): SKILLS-CATALOG.md, VALIDATION-CHECKLIST.md, etc." "WARN"

# ============================================================================
# ITEM 6: Knowledge Graph
# ============================================================================

Log "ITEM 6: Knowledge Graph" "PHASE"
EnsureDir "C:\dev\docs\reference\knowledge-graph\implementation"
EnsureDir "C:\dev\docs\reference\knowledge-graph\viewer"
EnsureDir "C:\dev\docs\reference\knowledge-graph\examples"
EnsureDir "C:\dev\docs\reference\knowledge-graph\validation"

Log "Knowledge graph files (verify location): extract-backlinks.ts, etc." "WARN"

# ============================================================================
# ITEM 7: Memory Governance
# ============================================================================

Log "ITEM 7: Memory Governance" "PHASE"
EnsureDir "C:\dev\docs\reference\memory-governance"

Log "Memory governance files (verify location): framework.md, CLAUDE-md-template.md, etc." "WARN"

# ============================================================================
# SUMMARY DOCS
# ============================================================================

Log "SUMMARY DOCS" "PHASE"
EnsureDir "C:\dev\docs\meta"

# These files may be in outputs/ or C:\dev\ root
Log "Summary docs (verify location): 8-items-complete.md, build-progress.md, final-status.md" "WARN"

# ============================================================================
# VERIFICATION
# ============================================================================

Log "=== DIRECTORY STRUCTURE CREATED ===" "VERIFY"
Log "Checking new directories..."

$dirs = @(
  "C:\dev\docs\cic\research-skill",
  "C:\dev\docs\dashboard\spec",
  "C:\dev\docs\cic\vault-analysis",
  "C:\dev\docs\rewrite-labs\vault-mirror",
  "C:\dev\docs\reference\knowledge-graph",
  "C:\dev\docs\reference\memory-governance",
  "C:\dev\docs\meta"
)

$dirs += $skills | ForEach-Object { "C:\dev\toolforge\skills\$_" }

foreach ($dir in $dirs) {
  if (Test-Path $dir) {
    Log "✓ $dir"
  } else {
    Log "✗ $dir (NOT FOUND)" "ERROR"
  }
}

Log "=== REORGANIZATION COMPLETE ===" "END"
Log "Log file: $logFile"
Log "Next step: Run mkdocs build --strict to verify structure"
Log "Next step: Review cross-reference audit list"
Log "Next step: Update mkdocs.yml navigation"

exit 0
