#!/usr/bin/env python3
"""
Test path resolution logic BEFORE applying to sync.py
This validates the fix works correctly on sample cases.
"""

from pathlib import Path
from typing import Set

def resolve_relative_path(link: str, source_dir: Path) -> str:
    """Resolve ../foo/bar.md relative to source_dir"""
    parts = link.split("/")
    current_dir = source_dir
    
    # Process .. and go up directories
    for part in parts:
        if part == "..":
            current_dir = current_dir.parent
        elif part == ".":
            continue
        else:
            # Reached non-.. part, build remainder
            idx = parts.index(part)
            remaining = "/".join(parts[idx:])
            return str(current_dir / remaining).lower()
    
    return str(current_dir).lower()

def is_valid_link(link: str, source_dir: Path, all_links: Set[str]) -> bool:
    """Check if link is valid, resolving relative paths"""
    link_normalized = link.lower().strip()
    
    # Resolve relative paths
    if link_normalized.startswith("../"):
        resolved = resolve_relative_path(link_normalized, source_dir)
    else:
        resolved = link_normalized
    
    # Check variants
    return (resolved in all_links or 
            f"{resolved}.md" in all_links or 
            f"{resolved}/index.md" in all_links)

# Build sample all_links from actual filesystem
print("Building all_links from docs/ directory...")
all_links = set()
docs_dir = Path("/sessions/wizardly-vibrant-darwin/mnt/dev/docs")

for md_file in docs_dir.rglob("*.md"):
    rel_path = md_file.relative_to(docs_dir)
    all_links.add(str(rel_path).lower())
    all_links.add(str(rel_path.with_suffix("")).lower())

print(f"Found {len(all_links)} valid links\n")

# Test cases
test_cases = [
    {
        "name": "Test 1: Simple relative path (reference to operations)",
        "source": "reference/cli.md",
        "link": "../operations/sealing.md",
        "expected": True,  # File exists at docs/operations/sealing.md
    },
    {
        "name": "Test 2: Nested relative path (phases to roadmaps)",
        "source": "cic/phases/phase-2-overview.md",
        "link": "../../roadmaps/cic-roadmap.md",
        "expected": True,  # File exists at docs/roadmaps/cic-roadmap.md
    },
    {
        "name": "Test 3: Non-existent file (should stay broken)",
        "source": "reference/cli.md",
        "link": "../nonexistent/foo.md",
        "expected": False,  # File doesn't exist
    },
    {
        "name": "Test 4: Simple path without ../ (should already work)",
        "source": "cic/index.md",
        "link": "phases/phase-2-architecture.md",
        "expected": True,  # File exists at docs/cic/phases/phase-2-architecture.md
    },
    {
        "name": "Test 5: Multi-level relative path",
        "source": "reference/cic-rl-cross-reference.md",
        "link": "../roadmaps/cic-roadmap.md",
        "expected": True,  # File exists at docs/roadmaps/cic-roadmap.md
    },
]

# Run tests
print("=" * 70)
print("TESTING PATH RESOLUTION LOGIC")
print("=" * 70)

passed = 0
failed = 0

for test in test_cases:
    source_path = Path(test["source"])
    source_dir = source_path.parent
    link = test["link"]
    expected = test["expected"]
    
    result = is_valid_link(link, source_dir, all_links)
    status = "✅ PASS" if result == expected else "❌ FAIL"
    
    if result == expected:
        passed += 1
    else:
        failed += 1
    
    print(f"\n{test['name']}")
    print(f"  Source: docs/{test['source']}")
    print(f"  Link:   {link}")
    print(f"  Expected: {'VALID' if expected else 'BROKEN'}")
    print(f"  Got:      {'VALID' if result else 'BROKEN'}")
    print(f"  {status}")
    
    # Debug info
    if test["link"].startswith("../"):
        resolved = resolve_relative_path(link, source_dir)
        print(f"  Resolved to: {resolved}")

print("\n" + "=" * 70)
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
print("=" * 70)

if failed == 0:
    print("✅ ALL TESTS PASSED - Ready to apply fix to sync.py!")
else:
    print(f"❌ {failed} TESTS FAILED - Fix needs refinement")

