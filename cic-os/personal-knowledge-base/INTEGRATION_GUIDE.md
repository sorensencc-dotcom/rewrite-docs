# Knowledge Base Integration — Quick Reference

**Last Updated:** 2026-06-30  
**Version:** 1.0

---

## One-Minute Start

```bash
cd C:\dev\cic-os\personal-knowledge-base
python3 sync-all.py
```

Check results:
```bash
cat wiki/index-unified.md                # Master index
cat _integration/report.json             # Analysis
```

---

## Daily Workflow

### Option A: Automatic (Recommended)
Nightly scheduler runs `python3 sync-all.py` at 8 AM.

**You:** Review `_integration/report.json` for duplicates/gaps.

### Option B: Manual
```bash
# After code changes
python3 sync-all.py

# After manual wiki edits only
python3 integrate.py

# After documentation updates only
python3 sync.py
```

---

## Common Tasks

### Find Duplicate Pages
```bash
cat _integration/report.json | grep -A 10 '"duplicates"'
```

Each entry shows pages with >30% topic overlap (by default).

### Review Cross-References
```bash
cat _integration/cross-refs.json | less
```

Shows which docs/ pages are related to each wiki/ page.

### Check Coverage Gaps
```bash
cat _integration/report.json | grep -A 5 '"recommendations"'
```

Lists topics that need more documentation.

### Update Topic Patterns
Edit `integration-config.json`:
```json
"topic_patterns": {
  "my_domain": ["term1", "term2", "term3"]
}
```

Then re-run:
```bash
python3 integrate.py
```

---

## File Locations

| File | Purpose | Edit? |
|------|---------|-------|
| `sync.py` | Original wiki sync (unchanged) | No |
| `integrate.py` | Cross-ref builder (new) | Only for bugs |
| `sync-all.py` | Orchestrator (new) | No |
| `integration-config.json` | Configuration | **Yes** |
| `SKILL.md` | Task documentation | Rarely |
| `INTEGRATION_GUIDE.md` | This file | Rarely |

---

## Configuration Tuning

### I'm getting too many duplicates

**Problem:** `_integration/report.json` has >10 duplicates.

**Solution:** Increase similarity threshold in `integration-config.json`:
```json
"min_similarity_score": 0.5  # Was 0.3
```

Re-run:
```bash
python3 integrate.py
```

### I'm missing cross-references

**Problem:** Expected docs/ pages aren't linked in `cross-refs.json`.

**Solution:** Lower topic overlap requirement:
```json
"min_topic_overlap": 1  # Was 2
```

Or add more keywords to topic patterns:
```json
"topic_patterns": {
  "existing_topic": [...existing..., "new_keyword"]
}
```

Re-run:
```bash
python3 integrate.py
```

---

## Understanding the Outputs

### wiki/index-unified.md
**What it is:** Master table of contents  
**Why it matters:** Single entry point for all documentation  
**Who uses it:** Team references, onboarding, search starting points  

```markdown
## CIC Architecture
- [Overview](wiki/cic/overview.md)
  - Related: [Component Ref](docs/reference/...)
```

### _integration/cross-refs.json
**What it is:** Topic-to-page mappings (machine-readable)  
**Why it matters:** Powers search, audit automation, discovery tools  
**Format:** 
```json
{
  "wiki/cic/agents.md": [
    {"path": "docs/api/agents.md", "common_topics": ["agent", "api"]}
  ]
}
```

### _integration/report.json
**What it is:** Analysis summary (duplicates, gaps, stats)  
**Why it matters:** Identifies improvement opportunities  
**Key sections:**
- `summary` — Page counts and stats
- `duplicates` — Pages with >30% topic overlap
- `recommendations` — Actionable next steps

---

## Troubleshooting

### Error: "FileNotFoundError: docs/"

**Cause:** docs/ is not at expected location (C:\dev\docs).

**Fix:** Edit line 14 in `integrate.py`:
```python
self.docs_dir = Path("C:\\path\\to\\actual\\docs")
```

### Error: "No pages found"

**Cause:** wiki/ is empty or no .md files exist.

**Fix:** Check wiki/ has markdown files:
```bash
ls wiki/
```

### Missing output files

**Cause:** Integration stage failed silently.

**Fix:** Run with error output:
```bash
python3 integrate.py 2>&1 | tail -20
```

### Duplicates don't make sense

**Cause:** Topic patterns are too broad or overtuned.

**Fix:**
1. Review which topics overlap: `cat _integration/report.json`
2. Edit `integration-config.json` to refine patterns
3. Re-run: `python3 integrate.py`

---

## Performance

### Typical Runtime
- **sync.py only:** <5 seconds (incremental)
- **integrate.py only:** 5-10 seconds (150 pages)
- **sync-all.py:** 10-15 seconds (full run)

### Optimize for Speed
If running frequently, use specific stages:
```bash
# Fast sync only (no integration)
python3 sync.py

# Later, update cross-refs
python3 integrate.py
```

---

## Editing Source Files

### Adding a New Wiki Source
1. Add .md file to C:\dev\
2. Update `sync.py` source paths (if not auto-detected)
3. Run `python3 sync-all.py`

### Removing a Topic Category
1. Remove from `topic_patterns` in `integration-config.json`
2. Run `python3 integrate.py`

### Updating Docs
1. Edit docs/ files as usual
2. docs-manager will sync automatically (via GitHub Actions)
3. Next `python3 sync-all.py` will pick up changes

---

## Integration with Other Tools

### Use cross-refs.json in Search
```bash
# Find all docs related to "agents"
cat _integration/cross-refs.json | jq '.[] | select(.path | contains("agent"))'
```

### Use report.json for Audits
```bash
# Count duplicates
cat _integration/report.json | jq '.summary.duplicate_groups'

# List gaps
cat _integration/report.json | jq '.recommendations'
```

### Use unified index in Team Docs
Copy `wiki/index-unified.md` to:
- Team wiki
- Onboarding docs
- Project README

---

## Scheduling (Windows Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. **Name:** KB Sync Nightly
4. **Trigger:** Daily at 8:00 AM
5. **Action:**
   - Program: `python`
   - Args: `C:\dev\cic-os\personal-knowledge-base\sync-all.py`
   - Start in: `C:\dev\cic-os\personal-knowledge-base`
6. Save

---

## Scheduling (Linux/Mac Cron)

```bash
# Add to crontab
crontab -e

# Paste:
0 8 * * * cd /path/to/cic-os/personal-knowledge-base && python3 sync-all.py >> /tmp/kb-sync.log 2>&1
```

---

## Support

- **Error messages?** Check output: `python3 sync-all.py 2>&1`
- **Config questions?** See `integration-config.json` comments
- **Full docs?** Read `SKILL.md` or `SYNC_ANALYSIS.md`

---

**Questions?** Check SKILL.md for the full documentation.
