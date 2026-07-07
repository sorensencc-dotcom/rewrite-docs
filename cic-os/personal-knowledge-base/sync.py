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
4. Generate _integration/report.json with findings
5. Support nightly sync via sync-all.py
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import hashlib

class KBSync:
    def __init__(self, base_dir="C:\\dev"):
        self.base_dir = Path(base_dir)
        self.docs_dir = self.base_dir / "docs"
        self.integration_dir = self.base_dir / "cic-os" / "personal-knowledge-base" / "_integration"

        # Target directories (new consolidated structure)
        self.target_dirs = [
            self.docs_dir / "reference",
            self.docs_dir / "api",
            self.docs_dir / "security",
            self.docs_dir / "dashboards",
            self.docs_dir / "cic",
        ]

        # Ignore patterns
        self.ignore_patterns = ["wiki", "_archive", "legacy", "_integration", "node_modules", ".git"]

        # Data structures
        self.pages = {}  # path -> {title, content, links}
        self.all_links = set()  # All valid link targets
        self.broken_links = []  # Found broken references
        self.case_normalizations = []  # Uppercase → lowercase conversions found

    def log(self, msg, level="INFO"):
        """Simple logging."""
        ts = datetime.now().isoformat()
        print(f"[{ts}] {level}: {msg}")

    def should_ignore(self, path):
        """Check if path should be ignored."""
        path_str = str(path).lower()
        return any(pattern in path_str for pattern in self.ignore_patterns)

    def scan_pages(self):
        """Scan target directories for markdown files."""
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
                    # Extract title (first H1)
                    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
                    title = title_match.group(1) if title_match else md_file.stem

                    # Extract links (markdown and frontmatter references)
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
        """Extract markdown links and references."""
        links = set()

        # Markdown links: [text](path/to/file.md)
        for match in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", content):
            link = match.group(2)
            # Normalize: remove anchors, convert to lowercase
            link = link.split("#")[0].lower()
            if link and not link.startswith(("http://", "https://", "/")):
                links.add(link)

        # Wikilink-style: [[path/to/file|Display Text]]
        for match in re.finditer(r"\[\[([^\]|]+)", content):
            link = match.group(1).lower()
            if link:
                links.add(link)

        return links

    def build_link_index(self):
        """Build index of all valid link targets."""
        self.log("Building link index")

        # All markdown files are valid targets
        for page_path, page_data in self.pages.items():
            rel_path = page_data["rel_path"]
            self.all_links.add(str(rel_path).lower())
            # Also add without extension
            self.all_links.add(str(rel_path.with_suffix("")).lower())

        self.log(f"✅ Built index with {len(self.all_links)} valid targets")

    def validate_links(self):
        """Validate all links found in pages."""
        self.log("Validating links")
        broken_count = 0

        for page_path, page_data in self.pages.items():
            for link in page_data["links"]:
                if not self._is_valid_link(link):
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

    def _is_valid_link(self, link):
        """Check if a link target exists."""
        # Normalize
        link = link.lower().strip()

        # Check direct match
        if link in self.all_links:
            return True

        # Check with .md extension
        if f"{link}.md" in self.all_links:
            return True

        # Check as directory reference (e.g., "cic/phases" → "cic/phases/index.md")
        if f"{link}/index.md" in self.all_links:
            return True

        return False

    def detect_case_issues(self):
        """Detect uppercase references that should be lowercase."""
        self.log("Detecting case normalization issues")

        # Scan for uppercase paths in content
        uppercase_pattern = re.compile(r"[A-Z_]{3,}")  # 3+ uppercase letters or underscores

        for page_path, page_data in self.pages.items():
            content = Path(page_path).read_text(encoding="utf-8")
            for match in uppercase_pattern.finditer(content):
                potential_reference = match.group(0)
                lowercase_version = potential_reference.lower()

                # Check if lowercase version exists as a file
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
        """Generate integration report."""
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
            "broken_links": self.broken_links[:50],  # Top 50
            "case_normalizations": self.case_normalizations[:20],  # Top 20
            "recommendations": self._generate_recommendations(),
        }

        report_path = self.integration_dir / "report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        self.log(f"✅ Report written to {report_path}")
        return report

    def _generate_recommendations(self):
        """Generate actionable recommendations."""
        recs = []

        if self.broken_links:
            recs.append({
                "priority": "HIGH",
                "action": "Fix broken links",
                "details": f"{len(self.broken_links)} broken references found. Review _integration/report.json.",
            })

        if self.case_normalizations:
            recs.append({
                "priority": "MEDIUM",
                "action": "Normalize case in references",
                "details": f"{len(self.case_normalizations)} uppercase references should be lowercase.",
            })

        if len(self.pages) == 0:
            recs.append({
                "priority": "CRITICAL",
                "action": "No pages found",
                "details": "Ensure docs/cic/, docs/reference/, docs/api/, docs/security/, docs/dashboards/ exist and contain .md files.",
            })

        if len(recs) == 0:
            recs.append({
                "priority": "INFO",
                "action": "Knowledge base healthy",
                "details": f"All {len(self.pages)} pages scanned successfully with no issues.",
            })

        return recs

    def run(self):
        """Execute full sync workflow."""
        self.log("=" * 60)
        self.log("CIC Knowledge Base Sync (Post-Consolidation)")
        self.log("=" * 60)

        # Stage 1: Scan pages
        page_count = self.scan_pages()
        if page_count == 0:
            self.log("❌ CRITICAL: No pages found. Aborting.", "ERROR")
            return False

        # Stage 2: Build link index
        self.build_link_index()

        # Stage 3: Validate links
        broken = self.validate_links()

        # Stage 4: Detect case issues
        self.detect_case_issues()

        # Stage 5: Generate report
        report = self.generate_report()

        # Summary
        self.log("=" * 60)
        self.log(f"Summary: {report['summary']}")
        self.log("=" * 60)

        return report['summary']['status'] == 'HEALTHY'

def main():
    import sys
    sync = KBSync()
    success = sync.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
