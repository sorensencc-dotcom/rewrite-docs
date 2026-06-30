# Batch 36: Deterministic Access Layer

Hash-locked ACLs, permission bundles, and access manifests.

## Overview

Batch 36 implements deterministic access control through sealed ACLs and permission definitions.

**Files**: 10  
**Directory**: `access/`  
**Entry Script**: `access.sh`  
**Output**: `access-seal-report.json`

## Components

### ACL Definitions

**File**: `access/acl/acl.json`

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

**Roles**:
- `admin` — Full system access
- `operator` — Read and execute
- `cic-api` — Invoke services
- `sandbox` — VM operations
- `onnx` — Inference operations

### Permission Mappings

**File**: `access/permissions/permissions.json`

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

### Access Bundles

**File**: `access/bundles/access-bundle.json`

Metadata for the access bundle:

```json
{
  "bundleVersion": "1.0.0",
  "sealed": true,
  "deterministic": true
}
```

## Seal Process

```bash
./access.sh
```

**Steps**:

1. Load manifest: `access/seals/access-seal.json`
2. Hash `access/acl/` directory
3. Hash `access/permissions/` directory
4. Hash `access/bundles/` directory
5. Generate report: `access-seal-report.json`

**Output**:

```json
{
  "acl": {
    "seal": "abc123...",
    "verify": true
  },
  "permissions": {
    "seal": "def456...",
    "verify": true
  },
  "bundles": {
    "seal": "ghi789...",
    "verify": true
  }
}
```

## Programmatic Usage

### Load ACL

```typescript
import { loadACL, getAccess } from './access/acl/acl';

const acl = loadACL();
console.log(acl);
// { admin: [...], operator: [...], ... }

const adminAccess = getAccess("admin");
// ["read", "write", "manage"]
```

### Load Permissions

```typescript
import { loadPermissions, getPermissionTargets } from './access/permissions/permissions';

const perms = loadPermissions();
console.log(perms);
// { read: [...], write: [...], ... }

const readTargets = getPermissionTargets("read");
// ["pods", "services", "deployments"]
```

## Verification

```bash
node access/seals/access-verify.js
```

Compares actual hashes against expected values in `access-seal-report.json`.

## Integration

Batch 36 (Access) integrates with:

- **Batch 37** (Federation) — Trust decisions respect access controls
- **Batch 40** (Final Seal) — Access layer is hashed in system seal
- **Batches 1-35** (Foundation) — Secures MAAL and sandbox operations

## File Structure

```
access/
├── acl/
│   ├── acl.json          # ACL definitions
│   └── acl.ts            # ACL loader (TypeScript)
├── permissions/
│   ├── permissions.json  # Permission mappings
│   └── permissions.ts    # Permission loader (TypeScript)
├── bundles/
│   └── access-bundle.json # Bundle metadata
└── seals/
    ├── access-seal.json  # Manifest of paths to seal
    ├── access-hash.js    # Hashing function
    ├── access-verify.js  # Verification function
    └── deterministic-access.js # Full seal runner
```

## See Also

- [Batch 37 (Federation)](batch-37.md)
- [Batch 40 (Final Seal)](batch-40.md)
- [Architecture Overview](../architecture/overview.md)
