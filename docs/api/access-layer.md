---
title: access layer
summary: ""
created: "2026-07-03T19:44:37.584Z"
updated: "2026-07-03T19:44:37.586Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# Access Layer API

Detailed API reference for access control functions (Batch 36).

## Module: access/acl/acl.ts

### loadACL()

Load role-based access control list.

**Signature**:
```typescript
function loadACL(): ACL
```

**Returns**:
```typescript
type ACL = {
  [role: string]: string[];
};

// Example:
{
  "admin": ["read", "write", "manage"],
  "operator": ["read", "execute"],
  "cic-api": ["invoke", "spawn"],
  "sandbox": ["vm-start", "vm-stop"],
  "onnx": ["infer"]
}
```

**Throws**: `Error` if file not found or invalid JSON

**Example**:
```typescript
import { loadACL } from './access/acl/acl';

const acl = loadACL();
console.log(acl.admin);  // ["read", "write", "manage"]
```

### getAccess(entity: string)

Get access permissions for an entity.

**Signature**:
```typescript
function getAccess(entity: string): string[]
```

**Parameters**:
- `entity` — Role name (e.g., "admin", "operator")

**Returns**: Array of permission strings, or empty array if not found

**Example**:
```typescript
import { getAccess } from './access/acl/acl';

const permissions = getAccess("cic-api");
console.log(permissions);  // ["invoke", "spawn"]
```

## Module: access/permissions/permissions.ts

### loadPermissions()

Load permission-to-target mappings.

**Signature**:
```typescript
function loadPermissions(): Permissions
```

**Returns**:
```typescript
type Permissions = {
  [permission: string]: string[];
};

// Example:
{
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
```

**Throws**: `Error` if file not found or invalid JSON

**Example**:
```typescript
import { loadPermissions } from './access/permissions/permissions';

const perms = loadPermissions();
console.log(perms.read);  // ["pods", "services", "deployments"]
```

### getPermissionTargets(permission: string)

Get target resources for a permission.

**Signature**:
```typescript
function getPermissionTargets(permission: string): string[]
```

**Parameters**:
- `permission` — Permission name (e.g., "read", "write")

**Returns**: Array of target resource names, or empty array if not found

**Example**:
```typescript
import { getPermissionTargets } from './access/permissions/permissions';

const targets = getPermissionTargets("manage");
console.log(targets);  // ["routing", "runtime", "network"]
```

## Complete Example

```typescript
import { loadACL, getAccess } from './access/acl/acl';
import { loadPermissions, getPermissionTargets } from './access/permissions/permissions';

// 1. Load ACL
const acl = loadACL();
console.log('Roles:', Object.keys(acl));

// 2. Check admin access
const adminPerms = getAccess('admin');
console.log('Admin can:', adminPerms);  // ["read", "write", "manage"]

// 3. Load permissions
const perms = loadPermissions();
console.log('Permissions:', Object.keys(perms));

// 4. Check what "read" allows
const readTargets = getPermissionTargets('read');
console.log('Read targets:', readTargets);  // ["pods", "services", "deployments"]

// 5. Access control decision
function canAccess(role, permission, target) {
  const rolePerms = getAccess(role);
  if (!rolePerms.includes(permission)) return false;
  
  const targets = getPermissionTargets(permission);
  return targets.includes(target);
}

console.log(canAccess('admin', 'read', 'pods'));      // true
console.log(canAccess('operator', 'write', 'configs')); // false
```

## Roles

| Role | Permissions | Purpose |
|------|-------------|---------|
| `admin` | read, write, manage | Full system access |
| `operator` | read, execute | Read & execute only |
| `cic-api` | invoke, spawn | Service invocation |
| `sandbox` | vm-start, vm-stop | VM operations |
| `onnx` | infer | Inference operations |

## Permissions

| Permission | Targets | Purpose |
|------------|---------|---------|
| `read` | pods, services, deployments | Read resources |
| `write` | configs, policies | Write configurations |
| `manage` | routing, runtime, network | Manage infrastructure |
| `execute` | harness, validation | Execute tools |
| `invoke` | onnx | Invoke services |
| `spawn` | sandbox | Spawn VMs |
| `vm-start` | sandbox | Start VMs |
| `vm-stop` | sandbox | Stop VMs |
| `infer` | onnx | Run inference |

## See Also

- [Overview](overview.md)
- [Federation Layer API](federation-layer.md)
- [Batch 36 Details](../batches/batch-36.md)
