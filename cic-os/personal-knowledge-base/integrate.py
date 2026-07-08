#!/usr/bin/env python3
"""
Knowledge Base Integration Layer
Builds cross-references, detects duplicates, generates unified index.

Reads wiki/ (7 curated) + docs/ (auto-generated)
Outputs: wiki/index-unified.md, _integration/cross-refs.json, _integration/report.json
"""

import json
import re
import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import hashlib


class KBIntegrator:
    def __init__(self, config_path="integration-config.json", base_dir=None):
        # Auto-detect base_dir if not provided
        if base_dir is None:
            base_dir = self._find_base_dir()

        # Set base to dev root, not personal-knowledge-base
        self.dev_root = Path(base_dir)
        self.base_dir = self.dev_root / "cic-os" / "personal-knowledge-base"
        self.wiki_dir = self.base_dir / "wiki"
        self.docs_dir = self.dev_root / "docs"
        self.integration_dir = self.base_dir / "_integration"

        # Load config
        self.config = self._load_config(config_path)

        # Data structures
        self.pages = {}  # path -> {title, topics, content}
        self.cross_refs = defaultdict(list)
        self.duplicates = []

    def _find_base_dir(self):
        """Auto-detect the base directory by looking for docs/ folder."""
        # Try environment variable first
        if "KB_BASE_DIR" in os.environ:
            return os.environ["KB_BASE_DIR"]

        # Try walking up from current working directory
        current = Path.cwd()
        for _ in range(5):  # Walk up max 5 levels
            if (current / "docs").exists() and (current / "cic-os").exists():
                return current
            current = current.parent

        # Fall back to current directory
        return Path.cwd()

    def _load_config(self, config_path):
        """Load integration configuration."""
        path = self.base_dir / config_path
        if path.exists():
            with open(path) as f:
                return json.load(f)
        return self._default_config()

    def _default_config(self):
        """Return default configuration."""
        return {
            "topic_patterns": {
                "api": ["api", "endpoint", "function", "interface", "method", "call"],
                "agent": ["agent", "agents", "actor", "service"],
                "batch": ["batch", "phase", "stage", "processing"],
                "pipeline": ["pipeline", "flow", "workflow", "process"],
                "data": ["data", "database", "storage", "schema", "table"],
                "auth": ["auth", "auth", "oauth", "login", "permission"],
                "error": ["error", "exception", "fail", "catch", "throw"],
            },
            "cross_reference_rules": {
                "min_topic_overlap": 2,
                "min_similarity_score": 0.3,
            },
            "exclude_patterns": ["_archive", "node_modules", "coverage", ".git"],
            "output_paths": {
                "unified_index": "wiki/index-unified.md",
                "cross_refs": "_integration/cross-refs.json",
                "report": "_integration/report.json",
            }
        }

    def log(self, msg, level="INFO"):
        ts = datetime.now().isoformat()
        print(f"[{ts}] {level}: {msg}")

    def run(self):
        """Execute full integration workflow."""
        self.log("Starting Knowledge Base Integration")

        # Scan wiki and docs
        self.log("Scanning wiki/ and docs/ directories...")
        self._scan_wiki()
        self._scan_docs()

        # Build cross-references
        self.log(f"Processing {len(self.pages)} pages...")
        self._build_cross_references()

        # Detect duplicates
        self._detect_duplicates()

        # Generate outputs
        self._generate_unified_index()
        self._save_cross_refs()
        self._save_report()

        self.log("✅ Integration complete", "SUCCESS")

    def _scan_wiki(self):
        """Scan wiki/ for markdown files."""
        if not self.wiki_dir.exists():
            self.log(f"Warning: {self.wiki_dir} not found", "WARN")
            return

        for md_file in self.wiki_dir.rglob("*.md"):
            if any(excl in str(md_file) for excl in self.config["exclude_patterns"]):
                continue

            try:
                content = md_file.read_text(encoding="utf-8")
                title = self._extract_title(content, md_file.name)
                topics = self._extract_topics(content)

                rel_path = md_file.relative_to(self.base_dir)
                self.pages[str(rel_path)] = {
                    "title": title,
                    "topics": topics,
                    "content": content,
                    "source": "wiki",
                    "hash": hashlib.md5(content.encode()).hexdigest()
                }
            except Exception as e:
                self.log(f"Error reading {md_file}: {e}", "WARN")

    def _scan_docs(self):
        """Scan docs/ for markdown files."""
        if not self.docs_dir.exists():
            self.log(f"Warning: {self.docs_dir} not found", "WARN")
            return

        for md_file in self.docs_dir.rglob("*.md"):
            if any(excl in str(md_file) for excl in self.config["exclude_patterns"]):
                continue

            try:
                content = md_file.read_text(encoding="utf-8")
                title = self._extract_title(content, md_file.name)
                topics = self._extract_topics(content)

                rel_path = md_file.relative_to(self.dev_root)
                self.pages[str(rel_path)] = {
                    "title": title,
                    "topics": topics,
                    "content": content,
                    "source": "docs",
                    "hash": hashlib.md5(content.encode()).hexdigest()
                }
            except Exception as e:
                self.log(f"Error reading {md_file}: {e}", "WARN")

    def _extract_title(self, content, filename):
        """Extract title from markdown content."""
        # Try to find H1 header
        match = re.search(r"^# +(.+)$", content, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return filename

    def _extract_topics(self, content):
        """Extract topics from content based on patterns."""
        topics = set()
        content_lower = content.lower()

        for topic_name, keywords in self.config["topic_patterns"].items():
            for keyword in keywords:
                if keyword in content_lower:
                    topics.add(topic_name)

        return list(topics)

    def _build_cross_references(self):
        """Build cross-reference mappings."""
        min_overlap = self.config["cross_reference_rules"]["min_topic_overlap"]

        # For each wiki page, find docs pages with topic overlap
        for wiki_path, wiki_data in self.pages.items():
            if wiki_data["source"] != "wiki":
                continue

            wiki_topics = set(wiki_data["topics"])
            matches = []

            for docs_path, docs_data in self.pages.items():
                if docs_data["source"] != "docs":
                    continue

                docs_topics = set(docs_data["topics"])
                overlap = wiki_topics & docs_topics

                if len(overlap) >= min_overlap:
                    matches.append({
                        "path": docs_path,
                        "title": docs_data["title"],
                        "common_topics": list(overlap),
                        "overlap_count": len(overlap)
                    })

            if matches:
                # Sort by overlap count
                matches.sort(key=lambda x: x["overlap_count"], reverse=True)
                self.cross_refs[wiki_path] = matches[:5]  # Top 5

    def _detect_duplicates(self):
        """Detect pages with high topic overlap (duplicates)."""
        min_score = self.config["cross_reference_rules"]["min_similarity_score"]
        processed = set()

        for path1, data1 in self.pages.items():
            if path1 in processed:
                continue

            for path2, data2 in self.pages.items():
                if path2 <= path1 or path2 in processed:  # Avoid duplicates in pairs
                    continue

                topics1 = set(data1["topics"])
                topics2 = set(data2["topics"])

                if not topics1 or not topics2:
                    continue

                overlap = len(topics1 & topics2)
                union = len(topics1 | topics2)
                similarity = overlap / union if union > 0 else 0

                if similarity >= min_score:
                    self.duplicates.append({
                        "path1": path1,
                        "title1": data1["title"],
                        "path2": path2,
                        "title2": data2["title"],
                        "common_topics": list(topics1 & topics2),
                        "similarity_score": round(similarity, 2),
                        "action": "Review for merge or cross-link"
                    })

            processed.add(path1)

    def _generate_unified_index(self):
        """Generate unified master index."""
        index_lines = [
            "# Unified Knowledge Index",
            "",
            "_Last Updated: {}_ | Generated by Knowledge Base Integration".format(
                datetime.now().isoformat()
            ),
            "",
            "---",
            "",
            "## CIC Architecture (Hand-Curated)",
            "",
        ]

        # Add wiki pages
        for path, data in sorted(self.pages.items()):
            if data["source"] == "wiki":
                indent = "- " if path.count("/") == 1 else "  - "
                index_lines.append(f"{indent}[{data['title']}]({path})")

                # Add cross-refs if any
                if path in self.cross_refs:
                    for ref in self.cross_refs[path][:3]:
                        index_lines.append(f"    - Related: [{ref['title']}]({ref['path']})")

        index_lines.extend([
            "",
            "---",
            "",
            "## Code & Operations (Auto-Generated)",
            "",
        ])

        # Add docs pages (sample)
        doc_count = 0
        for path, data in sorted(self.pages.items()):
            if data["source"] == "docs" and doc_count < 20:
                index_lines.append(f"- [{data['title']}]({path})")
                doc_count += 1

        if doc_count > 20:
            index_lines.append(f"- _... and {len([p for p, d in self.pages.items() if d['source'] == 'docs']) - 20} more_")

        # Write unified index
        output_path = self.base_dir / self.config["output_paths"]["unified_index"]
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text("\n".join(index_lines), encoding="utf-8")
        self.log(f"Generated: {output_path}")

    def _save_cross_refs(self):
        """Save cross-reference mappings as JSON."""
        output_path = self.base_dir / self.config["output_paths"]["cross_refs"]
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert defaultdict to regular dict
        cross_refs_dict = {k: v for k, v in self.cross_refs.items()}

        with open(output_path, "w") as f:
            json.dump(cross_refs_dict, f, indent=2)

        self.log(f"Generated: {output_path}")

    def _save_report(self):
        """Save integration analysis report."""
        report = {
            "generated": datetime.now().isoformat(),
            "summary": {
                "total_pages": len(self.pages),
                "wiki_pages": sum(1 for d in self.pages.values() if d["source"] == "wiki"),
                "docs_pages": sum(1 for d in self.pages.values() if d["source"] == "docs"),
                "cross_references": len(self.cross_refs),
                "duplicate_groups": len(self.duplicates),
            },
            "duplicates": self.duplicates,
            "recommendations": self._generate_recommendations(),
        }

        output_path = self.base_dir / self.config["output_paths"]["report"]
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            json.dump(report, f, indent=2)

        self.log(f"Generated: {output_path}")

    def _generate_recommendations(self):
        """Generate actionable recommendations."""
        recommendations = []

        if self.duplicates:
            recommendations.append({
                "category": "Duplicates",
                "count": len(self.duplicates),
                "action": "Review detected duplicates and consider merging or cross-linking similar pages"
            })

        # Check for wiki pages with no cross-refs
        unreferenced = [p for p in self.cross_refs if not self.cross_refs[p]]
        if unreferenced:
            recommendations.append({
                "category": "Coverage Gaps",
                "count": len(unreferenced),
                "action": f"Add documentation for: {', '.join([Path(p).stem for p in unreferenced[:3]])}"
            })

        return recommendations


def main():
    import sys
    if sys.platform.startswith('win'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except AttributeError:
            pass
    integrator = KBIntegrator()
    integrator.run()


if __name__ == "__main__":
    main()
