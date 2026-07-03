---
title: snapshot layer
summary: ""
created: "2026-07-03T19:44:37.607Z"
updated: "2026-07-03T19:44:37.607Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Snapshot Layer API

Detailed API reference for snapshot functions (Batch 39).

## Module: snapshot/corpus/corpus-ingest.ts

### ingestCorpus()

Ingest corpus sources and generate corpus index.

**Signature**:
```typescript
function ingestCorpus(): CorpusIndex
```

**Returns**:
```typescript
type CorpusIndex = {
  [source: string]: string[];  // Files per source
};

// Example:
{
  "routing": ["dist/routing/file1.js", "dist/routing/file2.js", ...],
  "sandbox": ["dist/sandbox/file1.js", ...],
  "onnx": ["dist/onnx/file1.js", ...],
  "harness": ["dist/harness/file1.js", ...]
}
```

**Side Effects**: Creates `snapshot/corpus/corpus-index.json`

**Throws**: `Error` if source directory not found

**Example**:
```typescript
import { ingestCorpus } from './snapshot/corpus/corpus-ingest';

const corpus = ingestCorpus();
console.log(corpus.routing.length);  // Number of routing files
```

## Module: snapshot/world/world-hash.ts

### computeWorldHash()

Compute deterministic hash of world state.

**Signature**:
```typescript
function computeWorldHash(): string
```

**Returns**: SHA256 hash digest (hex string)

**Throws**: `Error` if world-state.json not found

**Example**:
```typescript
import { computeWorldHash } from './snapshot/world/world-hash';

const hash = computeWorldHash();
console.log('World Hash:', hash);  // "a1b2c3d4e5f6..."
```

## Module: snapshot/torque/torque-adapter.ts

### loadTorqueManifest()

Load TorqueQuery adapter manifest.

**Signature**:
```typescript
function loadTorqueManifest(): TorqueManifest
```

**Returns**:
```typescript
type TorqueManifest = {
  adapter: string;      // "TorqueQuery"
  ingest: string;       // Path to corpus index
  world: string;        // Path to world state
  deterministic: boolean;
};

// Example:
{
  "adapter": "TorqueQuery",
  "ingest": "snapshot/corpus/corpus-index.json",
  "world": "snapshot/world/world-state.json",
  "deterministic": true
}
```

**Throws**: `Error` if manifest not found

**Example**:
```typescript
import { loadTorqueManifest } from './snapshot/torque/torque-adapter';

const manifest = loadTorqueManifest();
console.log(manifest.adapter);  // "TorqueQuery"
```

### getTorqueInputs()

Load TorqueQuery inputs (corpus and world state).

**Signature**:
```typescript
function getTorqueInputs(): TorqueInputs
```

**Returns**:
```typescript
type TorqueInputs = {
  ingest: string;   // Corpus index JSON
  world: string;    // World state JSON
};
```

**Throws**: `Error` if files not found or invalid JSON

**Example**:
```typescript
import { getTorqueInputs } from './snapshot/torque/torque-adapter';

const inputs = getTorqueInputs();
const corpusIndex = JSON.parse(inputs.ingest);
const worldState = JSON.parse(inputs.world);

console.log('World components:', worldState.components.length);
```

## Complete Example

```typescript
import { ingestCorpus } from './snapshot/corpus/corpus-ingest';
import { computeWorldHash } from './snapshot/world/world-hash';
import { loadTorqueManifest, getTorqueInputs } from './snapshot/torque/torque-adapter';

// 1. Ingest corpus
const corpus = ingestCorpus();
console.log('Corpus sources:', Object.keys(corpus));
// ["routing", "sandbox", "onnx", "harness"]

console.log('Routing files:', corpus.routing.length);

// 2. Compute world hash
const worldHash = computeWorldHash();
console.log('World Hash:', worldHash);

// 3. Load TorqueQuery manifest
const manifest = loadTorqueManifest();
console.log('Adapter:', manifest.adapter);
console.log('Deterministic:', manifest.deterministic);

// 4. Load TorqueQuery inputs
const inputs = getTorqueInputs();
const corpusData = JSON.parse(inputs.ingest);
const worldData = JSON.parse(inputs.world);

console.log('World version:', worldData.version);
console.log('World components:', worldData.components);
// ["routing", "sandbox", "onnx", "harness", ...]

// 5. Query snapshot
function querySnapshot() {
  const inputs = getTorqueInputs();
  const world = JSON.parse(inputs.world);
  
  return {
    version: world.version,
    components: world.components,
    componentCount: world.components.length,
    hash: computeWorldHash()
  };
}

console.log('Snapshot:', querySnapshot());
```

## World Components

The world state includes 12 components:

| Component | Purpose |
|-----------|---------|
| routing | Model routing state |
| sandbox | Execution environment |
| onnx | Inference state |
| harness | Validation state |
| policy | Policy engine state |
| runtime | Runtime configuration |
| network | Network configuration |
| storage | Storage configuration |
| identity | Identity/auth state |
| access | Access control state |
| federation | Federation state |
| orchestration | Orchestration state |

## Corpus Sources

| Source | Location | Purpose |
|--------|----------|---------|
| routing | dist/routing | MAAL routing compiled |
| sandbox | dist/sandbox | Sandbox execution compiled |
| onnx | dist/onnx | ONNX inference compiled |
| harness | dist/harness | Validation harness compiled |

## See Also

- [Overview](overview.md)
- [Access Layer API](access-layer.md)
- [Federation Layer API](federation-layer.md)
- [Batch 39 Details](../batches/batch-39.md)
