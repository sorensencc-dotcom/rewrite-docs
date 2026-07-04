#!/usr/bin/env python3
"""
Knowledge Base Master Orchestrator
Runs sync.py (wiki sync) → integrate.py (cross-refs + analysis)

Usage:
  python3 sync-all.py              # Run both stages
  python3 sync.py                  # Wiki sync only (fast)
  python3 integrate.py             # Integration only (after manual sync)

Output:
  Stage 1: wiki/ (from sync.py)
  Stage 2: _integration/ + wiki/index-unified.md (from integrate.py)
"""

import subprocess
import sys
import json
from datetime import datetime
from pathlib import Path

def log(msg, level="INFO"):
    """Simple logging with timestamp."""
    ts = datetime.now().isoformat()
    print(f"[{ts}] {level}: {msg}")

def run_stage(script_name, description):
    """Execute a Python stage and report status."""
    log(f"Starting Stage: {description}")
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True,
            check=True
        )
        log(f"✅ {description} completed successfully", "SUCCESS")
        return True
    except subprocess.CalledProcessError as e:
        log(f"❌ {description} failed with exit code {e.returncode}", "ERROR")
        return False
    except FileNotFoundError:
        log(f"❌ {script_name} not found in {Path(__file__).parent}", "ERROR")
        return False

def main():
    """Orchestrate the sync workflow."""
    log("Knowledge Base Sync Orchestrator Starting")
    log("This will run: sync.py → integrate.py")
    print()

    # Stage 1: Wiki Sync
    if not run_stage("sync.py", "Wiki Sync (Stage 1)"):
        log("Aborting: Stage 1 (Wiki Sync) failed", "ERROR")
        sys.exit(1)

    print()

    # Stage 2: Integration
    if not run_stage("integrate.py", "Integration Layer (Stage 2)"):
        log("Warning: Stage 2 (Integration) failed", "WARN")
        # Don't exit on integration failure - wiki sync is still valid

    print()
    log("Knowledge Base Sync Orchestrator Complete", "SUCCESS")
    log("Check wiki/index-unified.md and _integration/report.json for results")

if __name__ == "__main__":
    main()
