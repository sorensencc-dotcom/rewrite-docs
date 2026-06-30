# Schemas

TypeScript and JSON schemas for MAAL Sandbox data structures.

## ACL Schema

```typescript
type ACL = {
  [role: string]: string[];  // Permission strings
};

// Example:
{
  "admin": ["read", "write", "manage"],
  "operator": ["read", "execute"]
}
```

## Permissions Schema

```typescript
type Permissions = {
  [permission: string]: string[];  // Target resource names
};

// Example:
{
  "read": ["pods", "services", "deployments"],
  "write": ["configs", "policies"]
}
```

## Trust Graph Schema

```typescript
type TrustGraph = {
  [entity: string]: string[];  // Trusted entity names
};

// Example:
{
  "cic-api": ["sandbox", "onnx", "harness"],
  "sandbox": ["cic-api"]
}
```

## Handoff Policy Schema

```typescript
type HandoffPolicy = {
  handoffRules: {
    [entity: string]: string[];  // Handoff target names
  };
  deterministic: boolean;
};

// Example:
{
  "handoffRules": {
    "cic-api": ["onnx", "sandbox", "harness"],
    "sandbox": ["cic-api"]
  },
  "deterministic": true
}
```

## Agent Schema

```typescript
type Agent = {
  type: string;      // "router", "vm", "inference", "validation"
  version: string;   // Semantic version
};

type Agents = {
  [name: string]: Agent;
};

// Example:
{
  "cic-api": { "type": "router", "version": "1.0.0" },
  "sandbox": { "type": "vm", "version": "1.0.0" }
}
```

## World State Schema

```typescript
type WorldState = {
  version: string;        // Semantic version
  timestamp: string;      // ISO 8601 datetime
  components: string[];   // Component names
};

// Example:
{
  "version": "1.0.0",
  "timestamp": "2026-06-29T00:00:00Z",
  "components": ["routing", "sandbox", "onnx", "harness", ...]
}
```

## Corpus Schema

```typescript
type CorpusManifest = {
  sources: {
    [source: string]: string;  // Path to source
  };
  deterministic: boolean;
};

type CorpusIndex = {
  [source: string]: string[];  // Files in source
};

// Manifest Example:
{
  "sources": {
    "routing": "dist/routing",
    "sandbox": "dist/sandbox"
  },
  "deterministic": true
}

// Index Example:
{
  "routing": ["dist/routing/file1.js", "dist/routing/file2.js"],
  "sandbox": ["dist/sandbox/file1.js"]
}
```

## Seal Schema

```typescript
type Seal = {
  seal: string;    // SHA256 hash
  verify: {
    expected?: string;
    actual?: string;
    passed: boolean;
  };
};

type SealReport = {
  [layerName: string]: Seal;
};

// Example:
{
  "acl": {
    "seal": "a1b2c3d4e5f6...",
    "verify": {
      "expected": "a1b2c3d4e5f6...",
      "actual": "a1b2c3d4e5f6...",
      "passed": true
    }
  }
}
```

## Manifest Schema

```typescript
type LayerManifest = {
  paths: {
    [layerName: string]: string;  // Path to seal
  };
};

type SystemManifest = {
  layers: {
    [layerName: string]: string;  // Layer path
  };
};

// Layer Example:
{
  "paths": {
    "acl": "access/acl",
    "permissions": "access/permissions"
  }
}

// System Example:
{
  "layers": {
    "access": "access/",
    "federation": "federation/",
    "snapshot": "snapshot/"
  }
}
```

## Certificate Schema

```typescript
type Certificate = {
  sandbox3: {
    version: string;      // Semantic version
    deterministic: boolean;
    sealed: boolean;
    completed: string;    // ISO 8601 datetime
  };
};

// Example:
{
  "sandbox3": {
    "version": "1.0.0",
    "deterministic": true,
    "sealed": true,
    "completed": "2026-06-29T00:00:00Z"
  }
}
```

## JSON Schema (for validation)

### ACL JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "acl": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "string" }
      }
    }
  },
  "required": ["acl"]
}
```

### Manifest JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "paths": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    }
  },
  "required": ["paths"]
}
```

### Seal Report JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": {
    "type": "object",
    "properties": {
      "seal": { "type": "string" },
      "verify": {
        "type": "object",
        "properties": {
          "expected": { "type": "string" },
          "actual": { "type": "string" },
          "passed": { "type": "boolean" }
        },
        "required": ["passed"]
      }
    },
    "required": ["seal", "verify"]
  }
}
```

## Type Safety

All TypeScript modules export their types:

```typescript
// Access module
export type ACL = { ... };

// Federation module
export type TrustGraph = { ... };
export type Agent = { ... };

// Snapshot module
export type WorldState = { ... };
```

Usage:

```typescript
import type { ACL, TrustGraph } from './types';

const acl: ACL = loadACL();
const trust: TrustGraph = loadTrustGraph();
```

## Validation

Validate JSON against schemas:

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(aclSchema);

const valid = validate(data);
if (!valid) {
  console.error(validate.errors);
}
```

## See Also

- [Manifests](manifests.md)
- [Environment](environment.md)
- [API Reference](../api/overview.md)
