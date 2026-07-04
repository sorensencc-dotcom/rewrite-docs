---
name: kb-sync-nightly
description: Sync personal knowledge base docs with integrated cross-reference layer
---

# Knowledge Base Sync (Integrated)

Run the integrated knowledge base sync with cross-reference analysis.

## Quick Command

```bash
cd C:\dev\cic-os\personal-knowledge-base
python3 sync-all.py
```

## What It Does

Executes a two-stage pipeline:

### Stage 1: Wiki Sync (sync.py)
- Reads 7 predetermined CIC architecture documents from C:\dev root
- Detects changes using MD5 file hashing (incremental updates)
- Synthesizes each doc with summary + source attribution + timestamp
- Outputs: `wiki/cic/*.md`, `wiki/index.md`, `sources/.sync-state.json`

### Stage 2: Integration Layer (integrate.py) — NEW
- Scans `wiki/` (hand-curated) + `docs/` (auto-generated)
- Extracts topics from content using configurable patterns
- Builds cross-reference index (wiki ↔ docs)
- Detects duplicate topics (>30% similarity by default)
- Generates analysis and recommendations

## Output Files

### After sync-all.py:

```
wiki/
├── cic/
│   ├── overview.md
│   ├── agents.md
│   ├── agents-api.md
│   ├── environment.md
│   ├── observability.md
│   ├── token-packs.md
│   └── roadmap.md
├── index.md                    # (from sync.py)
├── index-unified.md            # (from integrate.py) ← UNIFIED INDEX
└── ...

_integration/
├── cross-refs.json             # Topic mappings (machine-readable)
├── report.json                 # Duplicates, gaps, recommendations
└── ...
```

### Key Files to Review

| File | Purpose | Use Case |
|------|---------|----------|
| `wiki/index-unified.md` | Master table of contents | Team reference, new member onboarding |
| `_integration/report.json` | Integration analysis | Find duplicates, identify coverage gaps |
| `_integration/cross-refs.json` | Topic-to-page mappings | Power search tools, audit automation |

## Running Specific Stages

```bash
# Wiki sync only (fast, incremental)
python3 sync.py

# Integration analysis only (after manual wiki edit)
python3 integrate.py

# Both stages (recommended)
python3 sync-all.py
```

## Automation

### Nightly Schedule

Add to cron/Windows Task Scheduler:

```bash
# Unix/Linux (crontab)
0 8 * * * cd /path/to/cic-os/personal-knowledge-base && python3 sync-all.py

# Windows Task Scheduler
0 8 * * * cd C:\dev\cic-os\personal-knowledge-base && python3 sync-all.py
```

### After Each Code Update

Consider running after:
- Major documentation updates in C:\dev/
- New batch or agent implementations
- Significant code changes (docs-manager has run)

## Configuration

Edit `integration-config.json` to customize:

### Add Custom Topics

```json
"topic_patterns": {
  "machine-learning": ["ml", "neural", "model", "training", "inference"],
  "distributed": ["distributed", "cluster", "replica", "consensus"]
}
```

### Adjust Duplicate Detection

```json
"cross_reference_rules": {
  "min_topic_overlap": 3,      # More strict (require 3 common topics)
  "min_similarity_score": 0.5  # Stricter (50% similarity to flag)
}
```

Higher values = fewer matches (stricter).  
Lower values = more matches (more candidates).

### Filter Content

```json
"exclude_patterns": [
  "_archive",
  "old_docs",
  "draft"
]
```

## Output Examples

### wiki/index-unified.md (Sample)

```markdown
# Unified Knowledge Index

## CIC Architecture (Hand-Curated)
- [Overview](wiki/cic/overview.md)
  - Related: [CIC Architecture Diagram](docs/architecture/cic-layers.md)
  - Related: [Component Reference](docs/reference/components.md)
- [Agents](wiki/cic/agents.md)
  - Related: [Agent API Reference](docs/api/agents.md)

## Code & Operations (Auto-Generated)
- Batch Processing (20 pages)
- API Reference (35 pages)
- ... and 87 more
```

### _integration/report.json (Sample)

```json
{
  "summary": {
    "total_pages": 150,
    "wiki_pages": 7,
    "docs_pages": 143,
    "cross_references": 42,
    "duplicate_groups": 3
  },
  "duplicates": [
    {
      "path1": "wiki/cic/agents.md",
      "path2": "docs/api/agents.md",
      "similarity_score": 0.65,
      "action": "Review for merge or cross-link"
    }
  ],
  "recommendations": [
    {
      "category": "Coverage Gaps",
      "count": 8,
      "action": "Document: batch optimization, error handling patterns"
    }
  ]
}
```

## Troubleshooting

### "sync.py not found"
Ensure you're running from: `C:\dev\cic-os\personal-knowledge-base`

### "docs/ not found"
The integration layer expects docs/ at `C:\dev\docs`. If it's elsewhere, edit `integrate.py` line 14.

### "wiki/index-unified.md not generated"
Check `_integration/report.json` for errors. Ensure wiki/ has at least one .md file.

### Too many duplicates detected?
Increase `min_similarity_score` in `integration-config.json` (e.g., 0.5 instead of 0.3).

### Missing cross-references?
Lower `min_topic_overlap` in `integration-config.json` (e.g., 1 instead of 2).

## Next Steps

1. **First run:** Execute `python3 sync-all.py` and review `_integration/report.json`
2. **Adjust config:** Customize `integration-config.json` based on results
3. **Schedule:** Add to nightly automation
4. **Review duplicates:** Act on detected duplicates (merge, link, or keep separate)
5. **Expand scope:** Add more wiki sources beyond current 7 CIC files

## Phase 2 Opportunities

Future enhancements (not yet implemented):
- OneDrive ingestion (MS Graph API)
- Auto-cleanup for rough drafts
- Conflict resolution for duplicates
- Bi-directional sync (wiki edits → source docs)
- Unified search interface

## Support

- **integration-config.json** — Inline comments for each setting
- **INTEGRATION_GUIDE.md** — Daily operations quick reference
- **SYNC_ANALYSIS.md** — Architecture and design decisions
