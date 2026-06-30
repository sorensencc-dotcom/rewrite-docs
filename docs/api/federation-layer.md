# Federation Layer API

Detailed API reference for federation functions (Batch 37).

## Module: federation/trust/trust-graph.ts

### loadTrustGraph()

Load cross-agent trust relationships.

**Signature**:
```typescript
function loadTrustGraph(): TrustGraph
```

**Returns**:
```typescript
type TrustGraph = {
  [entity: string]: string[];  // Trusted entities
};

// Example:
{
  "cic-api": ["sandbox", "onnx", "harness"],
  "sandbox": ["cic-api"],
  "onnx": ["cic-api"],
  "harness": ["cic-api"],
  "operator": ["cic-api"],
  "admin": ["cic-api", "sandbox", "onnx", "harness"]
}
```

**Throws**: `Error` if file not found or invalid JSON

**Example**:
```typescript
import { loadTrustGraph } from './federation/trust/trust-graph';

const trust = loadTrustGraph();
console.log(trust['cic-api']);  // ["sandbox", "onnx", "harness"]
```

### getTrustedEntities(entity: string)

Get entities trusted by a given entity.

**Signature**:
```typescript
function getTrustedEntities(entity: string): string[]
```

**Parameters**:
- `entity` — Entity name (e.g., "cic-api", "sandbox")

**Returns**: Array of trusted entity names, or empty array if not found

**Example**:
```typescript
import { getTrustedEntities } from './federation/trust/trust-graph';

const trusted = getTrustedEntities('admin');
console.log(trusted);  // ["cic-api", "sandbox", "onnx", "harness"]
```

## Module: federation/handoff/handoff.ts

### loadHandoffPolicy()

Load handoff routing policies.

**Signature**:
```typescript
function loadHandoffPolicy(): HandoffPolicy
```

**Returns**:
```typescript
type HandoffPolicy = {
  handoffRules: {
    [entity: string]: string[];
  };
  deterministic: boolean;
};

// Example:
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

**Throws**: `Error` if file not found or invalid JSON

**Example**:
```typescript
import { loadHandoffPolicy } from './federation/handoff/handoff';

const policy = loadHandoffPolicy();
console.log(policy.handoffRules['cic-api']);  // ["onnx", "sandbox", "harness"]
```

### getHandoffTargets(entity: string)

Get handoff targets for an entity.

**Signature**:
```typescript
function getHandoffTargets(entity: string): string[]
```

**Parameters**:
- `entity` — Entity name (e.g., "cic-api")

**Returns**: Array of handoff target names, or empty array if not found

**Example**:
```typescript
import { getHandoffTargets } from './federation/handoff/handoff';

const targets = getHandoffTargets('cic-api');
console.log(targets);  // ["onnx", "sandbox", "harness"]
```

## Module: federation/agents/agents.ts

### loadAgents()

Load agent registry and metadata.

**Signature**:
```typescript
function loadAgents(): Agents
```

**Returns**:
```typescript
type Agent = {
  type: string;      // Agent type
  version: string;   // Version
};

type Agents = {
  [name: string]: Agent;
};

// Example:
{
  "cic-api": { "type": "router", "version": "1.0.0" },
  "sandbox": { "type": "vm", "version": "1.0.0" },
  "onnx": { "type": "inference", "version": "1.0.0" },
  "harness": { "type": "validation", "version": "1.0.0" }
}
```

**Throws**: `Error` if file not found or invalid JSON

**Example**:
```typescript
import { loadAgents } from './federation/agents/agents';

const agents = loadAgents();
console.log(agents['cic-api']);  // { type: "router", version: "1.0.0" }
```

### getAgent(name: string)

Get agent metadata.

**Signature**:
```typescript
function getAgent(name: string): Agent | undefined
```

**Parameters**:
- `name` — Agent name (e.g., "cic-api", "sandbox")

**Returns**: Agent object, or undefined if not found

```typescript
type Agent = {
  type: string;
  version: string;
};
```

**Example**:
```typescript
import { getAgent } from './federation/agents/agents';

const agent = getAgent('sandbox');
console.log(agent);  // { type: "vm", version: "1.0.0" }
```

## Complete Example

```typescript
import { loadTrustGraph, getTrustedEntities } from './federation/trust/trust-graph';
import { loadHandoffPolicy, getHandoffTargets } from './federation/handoff/handoff';
import { loadAgents, getAgent } from './federation/agents/agents';

// 1. Load trust graph
const trust = loadTrustGraph();
console.log('Trust relationships:', trust);

// 2. Check what cic-api trusts
const trusted = getTrustedEntities('cic-api');
console.log('cic-api trusts:', trusted);  // ["sandbox", "onnx", "harness"]

// 3. Load handoff policy
const policy = loadHandoffPolicy();
console.log('Policy deterministic:', policy.deterministic);

// 4. Check handoff targets
const targets = getHandoffTargets('cic-api');
console.log('cic-api can hand off to:', targets);  // ["onnx", "sandbox", "harness"]

// 5. Load agents
const agents = loadAgents();
console.log('Available agents:', Object.keys(agents));

// 6. Get agent info
const agent = getAgent('sandbox');
console.log('Sandbox agent:', agent);  // { type: "vm", version: "1.0.0" }

// 7. Federation decision
function canFederate(source, target) {
  const trusted = getTrustedEntities(source);
  if (!trusted.includes(target)) return false;
  
  const targets = getHandoffTargets(source);
  return targets.includes(target);
}

console.log(canFederate('cic-api', 'sandbox'));  // true
console.log(canFederate('sandbox', 'onnx'));     // false
```

## Agents

| Agent | Type | Version | Purpose |
|-------|------|---------|---------|
| `cic-api` | router | 1.0.0 | Central routing |
| `sandbox` | vm | 1.0.0 | Execution environment |
| `onnx` | inference | 1.0.0 | Model inference |
| `harness` | validation | 1.0.0 | Validation |

## See Also

- [Overview](overview.md)
- [Access Layer API](access-layer.md)
- [Snapshot Layer API](snapshot-layer.md)
- [Batch 37 Details](../batches/batch-37.md)
