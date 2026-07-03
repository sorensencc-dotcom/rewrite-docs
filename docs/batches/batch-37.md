---
title: batch 37
summary: ""
created: "2026-07-03T19:44:37.631Z"
updated: "2026-07-03T19:44:37.631Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Batch 37: Deterministic Federation Layer

Cross-agent trust graphs, sealed handoff policies, and agent registries.

## Overview

Batch 37 implements deterministic federation through trust graphs, handoff policies, and agent definitions.

**Files**: 11  
**Directory**: `federation/`  
**Entry Script**: `federation.sh`  
**Output**: `federation-seal-report.json`

## Components

### Trust Graph

**File**: `federation/trust/trust-graph.json`

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

**Trust Relationships**:
- `cic-api` trusts: sandbox, onnx, harness
- `sandbox` trusts: cic-api
- `onnx` trusts: cic-api
- `harness` trusts: cic-api
- `operator` trusts: cic-api (read-only)
- `admin` trusts: all (full access)

### Handoff Policy

**File**: `federation/handoff/handoff-policy.json`

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

**Handoff Rules**:
- `cic-api` can hand off to: onnx, sandbox, harness
- Specialized agents hand off back to `cic-api`

### Agent Registry

**File**: `federation/agents/agents.json`

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

**Agents**:
- `cic-api` (router) — Central routing agent
- `sandbox` (vm) — VM execution agent
- `onnx` (inference) — Model inference agent
- `harness` (validation) — Validation harness agent

## Seal Process

```bash
./federation.sh
```

**Steps**:

1. Load manifest: `federation/seals/federation-seal.json`
2. Hash `federation/trust/` directory
3. Hash `federation/handoff/` directory
4. Hash `federation/agents/` directory
5. Generate report: `federation-seal-report.json`

**Output**:

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

## Programmatic Usage

### Load Trust Graph

```typescript
import { loadTrustGraph, getTrustedEntities } from './federation/trust/trust-graph';

const trust = loadTrustGraph();
console.log(trust);
// { cic-api: [...], sandbox: [...], ... }

const apiTrusts = getTrustedEntities("cic-api");
// ["sandbox", "onnx", "harness"]
```

### Load Handoff Policy

```typescript
import { loadHandoffPolicy, getHandoffTargets } from './federation/handoff/handoff';

const policy = loadHandoffPolicy();
console.log(policy);
// { handoffRules: {...}, deterministic: true }

const targets = getHandoffTargets("cic-api");
// ["onnx", "sandbox", "harness"]
```

### Load Agents

```typescript
import { loadAgents, getAgent } from './federation/agents/agents';

const agents = loadAgents();
console.log(agents);
// { cic-api: {...}, sandbox: {...}, ... }

const apiAgent = getAgent("cic-api");
// { type: "router", version: "1.0.0" }
```

## Federation Flow

```
Request comes in
    ↓
cic-api (router) receives
    ↓
Check trust: does cic-api trust target?
    ↓
Check handoff: can we hand off to target?
    ↓
Get agent info: load agent definition
    ↓
Execute on target agent
    ↓
Hand off response back
```

## Verification

```bash
node federation/seals/federation-verify.js
```

Compares actual hashes against expected values in `federation-seal-report.json`.

## Integration

Batch 37 (Federation) integrates with:

- **Batch 36** (Access) — Federation decisions respect access controls
- **Batch 40** (Final Seal) — Federation layer is hashed in system seal
- **Batches 1-35** (Foundation) — Coordinates multi-agent routing

## File Structure

```
federation/
├── trust/
│   ├── trust-graph.json  # Trust relationships
│   └── trust-graph.ts    # Trust loader (TypeScript)
├── handoff/
│   ├── handoff-policy.json # Handoff rules
│   └── handoff.ts          # Handoff loader (TypeScript)
├── agents/
│   ├── agents.json       # Agent registry
│   └── agents.ts         # Agent loader (TypeScript)
└── seals/
    ├── federation-seal.json  # Manifest
    ├── federation-hash.js    # Hashing function
    ├── federation-verify.js  # Verification function
    └── deterministic-federation.js # Full seal runner
```

## See Also

- [Batch 36 (Access)](batch-36.md)
- [Batch 40 (Final Seal)](batch-40.md)
- [Architecture Overview](../architecture/overview.md)
