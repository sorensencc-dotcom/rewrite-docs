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
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=False,  # Don't check exit code - we handle it ourselves
            timeout=60
        )
        # Print captured output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        if result.returncode == 0:
            log(f"✅ {description} completed successfully", "SUCCESS")
            return True
        else:
            log(f"⚠️  {description} returned exit code {result.returncode}", "WARN")
            return False
    except subprocess.TimeoutExpired:
        log(f"❌ {description} timed out (>60s)", "ERROR")
        return False
    except FileNotFoundError:
        log(f"❌ {script_name} not found in {Path(__file__).parent}", "ERROR")
        return False

def main():
    """Orchestrate the sync workflow."""
    import sys
    if sys.platform.startswith('win'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except AttributeError:
            pass
    log("Knowledge Base Sync Orchestrator Starting")
    log("This will run: sync.py → integrate.py")
    print()

    # Stage 1: Wiki Sync
    sync_result = run_stage("sync.py", "Wiki Sync (Stage 1)")
    if not sync_result:
        log("Warning: Stage 1 (Wiki Sync) reported issues - check _integration/report.json", "WARN")
        # Continue anyway - sync.py still produced valid output with a report

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
