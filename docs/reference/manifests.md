---
title: manifests
summary: ""
created: "2026-07-03T19:44:38.093Z"
updated: "2026-07-03T19:44:38.093Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Manifests

Complete reference of all manifests in the MAAL Sandbox system.

## Master Manifest

**File**: `BATCHES_MANIFEST.json`

Top-level index of all 40 batches and 25 layers.

`View BATCHES_MANIFEST.json`

Structure:
```json
{
  "manifest": { ... },
  "batches": { ... },
  "architecture": { ... },
  "execution": { ... },
  "reproducibility": { ... },
  "totals": { ... }
}
```

## Access Layer Manifest

**File**: `access/seals/access-seal.json`

Defines paths to seal in access layer.

```json
{
  "paths": {
    "acl": "access/acl",
    "permissions": "access/permissions",
    "bundles": "access/bundles"
  }
}
```

## Federation Layer Manifest

**File**: `federation/seals/federation-seal.json`

Defines paths to seal in federation layer.

```json
{
  "paths": {
    "trust": "federation/trust",
    "handoff": "federation/handoff",
    "agents": "federation/agents"
  }
}
```

## Snapshot Layer Manifest

**File**: `snapshot/seals/snapshot-seal.json`

Defines paths to seal in snapshot layer.

```json
{
  "paths": {
    "corpus": "snapshot/corpus",
    "world": "snapshot/world",
    "torque": "snapshot/torque"
  }
}
```

## Final Seal Manifest

**File**: `final/manifest.json`

Defines all 25 layers to seal system-wide.

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

## ACL Manifest

**File**: `access/acl/acl.json`

Role-based access control definitions.

```json
{
  "acl": {
    "admin": ["read", "write", "manage"],
    "operator": ["read", "execute"],
    "cic-api": ["invoke", "spawn"],
    "sandbox": ["vm-start", "vm-stop"],
    "onnx": ["infer"]
  }
}
```

## Permissions Manifest

**File**: `access/permissions/permissions.json`

Permission-to-target mappings.

```json
{
  "permissions": {
    "read": ["pods", "services", "deployments"],
    "write": ["configs", "policies"],
    "manage": ["routing", "runtime", "network"],
    "execute": ["harness", "validation"],
    "invoke": ["onnx"],
    "spawn": ["sandbox"],
    "vm-start": ["sandbox"],
    "vm-stop": ["sandbox"],
    "infer": ["onnx"]
  }
}
```

## Access Bundle Manifest

**File**: `access/bundles/access-bundle.json`

Metadata for access bundle.

```json
{
  "bundleVersion": "1.0.0",
  "sealed": true,
  "deterministic": true
}
```

## Trust Graph Manifest

**File**: `federation/trust/trust-graph.json`

Cross-agent trust relationships.

```json
{
  "trust": {
    "cic-api": ["sandbox", "onnx", "harness"],
    "sandbox": ["cic-api"],
    "onnx": ["cic-api"],
    "harness": ["cic-api"],
    "operator": ["cic-api"],
    "admin": ["cic-api", "sandbox", "onnx", "harness"]
  }
}
```

## Handoff Policy Manifest

**File**: `federation/handoff/handoff-policy.json`

Agent handoff routing policies.

```json
{
  "handoffRules": {
    "cic-api": ["onnx", "sandbox", "harness"],
    "sandbox": ["cic-api"],
    "onnx": ["cic-api"],
    "harness": ["cic-api"]
  },
  "deterministic": true
}
```

## Agent Registry Manifest

**File**: `federation/agents/agents.json`

Agent metadata and definitions.

```json
{
  "agents": {
    "cic-api": { "type": "router", "version": "1.0.0" },
    "sandbox": { "type": "vm", "version": "1.0.0" },
    "onnx": { "type": "inference", "version": "1.0.0" },
    "harness": { "type": "validation", "version": "1.0.0" }
  }
}
```

## Corpus Manifest

**File**: `snapshot/corpus/corpus-manifest.json`

Corpus source definitions.

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

## World State Manifest

**File**: `snapshot/world/world-state.json`

Global world state definition.

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

## TorqueQuery Manifest

**File**: `snapshot/torque/torque-manifest.json`

TorqueQuery adapter configuration.

```json
{
  "adapter": "TorqueQuery",
  "ingest": "snapshot/corpus/corpus-index.json",
  "world": "snapshot/world/world-state.json",
  "deterministic": true
}
```

## Reproducibility Certificate

**File**: `final/certificate.json`

Final reproducibility certificate.

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

## Seal Reports

Generated after running seals:

### Access Seal Report

**File**: `access-seal-report.json`

Created by: `./access.sh`

```json
{
  "acl": { "seal": "SHA256_HASH", "verify": true },
  "permissions": { "seal": "SHA256_HASH", "verify": true },
  "bundles": { "seal": "SHA256_HASH", "verify": true }
}
```

### Federation Seal Report

**File**: `federation-seal-report.json`

Created by: `./federation.sh`

```json
{
  "trust": { "seal": "SHA256_HASH", "verify": true },
  "handoff": { "seal": "SHA256_HASH", "verify": true },
  "agents": { "seal": "SHA256_HASH", "verify": true }
}
```

### Snapshot Seal Report

**File**: `snapshot-seal-report.json`

Created by: `./snapshot.sh`

```json
{
  "corpus": { "seal": "SHA256_HASH", "verify": true },
  "world": { "seal": "SHA256_HASH", "verify": true },
  "torque": { "seal": "SHA256_HASH", "verify": true }
}
```

### Final Seal Report

**File**: `final-seal-report.json`

Created by: `./final.sh`

Contains all 25 layer hashes:

```json
{
  "access": { "seal": "SHA256_HASH", "verify": { "passed": true } },
  "federation": { "seal": "SHA256_HASH", "verify": { "passed": true } },
  "snapshot": { "seal": "SHA256_HASH", "verify": { "passed": true } },
  ... (22 more layers)
}
```

## See Also

- [Schemas](schemas.md)
- [Environment](environment.md)
- [Architecture Overview](../architecture/overview.md)
