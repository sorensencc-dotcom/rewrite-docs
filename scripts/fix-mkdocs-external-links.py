#!/usr/bin/env python3
"""
Convert markdown links that escape the docs/ tree into backtick code references.
MkDocs --strict fails on any [text](../../outside/docs/) link.
"""
import re
import os
import sys

DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs'))

# Pattern: [link text](relative/path)
LINK_RE = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')

def normalize_path(path_str):
    """Normalize Windows backslashes and strip whitespace."""
    return path_str.replace("\\", "/").strip()

def resolves_outside_docs(file_path: str, href: str) -> bool:
    """Return True if href, resolved relative to file_path, is outside DOCS_DIR."""
    file_dir = os.path.dirname(file_path)
    href_norm = normalize_path(href)
    resolved = os.path.normpath(os.path.join(file_dir, href_norm))
    # Strip anchor fragments
    if '#' in resolved:
        resolved = resolved[:resolved.index('#')]
    return not resolved.startswith(DOCS_DIR)

def convert_link_to_code(match: re.Match, file_path: str) -> str:
    text = match.group(1)
    href = match.group(2)
    # Skip URLs and anchors
    if href.startswith(('http://', 'https://', 'mailto:', '#')):
        return match.group(0)
    # Check if it escapes docs/
    if not resolves_outside_docs(file_path, href.split('#')[0]):
        return match.group(0)
    # Convert to code — use the basename as the code text if text == basename
    basename = os.path.basename(normalize_path(href.split('#')[0]))
    # Use the link text if it's descriptive, fall back to basename
    # Case-insensitive comparison
    code_text = text if text.lower() != basename.lower() else basename
    return f'`{code_text}`'

def process_file(file_path: str, dry_run: bool = False) -> int:
    with open(file_path, encoding='utf-8') as f:
        content = f.read()

    # Don't touch content inside fenced code blocks or inline code
    # Split into code / non-code segments with DOTALL to safely handle CRLF line endings
    parts = re.split(r'(```[\s\S]*?```|`[^`]+`)', content, flags=re.DOTALL)
    changed = 0
    new_parts = []
    for i, part in enumerate(parts):
        if i % 2 == 1:  # code block or inline code — leave alone
            new_parts.append(part)
        else:
            def replacer(m):
                nonlocal changed
                replacement = convert_link_to_code(m, file_path)
                if replacement != m.group(0):
                    changed += 1
                    # Using -> instead of utf-8 arrow to prevent Windows console encoding errors
                    print(f"  [{os.path.relpath(file_path, os.path.dirname(DOCS_DIR))}] "
                          f"{m.group(0)!r} -> {replacement!r}")
                return replacement
            new_parts.append(LINK_RE.sub(replacer, part))

    if changed and not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(''.join(new_parts))

    return changed

def main():
    dry_run = '--dry-run' in sys.argv
    total = 0
    for root, dirs, files in os.walk(DOCS_DIR):
        # Skip site folder
        dirs[:] = [d for d in dirs if d not in ('site',)]
        for fn in files:
            if fn.endswith('.md'):
                fp = os.path.join(root, fn)
                n = process_file(fp, dry_run=dry_run)
                total += n

    print(f"\nTotal links converted: {total}")
    if dry_run:
        print("(dry run — no files modified)")

if __name__ == '__main__':
    main()
