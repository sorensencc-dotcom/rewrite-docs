---
title: overview
---

# API Reference Overview

Complete API reference for the MAAL Sandbox system.

## Quick Links

- [Access Layer API](access-layer.md) — ACL and permission functions
- [Federation Layer API](federation-layer.md) — Trust and handoff functions
- [Snapshot Layer API](snapshot-layer.md) — World state and TorqueQuery functions
- [Seal & Verify API](seal-verify.md) — Hashing and verification functions

## Module Structure

```
access/
├── acl.ts              # loadACL, getAccess
└── permissions.ts      # loadPermissions, getPermissionTargets

federation/
├── trust-graph.ts      # loadTrustGraph, getTrustedEntities
├── handoff.ts          # loadHandoffPolicy, getHandoffTargets
└── agents.ts           # loadAgents, getAgent

snapshot/
├── corpus-ingest.ts    # ingestCorpus
├── world-hash.ts       # computeWorldHash
└── torque-adapter.ts   # loadTorqueManifest, getTorqueInputs

final/
├── seal.js             # sealLayer
└── verify.js           # verifyLayer
```

## Function Categories

### Access Control (Batch 36)

| Function | Module | Purpose |
|----------|--------|---------|
| `loadACL()` | `access/acl.ts` | Load role-based ACL |
| `getAccess(entity)` | `access/acl.ts` | Get access for entity |
| `loadPermissions()` | `access/permissions.ts` | Load permission mappings |
| `getPermissionTargets(perm)` | `access/permissions.ts` | Get targets for permission |

### Federation (Batch 37)

| Function | Module | Purpose |
|----------|--------|---------|
| `loadTrustGraph()` | `federation/trust-graph.ts` | Load trust relationships |
| `getTrustedEntities(entity)` | `federation/trust-graph.ts` | Get trusted agents |
| `loadHandoffPolicy()` | `federation/handoff.ts` | Load handoff rules |
| `getHandoffTargets(entity)` | `federation/handoff.ts` | Get handoff targets |
| `loadAgents()` | `federation/agents.ts` | Load agent registry |
| `getAgent(name)` | `federation/agents.ts` | Get agent info |

### Snapshots (Batch 39)

| Function | Module | Purpose |
|----------|--------|---------|
| `ingestCorpus()` | `snapshot/corpus-ingest.ts` | Ingest corpus sources |
| `computeWorldHash()` | `snapshot/world-hash.ts` | Compute world state hash |
| `loadTorqueManifest()` | `snapshot/torque-adapter.ts` | Load TorqueQuery manifest |
| `getTorqueInputs()` | `snapshot/torque-adapter.ts` | Get TorqueQuery inputs |

### Sealing (Batch 40)

| Function | Module | Purpose |
|----------|--------|---------|
| `sealLayer(path)` | `final/seal.js` | Recursively hash layer |
| `verifyLayer(path, expected)` | `final/verify.js` | Verify layer hash |
| `runDeterministicAccessSeal()` | `access/seals/` | Seal access layer |
| `runDeterministicFederationSeal()` | `federation/seals/` | Seal federation layer |
| `runDeterministicSnapshotSeal()` | `snapshot/seals/` | Seal snapshot layer |

## Return Types

### ACL

```typescript
type ACL = {
  [role: string]: string[];  // Permissions for each role
};
```

### Permissions

```typescript
type Permissions = {
  [permission: string]: string[];  // Targets for each permission
};
```

### Trust Graph

```typescript
type TrustGraph = {
  [entity: string]: string[];  // Trusted entities
};
```

### Handoff Policy

```typescript
type HandoffPolicy = {
  handoffRules: {
    [entity: string]: string[];  // Handoff targets
  };
  deterministic: boolean;
};
```

### Agents

```typescript
type Agent = {
  type: string;      // Agent type
  version: string;   // Agent version
};

type Agents = {
  [name: string]: Agent;
};
```

### Seal Report

```typescript
type SealReport = {
  [layerName: string]: {
    seal: string;      // SHA256 hash
    verify: {
      expected?: string;
      actual?: string;
      passed: boolean;
    };
  };
};
```

## Usage Examples

### Load and Check Access

```typescript
import { loadACL, getAccess } from './access/acl/acl';

const acl = loadACL();
const adminPerms = getAccess('admin');
console.log(adminPerms);  // ['read', 'write', 'manage']
```

### Load and Query Trust

```typescript
import { loadTrustGraph, getTrustedEntities } from './federation/trust/trust-graph';

const trust = loadTrustGraph();
const apiTrusts = getTrustedEntities('cic-api');
console.log(apiTrusts);  // ['sandbox', 'onnx', 'harness']
```

### Seal and Verify

```typescript
import { sealLayer } from './final/seal';
import { verifyLayer } from './final/verify';

const hash = sealLayer('access/');
const verified = verifyLayer('access/', hash);
console.log(verified.passed);  // true
```

## Error Handling

All functions may throw:

```typescript
Error  // File not found, invalid JSON, etc.
```

Wrap in try/catch:

```typescript
try {
  const acl = loadACL();
} catch (e) {
  console.error('Failed to load ACL:', e.message);
}
```

## See Also

- [Access Layer API](access-layer.md)
- [Federation Layer API](federation-layer.md)
- [Snapshot Layer API](snapshot-layer.md)
- [Seal & Verify API](seal-verify.md)
