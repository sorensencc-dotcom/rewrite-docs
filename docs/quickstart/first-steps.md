---
title: first steps
summary: ""
created: "2026-07-03T19:44:38.062Z"
updated: "2026-07-03T19:44:38.062Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---

# First Steps

After installation, get familiar with the MAAL system.

## 1. Explore the File Structure

```
maal-sandbox/
├── access/              # Access control layer
│   ├── acl/            # ACL definitions
│   ├── permissions/    # Permission mappings
│   └── seals/          # Access sealing
├── federation/         # Federation layer
│   ├── trust/          # Trust graphs
│   ├── handoff/        # Handoff policies
│   └── agents/         # Agent registry
├── snapshot/           # Snapshot layer
│   ├── corpus/         # Corpus ingestion
│   ├── world/          # World state
│   ├── torque/         # TorqueQuery manifest
│   └── seals/          # Snapshot sealing
├── final/              # Final system seal
│   ├── manifest.json   # Layer manifest
│   └── certificate.json # Reproducibility cert
├── access.sh           # Access layer seal script
├── federation.sh       # Federation layer seal script
├── snapshot.sh         # Snapshot layer seal script
└── final.sh            # Final system seal script
```

## 2. Read Key Files

1. **BATCHES_MANIFEST.json** — Master index of all 40 batches
2. **access/seals/access-seal.json** — Access layer manifest
3. **federation/seals/federation-seal.json** — Federation manifest
4. **snapshot/seals/snapshot-seal.json** — Snapshot manifest
5. **final/manifest.json** — Final layer manifest

## 3. Run Your First Seal

```bash
# Seal access layer only
./access.sh
cat access-seal-report.json
```

Output shows hashes of ACL, permissions, and bundles.

## 4. Load ACL & Permissions

Programmatically load access control:

```typescript
import { loadACL } from './access/acl/acl';
import { loadPermissions } from './access/permissions/permissions';

const acl = loadACL();
console.log(acl); // { admin: [...], operator: [...], ... }

const perms = loadPermissions();
console.log(perms); // { read: [...], write: [...], ... }
```

## 5. Load Trust Graph & Agents

```typescript
import { loadTrustGraph } from './federation/trust/trust-graph';
import { loadAgents } from './federation/agents/agents';

const trust = loadTrustGraph();
console.log(trust); // { cic-api: [...], sandbox: [...], ... }

const agents = loadAgents();
console.log(agents); // { cic-api: {...}, sandbox: {...}, ... }
```

## 6. Compute World Hash

```typescript
import { computeWorldHash } from './snapshot/world/world-hash';

const hash = computeWorldHash();
console.log('World Hash:', hash); // SHA256 digest
```

## 7. Load TorqueQuery Manifest

```typescript
import { loadTorqueManifest, getTorqueInputs } from './snapshot/torque/torque-adapter';

const manifest = loadTorqueManifest();
const inputs = getTorqueInputs();
console.log(inputs); // { ingest: "...", world: "..." }
```

## 8. Run Full System Seal

```bash
./final.sh
cat final-seal-report.json
```

Generates hashes for all 25 layers and reproducibility certificate.

## 9. Verify Reproducibility

```bash
node final/verify.js
```

Compares actual hashes against expected values.

## 10. Next: Architecture Deep-Dive

→ [System Design](../architecture/design.md)

---

## Common Commands

```bash
# Run access seal
./access.sh && cat access-seal-report.json

# Run federation seal
./federation.sh && cat federation-seal-report.json

# Run snapshot seal
./snapshot.sh && cat snapshot-seal-report.json

# Run final seal
./final.sh && cat final-seal-report.json

# Verify all
node final/verify.js

# Check reproducibility certificate
cat final/certificate.json
```

## Troubleshooting

- **Hashes don't match?** → Ensure no file modifications between seals
- **Script permission denied?** → Run `bash ./access.sh` instead
- **Module not found?** → Run `npm install` again

Next: [Operations Guide](../operations/running.md)
