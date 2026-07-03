# Rewrite Labs Reference Vault Setup

## Status: Ready for RL Documentation Sync

Created: 2026-07-02  
Last Updated: 2026-07-02

## Overview

This document describes the mirrored reference vault infrastructure for Rewrite Labs (RL), mirroring the existing CIC reference vault structure.

## Folder Structure

```
C:\dev\
├── cic-ref/                 # CIC reference documents (synced from OneDrive)
│   ├── BUILD-SUMMARY.md
│   ├── AGENTS.md
│   ├── AGENTS_API.md
│   ├── CIC_ENV_REFERENCE.md
│   ├── CIC_RUNTIME_OBSERVABILITY_PLAN.md
│   ├── CIC_TOKEN_PACK_v2_0_FULL_LIST.md
│   └── ROADMAP.md
│
├── rl-ref/                  # RL reference documents (synced from OneDrive)
│   └── [Awaiting RL docs]
│
├── architecture/            # Design patterns and architectural decisions
│   ├── cic-patterns/        # [To be populated]
│   └── rl-patterns/         # [To be populated]
│
└── 00-INDEX.md             # Main vault index with backlinks
```

## File Locations

### CIC Documents (Synced)
- Source: OneDrive/Drive living docs
- Local Mirror: `C:\dev\cic-ref\`
- Last Synced: 2026-07-02 10:42:39

### Rewrite Labs Documents (Pending)
- Source: To be determined (OneDrive/Drive/GitHub/local)
- Local Mirror: `C:\dev\rl-ref\`
- Status: Awaiting RL documentation location

### Architecture/Design Patterns (Manual)
- Location: `C:\dev\architecture\`
  - `cic-patterns/` - CIC design patterns and architectural decisions
  - `rl-patterns/` - RL design patterns and architectural decisions

## Vault Index

The main index file `C:\dev\00-INDEX.md` provides:
- Links to all CIC reference documents
- Links to all RL reference documents (when available)
- Cross-system query references
- Last sync timestamp

## Sync Configuration

### For CIC (Already Configured)
CIC documents are synced via an automated process. Files in `C:\dev\cic-ref\` are kept in sync with OneDrive source documents.

### For Rewrite Labs (Configuration Template)

Once RL documents location is confirmed, use this sync configuration:

```yaml
sync_targets:
  - name: "CIC Reference"
    source: "OneDrive/CIC Docs Folder"
    destination: "C:\\dev\\cic-ref"
    patterns:
      - "BUILD-SUMMARY.md"
      - "AGENTS.md"
      - "AGENTS_API.md"
      - "*ENV*.md"
      - "*OBSERVABILITY*.md"
      - "*TOKEN*.md"
      - "ROADMAP.md"
    
  - name: "Rewrite Labs Reference"
    source: "{{ RL_DOCS_SOURCE }}"  # Configure with actual location
    destination: "C:\\dev\\rl-ref"
    patterns:
      - "*.md"  # Adjust based on RL documentation structure
    enabled: false  # Enable when source is confirmed
```

## Common Cross-System Queries

The vault structure enables queries like:

1. **Extraction vs. Generation**
   - CIC: `cic-ref/BUILD-SUMMARY.md` → Extraction approach
   - RL: `rl-ref/[RL Architecture Docs]` → Generation approach

2. **Token Management**
   - CIC: `cic-ref/CIC_TOKEN_PACK_v2_0_FULL_LIST.md`
   - RL: `rl-ref/[RL Token Strategy]`

3. **Runtime Observability**
   - CIC: `cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md`
   - RL: `rl-ref/[RL Observability]`

4. **Agent Architecture**
   - CIC: `cic-ref/AGENTS.md` + `cic-ref/AGENTS_API.md`
   - RL: `rl-ref/[RL Agent Design]`

## Next Steps

1. **Identify RL Documentation Source**
   - Confirm location: OneDrive, Google Drive, GitHub, or local
   - Get access/permissions if needed
   - Document the source path

2. **Update RL-Specific Configuration**
   - Create sync.py or shell script modifications
   - Configure RL patterns and destination
   - Add RL vault to automated sync pipeline

3. **Populate Architecture Folders**
   - `architecture/cic-patterns/` - CIC design decisions
   - `architecture/rl-patterns/` - RL design decisions
   - Create comparison documents for cross-system analysis

4. **Update Main Index**
   - Add RL reference section to `00-INDEX.md`
   - Add architecture pattern sections
   - Update last sync timestamps for both systems

## Sync Script Updates Required

When RL docs location is confirmed, update any existing sync scripts to:

1. Define RL source path
2. Add RL destination (C:\dev\rl-ref)
3. Configure RL-specific file patterns
4. Handle both CIC and RL sync in one operation
5. Update timestamp tracking for both systems
6. Generate detailed sync logs

## Environment Variables

Suggested configuration for sync processes:

```bash
# CIC Settings (Already Configured)
CIC_DOCS_SOURCE="onedrive://CIC-folder-id"
CIC_DOCS_DEST="C:\dev\cic-ref"
CIC_SYNC_ENABLED=true

# Rewrite Labs Settings (To be Configured)
RL_DOCS_SOURCE="[TBD]"
RL_DOCS_DEST="C:\dev\rl-ref"
RL_SYNC_ENABLED=false
```

## Documentation References

- CIC Architecture: See `cic-ref/BUILD-SUMMARY.md`
- CIC Agents: See `cic-ref/AGENTS.md` and `cic-ref/AGENTS_API.md`
- Main Vault Index: See `00-INDEX.md`

## Access

- User: sorensencc@gmail.com
- Last Modified: 2026-07-02
