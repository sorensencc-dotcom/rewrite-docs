---
title: running
---

# Running the System

Complete guide to running the MAAL Sandbox system.

## Prerequisites

- Node.js 20+
- Bash/PowerShell
- Git
- 500MB+ free disk space

## Installation

1. **Clone and install**
   ```bash
   git clone <repo>
   cd maal-sandbox
   npm install
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Verify installation**
   ```bash
   npm test
   ```

## Running Seals

### Quick Start (All Layers)

Run complete system seal:

```bash
./final.sh
```

This executes all layers in sequence:
1. Access layer (`access.sh`)
2. Federation layer (`federation.sh`)
3. Snapshot layer (`snapshot.sh`)
4. Final system seal (`final.sh`)

### Step-by-Step

Run each layer individually:

```bash
# 1. Seal access layer
./access.sh
cat access-seal-report.json

# 2. Seal federation layer
./federation.sh
cat federation-seal-report.json

# 3. Seal snapshot layer
./snapshot.sh
cat snapshot-seal-report.json

# 4. Seal entire system
./final.sh
cat final-seal-report.json
cat final/certificate.json
```

## Programmatic Usage

### Load and Use Functions

```typescript
import { loadACL } from './access/acl/acl';
import { loadTrustGraph } from './federation/trust/trust-graph';
import { computeWorldHash } from './snapshot/world/world-hash';

// 1. Load access control
const acl = loadACL();
console.log('Admin access:', acl.admin);

// 2. Load trust graph
const trust = loadTrustGraph();
console.log('cic-api trusts:', trust['cic-api']);

// 3. Compute world hash
const hash = computeWorldHash();
console.log('World hash:', hash);
```

### Run Seals Programmatically

```typescript
import { runDeterministicAccessSeal } from './access/seals/deterministic-access';
import { runDeterministicFederationSeal } from './federation/seals/deterministic-federation';
import { runDeterministicSnapshotSeal } from './snapshot/seals/deterministic-snapshot';

// Seal all layers
await runDeterministicAccessSeal();
await runDeterministicFederationSeal();
await runDeterministicSnapshotSeal();

console.log('✅ All layers sealed');
```

## Environment Variables

Optional environment configuration:

```bash
export NODE_ENV=production
export LOG_LEVEL=info
export DEBUG=false
```

## Output Files

After running seals, check these files:

| File | Created By | Contains |
|------|-----------|----------|
| `access-seal-report.json` | `access.sh` | Access layer hashes |
| `federation-seal-report.json` | `federation.sh` | Federation layer hashes |
| `snapshot-seal-report.json` | `snapshot.sh` | Snapshot layer hashes |
| `final-seal-report.json` | `final.sh` | All 25 layer hashes |
| `final/certificate.json` | `final.sh` | Reproducibility cert |

## Running Tests

Test the system:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/tests/maal-routing-policy.test.ts
```

## Docker Execution

Run in container:

```bash
# Build image
docker build -t maal-sandbox .

# Run container
docker run -it maal-sandbox /bin/bash

# Inside container: seal system
npm install
./final.sh
```

## Monitoring

Watch seal execution:

```bash
# Verbose mode
DEBUG=true ./final.sh

# Follow logs
tail -f final-seal-report.json
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Run with `bash ./access.sh` |
| Module not found | Run `npm install` again |
| Hash mismatch | Ensure no file modifications |
| Build fails | Check Node.js version (need 20+) |

## Performance

Expected execution times:

| Operation | Time |
|-----------|------|
| Single layer seal | ~10ms |
| All 4 layers (seq) | ~100ms |
| Full system (25 layers) | ~250ms |
| Verify all layers | ~250ms |
| Total (seal + verify) | ~500ms |

## See Also

- [Sealing Layers](sealing.md)
- [Verification](verification.md)
- [Troubleshooting](troubleshooting.md)
