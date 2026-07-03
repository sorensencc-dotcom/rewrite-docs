---
title: "VAULT README"
summary: "# Obsidian Vault Setup"
created: "2026-07-03T19:43:46.141Z"
updated: "2026-07-03T19:43:46.141Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Obsidian Vault Setup

## Architecture

This Obsidian vault is a **read-only reference layer** for CIC and Rewrite Labs documentation.

- **Source of truth:** OneDrive/Drive living docs (CIC_SYSTEM.md, REWRITE_LABS_SYSTEM.md, STATE files)
- **Vault role:** Stable architecture documentation, cross-linking, research reference
- **Sync method:** Automated via `sync.py` (runs nightly)
- **No volatile state:** Task lists, file paths, version numbers, progress tracking stay in living docs

## Folder Structure

```
/cic-ref/          — CIC system docs (synced from root)
/architecture/     — Design patterns and architectural decisions
/rl-ref/           — Rewrite Labs reference (reserved)
00-INDEX.md        — Vault navigation (auto-generated)
```

## Key Files

- **00-INDEX.md** — Main entry point with backlinks to all system docs
- **cic-ref/BUILD-SUMMARY.md** — CIC architecture overview
- **cic-ref/AGENTS.md** — Agent patterns and definitions
- **cic-ref/ROADMAP.md** — CIC phase planning

## Backlinks & Graph View

Use Obsidian's graph view to visualize how CIC phases, extractors, and RL workflows relate. Backlinks help navigate between concepts.

## Sync Workflow

`sync.py` runs automatically (nightly scheduled task). It:
1. Detects changed files in C:\dev root
2. Updates the wiki/ directory
3. Copies to cic-ref/ for Obsidian
4. Regenerates 00-INDEX.md with current timestamp

## Memory Governance

- ✅ Store in vault: Architecture, patterns, system design, research findings
- ❌ DO NOT store in vault: Task progress, file versions, paths, ingestion status, outreach lists

Rationale: Obsidian + graph are great for reference and exploration. Living docs handle operational state.
