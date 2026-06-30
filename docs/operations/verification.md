---
title: verification
---

# Verification

Complete guide to verifying sealed layers and system reproducibility.

## What is Verification?

Verification = proving that current files match sealed hashes.

**Purpose**: Detect file changes, confirm reproducibility.

## Verification Methods

### Method 1: Automatic (Built-in)

Each seal script includes automatic verification:

```bash
./access.sh
# Output: verification results embedded
```

### Method 2: Manual (Separate)

Verify independently:

```bash
node access/seals/access-verify.js
node federation/seals/federation-verify.js
node snapshot/seals/snapshot-verify.js
node final/verify.js
```

### Method 3: Batch (All Layers)

Verify entire system:

```bash
./final.sh
# Automatically verifies all 25 layers
```

## Single Layer Verification

### Verify Access Layer

```bash
node access/seals/access-verify.js
```

Expected output if all pass:

```json
{
  "acl": { "expected": "abc123...", "actual": "abc123...", "passed": true },
  "permissions": { "expected": "def456...", "actual": "def456...", "passed": true },
  "bundles": { "expected": "ghi789...", "actual": "ghi789...", "passed": true }
}
```

### Verify Federation Layer

```bash
node federation/seals/federation-verify.js
```

Output structure same as above (3 components).

### Verify Snapshot Layer

```bash
node snapshot/seals/snapshot-verify.js
```

Output structure same as above (3 components).

## Full System Verification

```bash
./final.sh
```

Verifies all 25 layers. Output:

```json
{
  "access": { "seal": "...", "verify": { "passed": true } },
  "federation": { "seal": "...", "verify": { "passed": true } },
  "snapshot": { "seal": "...", "verify": { "passed": true } },
  ... (22 more layers)
}
```

Then check certificate:

```bash
cat final/certificate.json
```

Output:

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

## Verification Workflow

### Step 1: Run Seal

```bash
./final.sh
```

Creates `final-seal-report.json` with hashes.

### Step 2: Verify

```bash
node final/verify.js
```

Compares actual hashes vs. expected.

### Step 3: Check Results

```bash
cat final-seal-report.json | grep "passed"
```

Look for `"passed": true` on all lines.

### Step 4: Confirm Status

```bash
cat final/certificate.json
```

Should show:
- `"deterministic": true`
- `"sealed": true`
- Recent timestamp

## Detecting Changes

If a file is modified:

```bash
# 1. Modify a file
echo 'extra content' >> access/acl/acl.json

# 2. Re-seal
./access.sh

# 3. Check report
cat access-seal-report.json

# Output shows:
# {
#   "acl": {
#     "seal": "NEW_HASH",        # Changed!
#     "verify": { "passed": false }  # Mismatch!
#   }
# }
```

The hash changed because file changed = **not reproducible**.

## Reproducibility Guarantees

✅ **If all hashes match**:
- Files haven't changed
- System is reproducible
- All layers are sealed
- Certificate is valid

❌ **If any hash mismatches**:
- File was modified
- System not reproducible
- Need to investigate change
- May need to reseal

## Verification Checklist

```bash
# 1. Run full system seal
./final.sh
# ✓ Check exit code (should be 0)

# 2. Check seal reports exist
test -f access-seal-report.json && echo "✓ Access sealed"
test -f federation-seal-report.json && echo "✓ Federation sealed"
test -f snapshot-seal-report.json && echo "✓ Snapshot sealed"
test -f final-seal-report.json && echo "✓ System sealed"

# 3. Verify all passed
node final/verify.js | grep '"passed": true'
# ✓ Should see 25 passing lines

# 4. Check certificate
cat final/certificate.json | grep "sealed"
# ✓ Should show "sealed": true

# 5. Manual spot-check
cat final-seal-report.json | grep "access" -A2
# ✓ Should show seal hash and "passed": true
```

## Programmatic Verification

```typescript
import { verifyLayer } from './final/verify';
import fs from 'fs';

// Load expected hashes
const report = JSON.parse(
  fs.readFileSync('final-seal-report.json')
);

// Verify each layer
const results = {};
for (const [name, expected] of Object.entries(report)) {
  const path = `${name}/`;
  const result = verifyLayer(path, expected.seal);
  results[name] = result.passed;
}

// Check overall
const allPassed = Object.values(results).every(p => p);
console.log(allPassed ? "✅ All verified" : "❌ Some failed");

// Show failures
for (const [name, passed] of Object.entries(results)) {
  if (!passed) {
    console.log(`❌ Failed: ${name}`);
  }
}
```

## Troubleshooting Verification Failures

| Issue | Cause | Solution |
|-------|-------|----------|
| Hashes don't match | Files modified | Restore files or reseal |
| File not found | Layer missing | Create directory |
| Invalid JSON | Corrupt file | Restore from backup |
| Permission denied | Access issue | Check file permissions |

## Verification Timeline

```
T0: Original seal (create hashes)
    ./final.sh → final-seal-report.json

T1: Later (verify reproducibility)
    ./final.sh → final-seal-report.json (v2)
    
    Compare: v1 == v2 ?
    ✅ Yes → System reproducible
    ❌ No → Files changed
```

## See Also

- [Sealing Layers](sealing.md)
- [Running the System](running.md)
- [Troubleshooting](troubleshooting.md)
