---
title: batch 39
---

# Batch 39: Deterministic Global Snapshot Layer

World-state snapshots, sealed corpora, and TorqueQuery manifests.

## Overview

Batch 39 implements deterministic snapshots through corpus ingestion, world state definitions, and TorqueQuery adapters.

**Files**: 11  
**Directory**: `snapshot/`  
**Entry Script**: `snapshot.sh`  
**Output**: `snapshot-seal-report.json`

## Components

### Corpus Manifest

**File**: `snapshot/corpus/corpus-manifest.json`

```json
{
  "sources": {
    "routing": "dist/routing",
    "sandbox": "dist/sandbox",
    "onnx": "dist/onnx",
    "harness": "dist/harness"
  },
  "deterministic": true
}
```

**Corpus Sources**:
- `routing` — MAAL routing compiled output
- `sandbox` — Sandbox execution compiled
- `onnx` — ONNX inference compiled
- `harness` — Validation harness compiled

### World State

**File**: `snapshot/world/world-state.json`

```json
{
  "version": "1.0.0",
  "timestamp": "2026-06-29T00:00:00Z",
  "components": [
    "routing",
    "sandbox",
    "onnx",
    "harness",
    "policy",
    "runtime",
    "network",
    "storage",
    "identity",
    "access",
    "federation",
    "orchestration"
  ]
}
```

**World Components** (12 total):
- `routing` — Model routing state
- `sandbox` — Execution environment state
- `onnx` — Inference state
- `harness` — Validation state
- `policy` — Policy engine state
- `runtime` — Runtime state
- `network` — Network configuration
- `storage` — Storage configuration
- `identity` — Identity/auth state
- `access` — Access control state
- `federation` — Federation state
- `orchestration` — Orchestration state

### TorqueQuery Adapter

**File**: `snapshot/torque/torque-manifest.json`

```json
{
  "adapter": "TorqueQuery",
  "ingest": "snapshot/corpus/corpus-index.json",
  "world": "snapshot/world/world-state.json",
  "deterministic": true
}
```

**TorqueQuery Integration**:
- Points to corpus index
- Points to world state
- Enables deterministic queries

## Seal Process

```bash
./snapshot.sh
```

**Steps**:

1. Load manifest: `snapshot/seals/snapshot-seal.json`
2. Ingest corpus: generate corpus-index.json
3. Hash `snapshot/corpus/` directory
4. Hash `snapshot/world/` directory
5. Hash `snapshot/torque/` directory
6. Generate report: `snapshot-seal-report.json`

**Output**:

```json
{
  "corpus": {
    "seal": "abc123...",
    "verify": true
  },
  "world": {
    "seal": "def456...",
    "verify": true
  },
  "torque": {
    "seal": "ghi789...",
    "verify": true
  }
}
```

## Programmatic Usage

### Ingest Corpus

```typescript
import { ingestCorpus } from './snapshot/corpus/corpus-ingest';

const corpus = ingestCorpus();
console.log(corpus);
// {
//   routing: ["dist/routing/file1", "dist/routing/file2", ...],
//   sandbox: [...],
//   onnx: [...],
//   harness: [...]
// }
```

### Compute World Hash

```typescript
import { computeWorldHash } from './snapshot/world/world-hash';

const hash = computeWorldHash();
console.log('World Hash:', hash);
// "a1b2c3d4e5f6..." (SHA256 digest)
```

### Load TorqueQuery

```typescript
import { loadTorqueManifest, getTorqueInputs } from './snapshot/torque/torque-adapter';

const manifest = loadTorqueManifest();
console.log(manifest);
// { adapter: "TorqueQuery", ingest: "...", world: "...", ... }

const inputs = getTorqueInputs();
console.log(inputs);
// { ingest: "...", world: "..." }
```

## Snapshot Flow

```
Corpus Ingestion
  ├─ routing/ → list files → corpus-index
  ├─ sandbox/ → list files → corpus-index
  ├─ onnx/ → list files → corpus-index
  └─ harness/ → list files → corpus-index
        ↓
World State Snapshot
  └─ Capture all 12 components
  └─ Compute deterministic hash
        ↓
TorqueQuery Manifest
  └─ Point to corpus-index
  └─ Point to world-state
  └─ Enable queries
```

## Verification

```bash
node snapshot/seals/snapshot-verify.js
```

Compares actual hashes against expected values in `snapshot-seal-report.json`.

## Integration

Batch 39 (Snapshot) integrates with:

- **Batch 36** (Access) — Snapshots include access state
- **Batch 37** (Federation) — Snapshots include federation state
- **Batch 40** (Final Seal) — Snapshot layer is hashed in system seal

## File Structure

```
snapshot/
├── corpus/
│   ├── corpus-manifest.json  # Corpus sources
│   └── corpus-ingest.ts      # Corpus ingestion (TypeScript)
├── world/
│   ├── world-state.json      # World state definition
│   └── world-hash.ts         # World hash (TypeScript)
├── torque/
│   ├── torque-manifest.json  # TorqueQuery config
│   └── torque-adapter.ts     # TorqueQuery adapter (TypeScript)
└── seals/
    ├── snapshot-seal.json    # Manifest
    ├── snapshot-hash.js      # Hashing function
    ├── snapshot-verify.js    # Verification function
    └── deterministic-snapshot.js # Full seal runner
```

## See Also

- [Batch 36 (Access)](batch-36.md)
- [Batch 37 (Federation)](batch-37.md)
- [Batch 40 (Final Seal)](batch-40.md)
- [Architecture Overview](../architecture/overview.md)
