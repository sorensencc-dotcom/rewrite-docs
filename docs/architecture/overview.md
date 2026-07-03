---
title: overview
summary: ""
created: "2026-07-03T19:44:37.626Z"
updated: "2026-07-03T19:44:37.626Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Architecture Overview

The MAAL Sandbox System is built on a **deterministic, layered architecture** where each layer is sealed with SHA256 hashing for reproducibility.

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│           Final Deterministic Seal (B40)            │
│  Recursive hashing of all 25 layers                 │
│  Reproducibility certificate (v1.0.0)              │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
┌───────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌──────▼───┐
│ Access   │ │Feder- │ │Snap-  │ │Policies  │
│ (B36)    │ │ation  │ │shot   │ │& Runtime │
│ 10 files │ │(B37)  │ │(B39)  │ │(1-35)    │
│          │ │11     │ │11     │ │+ others  │
│ ACL      │ │files  │ │files  │ │          │
│ Perms    │ │       │ │       │ │          │
│ Bundles  │ │Trust  │ │Corpus │ │          │
│ Seals    │ │Handoff│ │World  │ │          │
│          │ │Agents │ │TorQ   │ │          │
│          │ │Seals  │ │Seals  │ │          │
└───────┬──┘ └────┬──┘ └────┬──┘ └──────┬───┘
        │         │         │          │
        └─────────┴─────────┴──────────┘
                  │
        ┌─────────▼─────────┐
        │  25 Sealed Layers │
        │  (Build through   │
        │   Observability)  │
        └───────────────────┘
```

## Core Principles

### 1. Deterministic Hashing
Every file and directory is hashed with SHA256 to ensure reproducibility.

```
Input: Directory with files
↓
Hash: SHA256(file1 + file2 + file3 + ...)
↓
Output: Deterministic seal
```

### 2. Layered Architecture
System organized into 25 distinct layers, each independently sealed:

- **Build** — Compilation and packaging
- **CI/CD** — Pipeline orchestration
- **Runtime** — Execution environment
- **Storage** — Data persistence
- **Network** — Communication layer
- **Security** — Access control
- **Access** (B36) — ACLs and permissions
- **Federation** (B37) — Cross-agent trust
- **Snapshot** (B39) — World state
- **Final Seal** (B40) — System certificate

### 3. Verification-First
Every layer can be independently verified:

```typescript
const actual = hashLayer(path);
const expected = loadExpectedHash();
const passed = actual === expected;
```

### 4. End-to-End Sealing
Final seal recursively hashes all 25 layers to produce system-wide certificate:

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

## Execution Flow

```
1. Access Layer Seal (access.sh)
   └─ Hashes: acl/, permissions/, bundles/

2. Federation Layer Seal (federation.sh)
   └─ Hashes: trust/, handoff/, agents/

3. Snapshot Layer Seal (snapshot.sh)
   └─ Hashes: corpus/, world/, torque/

4. Final System Seal (final.sh)
   └─ Recursive hash of all 25 layers
   └─ Output: reproducibility certificate
```

## Key Files

| File | Purpose |
|------|---------|
| `BATCHES_MANIFEST.json` | Master index of all 40 batches |
| `access-seal-report.json` | Access layer hashes |
| `federation-seal-report.json` | Federation layer hashes |
| `snapshot-seal-report.json` | Snapshot layer hashes |
| `final-seal-report.json` | System-wide seal report |
| `final/certificate.json` | Reproducibility certificate |

## Design Patterns

### Pattern: Manifest + Seal
Each layer has:
1. **Manifest** (JSON) — Files and paths to seal
2. **Hash** (JS) — Hashing function
3. **Verify** (JS) — Verification function
4. **Deterministic** (JS) — Full seal runner

Example:
```
federation/
├── trust/                    (content)
├── handoff/                  (content)
├── agents/                   (content)
└── seals/
    ├── federation-seal.json  (manifest)
    ├── federation-hash.js    (hash function)
    ├── federation-verify.js  (verify function)
    └── deterministic-federation.js (runner)
```

### Pattern: JSON Configuration
Each layer configured via JSON manifests:

```json
{
  "paths": {
    "trust": "federation/trust",
    "handoff": "federation/handoff",
    "agents": "federation/agents"
  }
}
```

### Pattern: Recursive Verification
Final seal recursively verifies all layers:

```javascript
for (const [name, path] of Object.entries(manifest.paths)) {
  const seal = hashLayer(path);
  const verify = verifyLayer(path, seal);
  results[name] = { seal, verify: verify.passed };
}
```

## Reproducibility Guarantee

System achieves reproducibility through:

✅ **Deterministic Hashing** — SHA256 produces same hash for same files  
✅ **Sealed Manifests** — All layer definitions frozen in JSON  
✅ **Version Locking** — All components versioned (v1.0.0)  
✅ **Certificate** — Final seal signed with reproducibility proof  

Any file change → hash changes → verification fails → reproducibility broken.

## Next Steps

- [System Design](design.md) — Deep-dive into architecture
- [Deterministic Stack](deterministic-stack.md) — How sealing works
- [Data Flow](data-flow.md) — Complete execution flow
