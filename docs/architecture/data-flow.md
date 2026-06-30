---
title: data flow
---

# Data Flow

Complete execution and data flow through the MAAL Sandbox system.

## System Entry Points

The system can be accessed through several entry points:

### Entry 1: Direct Sealing
```bash
./access.sh          # Seal access layer
./federation.sh      # Seal federation layer
./snapshot.sh        # Seal snapshot layer
./final.sh          # Seal entire system
```

### Entry 2: Programmatic
```typescript
import { loadACL } from './access/acl/acl';
import { loadTrustGraph } from './federation/trust/trust-graph';
import { loadAgents } from './federation/agents/agents';
```

### Entry 3: HTTP API (when deployed)
```bash
GET /v1/health      # Health check
GET /v1/acl         # Load ACLs
GET /v1/trust       # Load trust graph
GET /v1/agents      # Load agents
GET /v1/verify      # Verify system
```

## Access Layer Flow

```
┌──────────────────────────────────────┐
│ access.sh (Entry Point)              │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ access/seals/deterministic-access.js │
└──────────┬───────────────────────────┘
           │
           ├─→ Load manifest
           │   access/seals/access-seal.json
           │
           ├─→ Hash acl/
           │   • Load access/acl/acl.json
           │   • Load access/acl/acl.ts
           │   • Compute SHA256(json + ts)
           │   • Store in results["acl"]
           │
           ├─→ Hash permissions/
           │   • Load access/permissions/permissions.json
           │   • Load access/permissions/permissions.ts
           │   • Compute SHA256(json + ts)
           │   • Store in results["permissions"]
           │
           ├─→ Hash bundles/
           │   • Load access/bundles/access-bundle.json
           │   • Compute SHA256(json)
           │   • Store in results["bundles"]
           │
           ↓
┌──────────────────────────────────────┐
│ access-seal-report.json (Output)     │
│ {                                    │
│   "acl": { "seal": "...", ... },    │
│   "permissions": { ... },            │
│   "bundles": { ... }                │
│ }                                    │
└──────────────────────────────────────┘
```

## Federation Layer Flow

```
┌──────────────────────────────────────┐
│ federation.sh (Entry Point)          │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ federation/seals/deterministic-      │
│ federation.js                        │
└──────────┬───────────────────────────┘
           │
           ├─→ Load manifest
           │   federation/seals/federation-seal.json
           │
           ├─→ Hash trust/
           │   • trust-graph.json (trust definitions)
           │   • trust-graph.ts (loader functions)
           │
           ├─→ Hash handoff/
           │   • handoff-policy.json (handoff rules)
           │   • handoff.ts (handoff functions)
           │
           ├─→ Hash agents/
           │   • agents.json (agent registry)
           │   • agents.ts (agent loader)
           │
           ↓
┌──────────────────────────────────────┐
│ federation-seal-report.json (Output) │
│ {                                    │
│   "trust": { "seal": "...", ... },  │
│   "handoff": { ... },                │
│   "agents": { ... }                 │
│ }                                    │
└──────────────────────────────────────┘
```

## Snapshot Layer Flow

```
┌──────────────────────────────────────┐
│ snapshot.sh (Entry Point)            │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ snapshot/seals/deterministic-        │
│ snapshot.js                          │
└──────────┬───────────────────────────┘
           │
           ├─→ Load manifest
           │   snapshot/seals/snapshot-seal.json
           │
           ├─→ Hash corpus/
           │   • corpus-manifest.json (sources)
           │   • corpus-ingest.ts (ingestion)
           │
           ├─→ Hash world/
           │   • world-state.json (12 components)
           │   • world-hash.ts (hash function)
           │
           ├─→ Hash torque/
           │   • torque-manifest.json (TorqueQuery config)
           │   • torque-adapter.ts (adapter function)
           │
           ↓
┌──────────────────────────────────────┐
│ snapshot-seal-report.json (Output)   │
│ {                                    │
│   "corpus": { "seal": "...", ... }, │
│   "world": { ... },                  │
│   "torque": { ... }                 │
│ }                                    │
└──────────────────────────────────────┘
```

## Final System Seal Flow

