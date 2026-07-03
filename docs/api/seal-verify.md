---
title: seal verify
summary: ""
created: "2026-07-03T19:44:37.604Z"
updated: "2026-07-03T19:44:37.604Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Seal & Verify API

Detailed API reference for sealing and verification functions (Batch 40).

## Module: final/seal.js

### sealLayer(path: string)

Recursively hash a directory or layer.

**Signature**:
```javascript
function sealLayer(path)
```

**Parameters**:
- `path` — Directory path to seal (e.g., "access/", "federation/")

**Returns**: SHA256 hash digest (hex string)

**Throws**: `Error` if path not found or not readable

**Example**:
```javascript
import { sealLayer } from './final/seal.js';

const hash = sealLayer('access/');
console.log('Access layer hash:', hash);
// "a1b2c3d4e5f6..."
```

**How it works**:

```javascript
// For each file/directory in path:
// - If file: hash contents
// - If directory: recursively hash subdirectory
// Return combined SHA256 hash
```

## Module: final/verify.js

### verifyLayer(path: string, expected: string)

Verify a layer hash matches expected value.

**Signature**:
```javascript
function verifyLayer(path, expected)
```

**Parameters**:
- `path` — Directory path to verify
- `expected` — Expected SHA256 hash

**Returns**:
```javascript
{
  expected: string,      // Input expected hash
  actual: string,        // Computed hash
  passed: boolean        // true if hashes match
}
```

**Throws**: `Error` if path not found

**Example**:
```javascript
import { verifyLayer } from './final/verify.js';

const result = verifyLayer('access/', 'abc123...');
console.log(result);
// {
//   expected: "abc123...",
//   actual: "abc123...",
//   passed: true
// }
```

## Full Seal & Verify Workflow

```javascript
import { sealLayer } from './final/seal.js';
import { verifyLayer } from './final/verify.js';

// 1. Seal a layer
const hash = sealLayer('access/');
console.log('Sealed:', hash);

// 2. Verify the layer
const result = verifyLayer('access/', hash);
console.log('Verified:', result.passed);

// 3. Seal all layers
const manifest = {
  layers: {
    "access": "access/",
    "federation": "federation/",
    "snapshot": "snapshot/"
  }
};

const allSeals = {};
for (const [name, path] of Object.entries(manifest.layers)) {
  allSeals[name] = sealLayer(path);
}

// 4. Verify all layers
const allVerified = {};
for (const [name, expected] of Object.entries(allSeals)) {
  const path = manifest.layers[name];
  allVerified[name] = verifyLayer(path, expected);
}

// 5. Check overall status
const allPassed = Object.values(allVerified).every(v => v.passed);
console.log('All layers verified:', allPassed);
```

## Layer-Specific Sealing

### Seal Access Layer

```bash
./access.sh
cat access-seal-report.json
```

Generated report:
```json
{
  "acl": { "seal": "...", "verify": true },
  "permissions": { "seal": "...", "verify": true },
  "bundles": { "seal": "...", "verify": true }
}
```

### Seal Federation Layer

```bash
./federation.sh
cat federation-seal-report.json
```

Generated report:
```json
{
  "trust": { "seal": "...", "verify": true },
  "handoff": { "seal": "...", "verify": true },
  "agents": { "seal": "...", "verify": true }
}
```

### Seal Snapshot Layer

```bash
./snapshot.sh
cat snapshot-seal-report.json
```

Generated report:
```json
{
  "corpus": { "seal": "...", "verify": true },
  "world": { "seal": "...", "verify": true },
  "torque": { "seal": "...", "verify": true }
}
```

### Seal Entire System

```bash
./final.sh
cat final-seal-report.json
```

Generated report includes all 25 layers:
```json
{
  "access": { "seal": "...", "verify": { "passed": true } },
  "federation": { "seal": "...", "verify": { "passed": true } },
  "snapshot": { "seal": "...", "verify": { "passed": true } },
  ... (22 more layers)
}
```

## Reproducibility Verification

After sealing, verify reproducibility:

```bash
# 1. Seal all layers
./final.sh

# 2. Verify all layers
node final/verify.js

# 3. Check certificate
cat final/certificate.json
```

Expected output if reproducible:
```
✅ All layers verified
✅ System is reproducible
✅ v1.0.0 sealed at 2026-06-29T00:00:00Z
```

## Hash Verification Process

```
Input: Directory with N files
  ↓
Hash file 1 → digest1
Hash file 2 → digest2
...
Hash file N → digestN
  ↓
Combine: digest1 + digest2 + ... + digestN
  ↓
Final SHA256 hash
  ↓
Output: hexadecimal string (64 chars)
```

Same inputs always produce same hash (deterministic).

## Common Patterns

### Check Single Layer

```javascript
import { sealLayer } from './final/seal.js';

function checkLayerHash(layer, expectedHash) {
  const actualHash = sealLayer(layer);
  return actualHash === expectedHash;
}

console.log(checkLayerHash('access/', 'abc123...'));  // true or false
```

### Seal Then Verify

```javascript
import { sealLayer } from './final/seal.js';
import { verifyLayer } from './final/verify.js';

function sealAndVerify(path) {
  const hash = sealLayer(path);
  const result = verifyLayer(path, hash);
  return result.passed;
}

console.log(sealAndVerify('federation/'));  // true
```

### Batch Verification

```javascript
import { verifyLayer } from './final/verify.js';
import fs from 'fs';

const expectedHashes = JSON.parse(
  fs.readFileSync('final-seal-report.json')
);

const results = {};
for (const [name, data] of Object.entries(expectedHashes)) {
  results[name] = verifyLayer(
    `${name}/`,
    data.seal
  );
}

const allPassed = Object.values(results)
  .every(r => r.passed);

console.log('Overall status:', allPassed ? '✅ OK' : '❌ FAILED');
```

## See Also

- [Overview](overview.md)
- [Batch 40 Details](../batches/batch-40.md)
- [Deterministic Stack](../architecture/deterministic-stack.md)
- [Operations Guide](../operations/sealing.md)
