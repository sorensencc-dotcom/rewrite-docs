#!/usr/bin/env python3
"""
Knowledge Base Sync — Post-Consolidation (Waves A–F)
Operates on the new consolidated docs structure.

Scans: docs/reference/, docs/api/, docs/security/, docs/dashboards/, docs/cic/
Ignores: wiki/, _archive/, legacy/

Tasks:
1. Normalize case (uppercase → lowercase references)
2. Validate links across consolidated docs
3. Detect broken references in docs/cic/index.md and phase files
4. Generate _integration/sync-report.json with findings
5. Support nightly sync via sync-all.py
"""

import json
import re
import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import hashlib


class KBSync:
    def __init__(self, base_dir=None):
        if base_dir is None:
            base_dir = self._find_base_dir()

        self.base_dir = Path(base_dir)
        self.docs_dir = self.base_dir / "docs"
        self.integration_dir = self.base_dir / "cic-os" / "personal-knowledge-base" / "_integration"

        self.target_dirs = [
            self.docs_dir / "reference",
            self.docs_dir / "api",
            self.docs_dir / "security",
            self.docs_dir / "dashboards",
            self.docs_dir / "cic",
        ]

        self.ignore_patterns = ["wiki", "_archive", "legacy", "_integration", "node_modules", ".git"]

        self.pages = {}
        self.all_links = set()
        self.broken_links = []
        self.case_normalizations = []

    def _find_base_dir(self):
        if "KB_BASE_DIR" in os.environ:
            return os.environ["KB_BASE_DIR"]

        current = Path.cwd()
        for _ in range(5):
            if (current / "docs").exists() and (current / "cic-os").exists():
                return current
            current = current.parent

        return Path.cwd()

    def log(self, msg, level="INFO"):
        ts = datetime.now().isoformat()
        print(f"[{ts}] {level}: {msg}")

    def should_ignore(self, path):
        path_str = str(path).lower()
        return any(pattern in path_str for pattern in self.ignore_patterns)

    def scan_pages(self):
        self.log("Starting page scan across consolidated docs")
        count = 0

        for target_dir in self.target_dirs:
            if not target_dir.exists():
                self.log(f"⚠️  Target dir not found: {target_dir}", "WARN")
                continue

            for md_file in target_dir.rglob("*.md"):
                if self.should_ignore(md_file):
                    continue

                try:
                    content = md_file.read_text(encoding="utf-8")
                    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
                    title = title_match.group(1) if title_match else md_file.stem

                    links = self._extract_links(content)

                    self.pages[str(md_file)] = {
                        "title": title,
                        "content_hash": hashlib.md5(content.encode()).hexdigest(),
                        "links": links,
                        "rel_path": md_file.relative_to(self.docs_dir),
                    }
                    count += 1

                except Exception as e:
                    self.log(f"❌ Error reading {md_file}: {e}", "ERROR")

        self.log(f"✅ Scanned {count} pages")
        return count

    def _extract_links(self, content):
        links = set()

        for match in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", content):
            link = match.group(2)
            link = link.split("#")[0].lower()
            if link and not link.startswith(("http://", "https://", "/")):
                links.add(link)

        for match in re.finditer(r"\[\[([^\]|]+)", content):
            link = match.group(1).lower()
            if link:
                links.add(link)

        return links

    def build_link_index(self):
        self.log("Building link index")

        for page_path, page_data in self.pages.items():
            rel_path = page_data["rel_path"]
            self.all_links.add(str(rel_path).lower())
            self.all_links.add(str(rel_path.with_suffix("")).lower())

        self.log(f"✅ Built index with {len(self.all_links)} valid targets")

    def validate_links(self):
        self.log("Validating links")
        broken_count = 0

        for page_path, page_data in self.pages.items():
            source_dir = page_data["rel_path"].parent
            for link in page_data["links"]:
                if not self._is_valid_link(link, source_dir):
                    self.broken_links.append({
                        "source": str(page_data["rel_path"]),
                        "target": link,
                        "type": "broken_reference",
                    })
                    broken_count += 1

        if broken_count > 0:
            self.log(f"⚠️  Found {broken_count} broken links", "WARN")
        else:
            self.log("✅ All links valid")

        return broken_count

    def _resolve_relative_path(self, link, source_dir):
        link_lower = link.lower()

        if link_lower.startswith("../"):
            parts = link_lower.split("/")
            current_dir = source_dir

            for part in parts:
                if part == "..":
                    current_dir = current_dir.parent

            remaining = "/".join([p for p in parts if p != ".."])
            return str(current_dir / remaining).lower() if remaining else str(current_dir).lower()
        else:
            return str(source_dir / link_lower).lower()

    def _is_valid_link(self, link, source_dir):
        link_normalized = link.lower().strip()

        resolved = self._resolve_relative_path(link_normalized, source_dir)

        if resolved in self.all_links:
            return True

        if f"{resolved}.md" in self.all_links:
            return True

        if f"{resolved}/index.md" in self.all_links:
            return True

        return False

    def detect_case_issues(self):
        self.log("Detecting case normalization issues")

        uppercase_pattern = re.compile(r"[A-Z_]{3,}")

        for page_path, page_data in self.pages.items():
            content = Path(page_path).read_text(encoding="utf-8")
            for match in uppercase_pattern.finditer(content):
                potential_reference = match.group(0)
                lowercase_version = potential_reference.lower()

                if lowercase_version in self.all_links or f"{lowercase_version}.md" in self.all_links:
                    self.case_normalizations.append({
                        "source": str(page_data["rel_path"]),
                        "uppercase": potential_reference,
                        "lowercase": lowercase_version,
                        "suggestion": f"Replace '{potential_reference}' with '{lowercase_version}'",
                    })

        if self.case_normalizations:
            self.log(f"⚠️  Found {len(self.case_normalizations)} case normalization opportunities", "WARN")
        else:
            self.log("✅ No case normalization issues")

    def generate_report(self):
        self.log("Generating report")

        self.integration_dir.mkdir(parents=True, exist_ok=True)

        report = {
            "timestamp": datetime.now().isoformat(),
            "version": "2.0-post-consolidation",
            "summary": {
                "total_pages": len(self.pages),
                "broken_links": len(self.broken_links),
                "case_normalizations": len(self.case_normalizations),
                "status": "HEALTHY" if len(self.broken_links) == 0 else "ISSUES_FOUND",
            },
            "target_directories": [str(d.relative_to(self.base_dir)) for d in self.target_dirs],
            "broken_links": self.broken_links,
            "case_normalizations": self.case_normalizations[:20],
            "recommendations": self._generate_recommendations(),
        }

        report_path = self.integration_dir / "sync-report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        self.log(f"✅ Report written to {report_path}")
        return report

    def _generate_recommendations(self):
        recs = []

        if self.broken_links:
            recs.append({
                "priority": "HIGH",
                "action": "Fix broken links",
                "details": f"{len(self.broken_links)} broken references found.",
            })

        if self.case_normalizations:
            recs.append({
                "priority": "MEDIUM",
                "action": "Normalize case",
                "details": f"{len(self.case_normalizations)} uppercase refs should be lowercase.",
            })

        if len(self.pages) == 0:
            recs.append({
                "priority": "CRITICAL",
                "action": "No pages found",
                "details": "Ensure docs/ folders contain .md files.",
            })

        if len(recs) == 0:
            recs.append({
                "priority": "INFO",
                "action": "Knowledge base healthy",
                "details": f"All {len(self.pages)} pages scanned with no issues.",
            })

        return recs

    def run(self):
        self.log("=" * 60)
        self.log("CIC Knowledge Base Sync (Post-Consolidation)")
        self.log("=" * 60)

        page_count = self.scan_pages()
        if page_count == 0:
            self.log("❌ CRITICAL: No pages found.", "ERROR")
            return False

        self.build_link_index()
        broken = self.validate_links()
        self.detect_case_issues()
        report = self.generate_report()

        self.log("=" * 60)
        self.log(f"Summary: {report['summary']}")
        self.log("=" * 60)

        return report['summary']['status'] == 'HEALTHY'


def main():
    import sys
    if sys.platform.startswith('win'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except AttributeError:
            pass
    sync = KBSync()
    success = sync.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