```
┌──────────────────────────────────────┐
│ final.sh (Entry Point)               │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ final/seal.js (Recursive sealer)     │
└──────────┬───────────────────────────┘
           │
           ├─→ Load final/manifest.json
           │   (25 layer paths)
           │
           ├─→ For each layer:
           │   ├─ Recursively hash directory
           │   ├─ Store hash result
           │   └─ Record verification
           │
           │   Layers:
           │   • build/ → hash
           │   • packaging/ → hash
           │   • ci/ → hash
           │   • runtime/ → hash
           │   • storage/ → hash
           │   • network/ → hash
           │   • security/ → hash
           │   • access/ → hash
           │   • federation/ → hash
           │   • snapshot/ → hash
           │   ... (15 more)
           │
           ↓
┌──────────────────────────────────────┐
│ Verify each hash (final/verify.js)   │
└──────────┬───────────────────────────┘
           │
           ├─→ For each layer hash:
           │   ├─ Compute actual hash
           │   ├─ Compare with expected
           │   └─ Record pass/fail
           │
           ↓
┌──────────────────────────────────────┐
│ final-seal-report.json (Output)      │
│ {                                    │
│   "access": {                        │
│     "seal": "abc123...",             │
│     "verify": { "passed": true }    │
│   },                                 │
│   "federation": { ... },             │
│   "snapshot": { ... },               │
│   ... (22 more layers)               │
│ }                                    │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ final/certificate.json (Generated)   │
│ {                                    │
│   "sandbox3": {                      │
│     "version": "1.0.0",              │
│     "deterministic": true,           │
│     "sealed": true,                  │
│     "completed": "2026-06-29T00..."  │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
```

## Read Data Flow

### Loading ACL

```typescript
// 1. Load ACL manifest
const acl = loadACL();  // Reads access/acl/acl.json

// 2. Result structure
{
  "admin": ["read", "write", "manage"],
  "operator": ["read", "execute"],
  "cic-api": ["invoke", "spawn"],
  "sandbox": ["vm-start", "vm-stop"],
  "onnx": ["infer"]
}

// 3. Query access
const access = getAccess("admin");
// Result: ["read", "write", "manage"]
```

### Loading Trust Graph

```typescript
// 1. Load trust relationships
const trust = loadTrustGraph();  // federation/trust/trust-graph.json

// 2. Result structure
{
  "cic-api": ["sandbox", "onnx", "harness"],
  "sandbox": ["cic-api"],
  "onnx": ["cic-api"],
  ...
}

// 3. Query trusted entities
const trusted = getTrustedEntities("cic-api");
// Result: ["sandbox", "onnx", "harness"]
```

### Loading World State

```typescript
// 1. Compute world hash
const hash = computeWorldHash();

// 2. Result
// "a1b2c3d4e5f6..." (SHA256 digest)

// 3. World components
const world = JSON.parse(
  fs.readFileSync("snapshot/world/world-state.json")
);

// Result
{
  "version": "1.0.0",
  "timestamp": "2026-06-29T00:00:00Z",
  "components": [
    "routing", "sandbox", "onnx", "harness",
    "policy", "runtime", "network", "storage",
    "identity", "access", "federation", "orchestration"
  ]
}
```

## Verification Flow

```
1. Call verify script
   node final/verify.js

2. For each layer:
   ├─ Load expected hash from report
   ├─ Compute actual hash
   ├─ Compare
   └─ Record result

3. Summary
   ├─ Total layers checked: 25
   ├─ Passed: 25
   ├─ Failed: 0
   └─ Status: ✅ REPRODUCIBLE

4. Output
   {
     "access": { "passed": true },
     "federation": { "passed": true },
     "snapshot": { "passed": true },
     ... (all 25 layers)
   }
```

## Example: Complete Seal → Verify → Confirm

```bash
# 1. Seal all layers
$ ./final.sh
Sealing access layer... OK
Sealing federation layer... OK
Sealing snapshot layer... OK
Computing system seal... OK
Generated: final-seal-report.json
Generated: final/certificate.json

# 2. Verify reproducibility
$ node final/verify.js
Verifying access layer... ✓ PASS
Verifying federation layer... ✓ PASS
Verifying snapshot layer... ✓ PASS
Verifying 22 more layers... ✓ PASS
Status: System reproducible ✓

# 3. Check certificate
$ cat final/certificate.json
{
  "sandbox3": {
    "version": "1.0.0",
    "deterministic": true,
    "sealed": true,
    "completed": "2026-06-29T00:00:00Z"
  }
}
```

## Performance Metrics

| Operation | Time | Result |
|-----------|------|--------|
| Hash single file | <1ms | SHA256 digest |
| Hash directory (10 files) | ~5ms | Directory seal |
| Hash recursive (subtree) | ~20ms | Recursive seal |
| Seal all 25 layers | ~100ms | final-seal-report.json |
| Verify all layers | ~100ms | Pass/fail results |
| Full seal → verify → confirm | ~200ms | Certificate generated |

## Next Steps

- [Operations](../operations/running.md) — How to run
- [API Reference](../api/overview.md) — Code examples
- [Troubleshooting](../operations/troubleshooting.md) — Common issues
