# Deterministic Stack

How the MAAL Sandbox achieves deterministic reproducibility through sealed layers.

## Core Concept

**Determinism** = Same input always produces same output.

For MAAL:
- Same files → Same hashes
- Same hashes → Reproducible system
- Reproducible system → Verifiable trust

## Layering Strategy

```
Layer 40: Final Seal
  ↓ Hashes all below
Layers 1-39: Specialized functionality
  ├─ B36 Access (ACLs, permissions)
  ├─ B37 Federation (trust, agents)
  ├─ B39 Snapshot (world state, corpus)
  └─ B1-35 Foundation (MAAL core, governance)
```

Each layer:
- Manages specific responsibility
- Can be sealed independently
- Can be verified independently
- Contributes to final system seal

## Seal Levels

### Level 1: File Hashing
Hash individual files:

```javascript
const hash = crypto.createHash("sha256");
hash.update(fs.readFileSync("file.json"));
return hash.digest("hex");
```

### Level 2: Directory Hashing
Hash all files in directory:

```javascript
function hashDirectory(path) {
  const files = fs.readdirSync(path);
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    hash.update(fs.readFileSync(`${path}/${file}`));
  }
  return hash.digest("hex");
}
```

### Level 3: Recursive Sealing
Hash directory trees recursively:

```javascript
function sealLayer(path) {
  const files = fs.readdirSync(path, { withFileTypes: true });
  const hash = crypto.createHash("sha256");
  for (const f of files) {
    if (f.isDirectory()) {
      hash.update(sealLayer(`${path}/${f.name}`));
    } else {
      hash.update(fs.readFileSync(`${path}/${f.name}`));
    }
  }
  return hash.digest("hex");
}
```

### Level 4: System-Wide Sealing
Hash all 25 layers together:

```javascript
function sealSystem(manifest) {
  const results = {};
  for (const [name, path] of Object.entries(manifest.layers)) {
    results[name] = sealLayer(path);
  }
  return results;
}
```

## Example: Batch 37 (Federation) Seal

### Step 1: Load Manifest

```json
{
  "paths": {
    "trust": "federation/trust",
    "handoff": "federation/handoff",
    "agents": "federation/agents"
  }
}
```

### Step 2: Hash Each Path

```
federation/trust/
  ├─ trust-graph.json → hash1
  └─ trust-graph.ts → hash2
Hash trust directory: SHA256(hash1 + hash2)

federation/handoff/
  ├─ handoff-policy.json → hash3
  └─ handoff.ts → hash4
Hash handoff directory: SHA256(hash3 + hash4)

federation/agents/
  ├─ agents.json → hash5
  └─ agents.ts → hash6
Hash agents directory: SHA256(hash5 + hash6)
```

### Step 3: Combine into Report

```json
{
  "trust": {
    "seal": "abc123...",
    "verify": true
  },
  "handoff": {
    "seal": "def456...",
    "verify": true
  },
  "agents": {
    "seal": "ghi789...",
    "verify": true
  }
}
```

### Step 4: Save Report

File: `federation-seal-report.json`

## Verification Workflow

### Verify Single Layer

```bash
node federation/seals/federation-verify.js
```

Output:
```json
{
  "expected": "abc123...",
  "actual": "abc123...",
  "passed": true
}
```

### Verify All Layers

```bash
./final.sh
cat final-seal-report.json
```

Output shows all 25 layers + overall system status.

## Determinism Guarantees

### Guarantee 1: File Immutability
Change any file → hash changes → verification fails

```
federation/trust/trust-graph.json changes
  ↓
Hash of trust/ directory changes
  ↓
Hash in federation-seal-report.json differs
  ↓
Verification fails
```

### Guarantee 2: Ordering Independence
File order doesn't matter (lexicographic sort):

```javascript
const files = fs.readdirSync(path).sort(); // Always same order
```

### Guarantee 3: Bit-Perfect Reproduction
Same bits → same hash (SHA256 property):

```
File A (100 bytes) + File B (200 bytes)
  ↓
SHA256 hash = X

File A (100 bytes) + File B (200 bytes) [same files]
  ↓
SHA256 hash = X [identical]
```

## Determinism Breakers

⚠️ These will break determinism:

| Issue | Fix |
|-------|-----|
| Modified files | Restore from version control |
| Added files | Remove or commit them |
| Deleted files | Restore from version control |
| Timestamp changes | Ignore (only hash content) |
| Permission changes | Ignore (only hash content) |

Determinism is **content-based**, not metadata-based.

## Full System Seal Flow

```
1. access.sh
   └─ Hash access/acl/, permissions/, bundles/
   └─ Output: access-seal-report.json

2. federation.sh
   └─ Hash federation/trust/, handoff/, agents/
   └─ Output: federation-seal-report.json

3. snapshot.sh
   └─ Hash snapshot/corpus/, world/, torque/
   └─ Output: snapshot-seal-report.json

4. final.sh
   └─ Hash all 25 layers recursively
   └─ Verify all layer hashes
   └─ Output: final-seal-report.json
   └─ Generate: final/certificate.json
```

## Reproducibility Timeline

```
T0: Original seal (all files at version V)
    access.sh → access-seal-report.json
    federation.sh → federation-seal-report.json
    snapshot.sh → snapshot-seal-report.json
    final.sh → final-seal-report.json

T1: Re-seal (files restored to version V)
    access.sh → access-seal-report.json (identical hashes)
    federation.sh → federation-seal-report.json (identical)
    snapshot.sh → snapshot-seal-report.json (identical)
    final.sh → final-seal-report.json (identical)
    ✅ 100% reproducible
```

## Performance Characteristics

| Layer | Files | Hash Time |
|-------|-------|-----------|
| Access | 10 | ~5ms |
| Federation | 11 | ~6ms |
| Snapshot | 11 | ~6ms |
| Final | 25 dirs | ~50ms |

**Total system seal: ~100ms**

## Next Steps

- [Data Flow](data-flow.md) — Complete execution flow
- [Operations](../operations/running.md) — Run the system
- [API Reference](../api/overview.md) — Code examples
