---
title: design
summary: ""
created: "2026-07-03T19:44:37.612Z"
updated: "2026-07-03T19:44:37.612Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# System Design

Detailed design of the MAAL Sandbox deterministic architecture.

> For the wider CIC-OS repository layout (routing, governance, ingestion, services, toolforge — all distributed, no monolithic `cic-os/` tree), see the [Architecture Overview](overview.md#cic-os-system-layout-real-repo-structure).

## Design Goals

1. **Reproducibility** — Any seal can be re-run and produce identical hash
2. **Transparency** — All layers visible and auditable
3. **Composability** — Layers can be sealed independently or together
4. **Scalability** — Adding new layers doesn't require system redesign
5. **Verification** — Every claim (hash) is independently verifiable

## Layer Model

### Layer Structure

Each layer follows this structure:

```
LayerName/
├── Config/               (configuration files)
│   ├── manifest.json    (list of paths to seal)
│   └── config.json      (optional settings)
├── Content/             (actual layer data)
│   ├── file1
│   ├── file2
│   └── directory/
└── Seals/              (seal scripts and verification)
    ├── hash.js         (compute layer hash)
    ├── verify.js       (verify against expected)
    └── deterministic.js (full seal runner)
```

### Seal Operations

Each layer supports:

```typescript
// Compute hash
const hash = hashLayer(path);
// Result: SHA256 digest

// Verify against expected
const result = verifyLayer(path, expectedHash);
// Result: { expected, actual, passed }

// Run full seal
const report = runDeterministicSeal();
// Result: Seal report JSON
```

## Batch Organization

### Batches 1-35
**Foundation & Prior Phases** — MAAL router, sandbox, ingestion, governance

- Sealed in prior sessions
- Referenced in BATCHES_MANIFEST
- Still part of final system seal

### Batch 36: Access Layer
**Deterministic ACLs & Permissions**

Files:
- `access/acl/acl.json` — Role-based ACL definitions
- `access/permissions/permissions.json` — Permission mappings
- `access/bundles/access-bundle.json` — Bundled access sets
- Seal scripts in `access/seals/`

Seal: `./access.sh` → `access-seal-report.json`

### Batch 37: Federation Layer
**Cross-Agent Trust & Handoff**

Files:
- `federation/trust/trust-graph.json` — Trust relationships
- `federation/handoff/handoff-policy.json` — Handoff rules
- `federation/agents/agents.json` — Agent registry
- Seal scripts in `federation/seals/`

Seal: `./federation.sh` → `federation-seal-report.json`

### Batch 39: Snapshot Layer
**World State & Corpus**

Files:
- `snapshot/corpus/corpus-manifest.json` — Corpus sources
- `snapshot/world/world-state.json` — Global state definition
- `snapshot/torque/torque-manifest.json` — TorqueQuery adapter
- Seal scripts in `snapshot/seals/`

Seal: `./snapshot.sh` → `snapshot-seal-report.json`

### Batch 40: Final Seal
**System-Wide Reproducibility**

Files:
- `final/manifest.json` — All 25 layer paths
- `final/seal.js` — Recursive layer hashing
- `final/verify.js` — Layer verification
- `final/certificate.json` — Reproducibility cert

Seal: `./final.sh` → `final-seal-report.json`

## Hashing Algorithm

### SHA256 Deterministic Hash

```javascript
function hashDirectory(path) {
  const files = fs.readdirSync(path);
  const hash = crypto.createHash("sha256");
  
  for (const file of files) {
    const data = fs.readFileSync(`${path}/${file}`);
    hash.update(data);
  }
  
  return hash.digest("hex");
}
```

**Properties:**
- Deterministic: Same input → same output
- Unique: Different inputs → different outputs
- Immutable: Cannot reverse to get original
- Fast: O(n) time for n bytes

### Recursive Hashing

For directories with subdirectories:

```javascript
function sealLayer(path) {
  const files = fs.readdirSync(path, { withFileTypes: true });
  const hash = crypto.createHash("sha256");
  
  for (const f of files) {
    const full = `${path}/${f.name}`;
    if (f.isDirectory()) {
      hash.update(sealLayer(full));  // Recursive
    } else {
      hash.update(fs.readFileSync(full));
    }
  }
  
  return hash.digest("hex");
}
```

## Manifest System

### Manifest Format

```json
{
  "paths": {
    "layer1": "path/to/layer1",
    "layer2": "path/to/layer2"
  }
}
```

### Final Manifest (25 Layers)

```json
{
  "layers": {
    "build": "build/",
    "packaging": "packaging/",
    "release": "release/",
    "ci": "ci/",
    "nightly": "nightly/",
    "regression": "regression/",
    "drift": "drift/",
    "stability": "stability/",
    "repro": "repro/",
    "deployment": "deployment/",
    "infra": "infra/",
    "observability": "observability/",
    "audit": "audit/",
    "policy": "policy/",
    "runtime": "runtime/",
    "storage": "storage/",
    "network": "network/",
    "security": "security/",
    "secrets-engine": "secrets-engine/",
    "identity": "identity/",
    "access": "access/",
    "federation": "federation/",
    "orchestration": "orchestration/",
    "snapshot": "snapshot/"
  }
}
```

## Verification Strategy

### Layer-by-Layer Verification

```typescript
// 1. Get expected hash
const expected = loadExpectedHash(layerName);

// 2. Compute actual hash
const actual = hashLayer(layerPath);

// 3. Compare
const passed = actual === expected;

// 4. Report
return { expected, actual, passed };
```

### Full System Verification

```typescript
// 1. Verify each layer independently
for (const [name, path] of Object.entries(layers)) {
  const seal = hashLayer(path);
  const verify = verifyLayer(path, expectedSeal[name]);
  results[name] = { seal, verify: verify.passed };
}

// 2. Check reproducibility
if (Object.values(results).every(r => r.verify.passed)) {
  console.log("✅ System reproducible");
} else {
  console.log("❌ Reproducibility broken");
}

// 3. Output certificate
fs.writeFileSync("final-seal-report.json", JSON.stringify(results));
```

## Reproducibility Certificate

```json
{
  "sandbox3": {
    "version": "1.0.0",
    "deterministic": true,
    "sealed": true,
    "completed": "2026-06-29T00:00:00Z"
  }
}
```

**Meaning:**
- `version: 1.0.0` — Fixed snapshot version
- `deterministic: true` — All layers hash deterministically
- `sealed: true` — All layers sealed with SHA256
- `completed: 2026-06-29T00:00:00Z` — When seal completed

## Design Trade-offs

| Choice | Pro | Con |
|--------|-----|-----|
| SHA256 | Industry standard, fast | Not cryptographically signed |
| JSON manifests | Human-readable, easy to version | Not binary-compact |
| File-based hashing | Transparent, auditable | Slower than in-memory |
| Recursive sealing | Catches all changes | Requires full traversal |

## Security Considerations

- ✅ Hashes prevent tampering (integrity)
- ❌ Hashes don't authenticate (no signature)
- ✅ Sealed manifests prevent policy changes
- ❌ No encryption for confidentiality
- ✅ Versioning prevents replay attacks
- ❌ Clock-dependent timestamps

## Extensibility

Adding new layer:

1. Create layer directory
2. Add paths to `final/manifest.json`
3. Run `./final.sh`
4. Verify in `final-seal-report.json`

No code changes needed — manifest-driven.

## Next Steps

- [Deterministic Stack](deterministic-stack.md) — How sealing works
- [Data Flow](data-flow.md) — Complete execution flow
- [Operations](../operations/running.md) — Run the system
