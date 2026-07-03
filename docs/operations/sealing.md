---
title: sealing
summary: ""
created: "2026-07-03T19:44:38.057Z"
updated: "2026-07-03T19:44:38.057Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Sealing Layers

Detailed guide to sealing individual layers and the complete system.

## What is Sealing?

Sealing = computing a deterministic SHA256 hash of a directory/layer.

**Purpose**: Prove that files haven't changed and system is reproducible.

## Layer Sealing

### Batch 36: Access Layer

```bash
./access.sh
```

Seals:
- `access/acl/` — Role definitions
- `access/permissions/` — Permission mappings
- `access/bundles/` — Bundle metadata

Output: `access-seal-report.json`

```json
{
  "acl": { "seal": "abc123...", "verify": true },
  "permissions": { "seal": "def456...", "verify": true },
  "bundles": { "seal": "ghi789...", "verify": true }
}
```

### Batch 37: Federation Layer

```bash
./federation.sh
```

Seals:
- `federation/trust/` — Trust graphs
- `federation/handoff/` — Handoff policies
- `federation/agents/` — Agent registry

Output: `federation-seal-report.json`

```json
{
  "trust": { "seal": "abc123...", "verify": true },
  "handoff": { "seal": "def456...", "verify": true },
  "agents": { "seal": "ghi789...", "verify": true }
}
```

### Batch 39: Snapshot Layer

```bash
./snapshot.sh
```

Seals:
- `snapshot/corpus/` — Corpus ingestion
- `snapshot/world/` — World state
- `snapshot/torque/` — TorqueQuery manifest

Output: `snapshot-seal-report.json`

```json
{
  "corpus": { "seal": "abc123...", "verify": true },
  "world": { "seal": "def456...", "verify": true },
  "torque": { "seal": "ghi789...", "verify": true }
}
```

## Full System Seal

### Batch 40: Final Seal

```bash
./final.sh
```

Seals all 25 layers recursively:

1. Load `final/manifest.json` (25 layer paths)
2. For each layer:
   - Recursively hash directory tree
   - Store result
   - Verify hash
3. Generate `final-seal-report.json` (all hashes)
4. Generate `final/certificate.json` (reproducibility cert)

Output structure:

```json
{
  "access": { "seal": "...", "verify": { "passed": true } },
  "federation": { "seal": "...", "verify": { "passed": true } },
  "snapshot": { "seal": "...", "verify": { "passed": true } },
  ... (22 more layers)
}
```

## Seal Execution Flow

```
User runs: ./final.sh
        ↓
Load final/manifest.json (all 25 layers)
        ↓
For each layer:
  ├─ Call sealLayer(path)
  │   ├─ Read all files
  │   ├─ For subdirs: recursive call
  │   ├─ Hash all content
  │   └─ Return SHA256 digest
  │
  ├─ Call verifyLayer(path, expectedHash)
  │   ├─ Compute actual hash
  │   ├─ Compare with expected
  │   └─ Return pass/fail
  │
  └─ Store result in report
        ↓
Write final-seal-report.json
        ↓
Write final/certificate.json
```

## Seal Manifest

The `final/manifest.json` defines all 25 layers:

```json
{
  "layers": {
    "access": "access/",
    "federation": "federation/",
    "snapshot": "snapshot/",
    "build": "build/",
    "packaging": "packaging/",
    ... (20 more layers)
  }
}
```

To add a new layer:

1. Create directory
2. Add to `final/manifest.json`
3. Run `./final.sh`
4. New layer automatically sealed

## Reproducibility

After sealing, verify reproducibility:

```bash
# 1. Run seal
./final.sh

# 2. Check report
cat final-seal-report.json

# 3. Verify certificate
cat final/certificate.json

# 4. Manual verification
node final/verify.js
```

If all hashes match → System is reproducible ✅

## Incremental Sealing

Seal only changed layers:

```bash
# Modify access layer
echo '{}' >> access/acl/acl.json

# Re-seal just that layer
./access.sh

# Updated: access-seal-report.json
```

Then re-run full system seal:

```bash
./final.sh
```

Hash change will be detected and reported.

## Seal Reports

Each report shows:

```json
{
  "layerName": {
    "seal": "SHA256_HASH_VALUE",
    "verify": {
      "expected": "SHA256_HASH_VALUE",
      "actual": "SHA256_HASH_VALUE",
      "passed": true
    }
  }
}
```

- `seal` — Computed hash
- `verify.expected` — Expected hash (from previous seal)
- `verify.actual` — Actual hash (just computed)
- `verify.passed` — true if match, false if changed

## Seal Timing

```
Single layer:  ~10ms
4 layers:      ~40ms
25 layers:     ~250ms
Verify:        ~250ms
Total:         ~500ms
```

## Best Practices

✅ **Do**:
- Run seal after any changes
- Verify reproducibility regularly
- Keep certificate backed up
- Version control seal reports

❌ **Don't**:
- Modify files then seal (file will be in report)
- Skip verification
- Delete seal reports
- Ignore hash mismatches

## Sealing Pipeline

```bash
#!/bin/bash
# Typical sealing pipeline

# 1. Ensure clean state
git status

# 2. Seal all layers
./access.sh && \
./federation.sh && \
./snapshot.sh && \
./final.sh

# 3. Verify
node final/verify.js

# 4. Check certificate
cat final/certificate.json

# 5. Commit reports
git add *-seal-report.json
git commit -m "chore: seal system"

echo "✅ Sealing complete"
```

## See Also

- [Verification](verification.md)
- [Running the System](running.md)
- [Troubleshooting](troubleshooting.md)
