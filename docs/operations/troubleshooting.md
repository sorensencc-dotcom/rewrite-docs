# Troubleshooting

Common issues and solutions.

## Seal Failures

### Issue: Permission Denied

**Error**: `Permission denied: access.sh`

**Cause**: Script not executable

**Solution**:
```bash
chmod +x access.sh federation.sh snapshot.sh final.sh
./access.sh
```

Or run explicitly:
```bash
bash ./access.sh
```

### Issue: Module Not Found

**Error**: `Cannot find module 'access/acl/acl'`

**Cause**: Missing npm dependencies

**Solution**:
```bash
npm install
npm run build
./final.sh
```

### Issue: File Not Found

**Error**: `ENOENT: no such file or directory 'access/acl/acl.json'`

**Cause**: Files not created or path wrong

**Solution**:
```bash
# Check files exist
ls -la access/acl/acl.json

# If missing, restore from git
git checkout access/

# Reseal
./access.sh
```

## Hash Mismatches

### Issue: Reproducibility Broken

**Error**: `Hash mismatch: expected abc123 but got def456`

**Cause**: Files were modified

**Solution**:
```bash
# Check what changed
git diff access/

# Restore original files
git checkout access/

# Reseal
./access.sh
```

### Issue: Different Hashes on Re-seal

**Error**: Same layer hashes differently each time

**Cause**: 
- Files being modified during seal
- Non-deterministic file content
- OS differences

**Solution**:
```bash
# Ensure clean state
git status

# Verify no processes modifying files
lsof access/ federation/ snapshot/

# Reseal
./final.sh

# Compare reports
diff final-seal-report.json final-seal-report.json.backup
```

## Verification Failures

### Issue: Verification Always Fails

**Error**: `Verification failed: hash mismatch on all layers`

**Cause**: Baseline hashes not saved or corrupted

**Solution**:
```bash
# Create new baseline
./final.sh

# Save as reference
cp final-seal-report.json baseline.json

# Verify against new baseline
node final/verify.js
```

### Issue: Some Layers Fail, Others Pass

**Error**: `Access layer passed, federation failed`

**Cause**: Only some layers modified

**Solution**:
```bash
# Check which layer changed
cat final-seal-report.json | jq '.federation'

# Reseal just that layer
./federation.sh

# Check if change was intentional
git diff federation/

# If intentional, update baseline
cp final-seal-report.json baseline.json
```

## Build Issues

### Issue: TypeScript Compilation Error

**Error**: `error TS2304: Cannot find name 'fs'`

**Cause**: Missing type definitions

**Solution**:
```bash
npm install --save-dev @types/node
npm run build
```

### Issue: Jest Tests Fail

**Error**: `FAIL  src/tests/maal-routing-policy.test.ts`

**Cause**: Test environment not set up

**Solution**:
```bash
npm install
npm test

# Run specific test
npm test -- maal-routing-policy.test.ts
```

## Docker Issues

### Issue: Container Build Fails

**Error**: `Step 3/10 : RUN npm install - failed`

**Cause**: Node version mismatch or network issue

**Solution**:
```bash
# Clear docker cache
docker build --no-cache -t maal-sandbox .

# Or verify Node version
docker run node:20 node --version
```

### Issue: Container Execution Fails

**Error**: `./final.sh: command not found`

**Cause**: Script not executable in container

**Solution**:
```bash
# In Dockerfile, add:
RUN chmod +x *.sh

# Or run bash explicitly
docker run maal-sandbox bash final.sh
```

## Performance Issues

### Issue: Seal is Very Slow

**Error**: `Sealing takes >5 seconds`

**Cause**:
- Large number of files
- Slow disk
- Other processes using disk

**Solution**:
```bash
# Check disk usage
du -sh access/ federation/ snapshot/ final/

# Monitor disk activity
iotop

# Use SSD if possible
time ./final.sh  # Measure actual time
```

### Issue: Memory Issues

**Error**: `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed`

**Cause**: Node heap overflow (unlikely for seal operations)

**Solution**:
```bash
# Increase heap size
NODE_OPTIONS="--max-old-space-size=4096" ./final.sh
```

## Directory Issues

### Issue: Directory Not Found

**Error**: `ENOENT: open 'access/acl/acl.json'`

**Cause**: Directory structure not created

**Solution**:
```bash
# Create directories manually
mkdir -p access/{acl,permissions,bundles,seals}
mkdir -p federation/{trust,handoff,agents,seals}
mkdir -p snapshot/{corpus,world,torque,seals}
mkdir -p final

# Then run seals
./access.sh
./federation.sh
./snapshot.sh
./final.sh
```

## Git Issues

### Issue: Can't Restore Files

**Error**: `fatal: Path 'access/acl/acl.json' does not exist in 'HEAD'`

**Cause**: Files not in version control

**Solution**:
```bash
# Check git status
git status

# Add files to git
git add access/ federation/ snapshot/ final/
git commit -m "Add system layers"

# Now restoration works
git checkout access/
```

### Issue: Uncommitted Changes

**Error**: `error: Your local changes would be overwritten`

**Cause**: Modified files blocking seal

**Solution**:
```bash
# Stash changes
git stash

# Reseal
./final.sh

# Apply changes back
git stash pop
```

## Certificate Issues

### Issue: Certificate Missing

**Error**: `Error: ENOENT: no such file or directory 'final/certificate.json'`

**Cause**: Final seal not run successfully

**Solution**:
```bash
# Run final seal
./final.sh

# Check if created
test -f final/certificate.json && echo "✓ Certificate created"

# View certificate
cat final/certificate.json
```

## Diagnostic Checklist

When troubleshooting, run:

```bash
#!/bin/bash
echo "=== System Status ==="
echo "Node version:"
node --version

echo -e "\n=== Git Status ==="
git status

echo -e "\n=== File Structure ==="
ls -la access/ federation/ snapshot/ final/

echo -e "\n=== Latest Seal Report ==="
test -f final-seal-report.json && cat final-seal-report.json || echo "No seal report"

echo -e "\n=== Certificate ==="
test -f final/certificate.json && cat final/certificate.json || echo "No certificate"

echo -e "\n=== Test Run ==="
npm test 2>&1 | head -20

echo -e "\n=== Build ==="
npm run build 2>&1 | tail -5
```

## Getting Help

If stuck:

1. Check this troubleshooting guide
2. Check error messages carefully
3. Run diagnostic checklist above
4. Review [Running the System](running.md)
5. Check [Sealing Layers](sealing.md) for correct procedures
6. Review [Verification](verification.md) for reproducibility checks

## See Also

- [Running the System](running.md)
- [Sealing Layers](sealing.md)
- [Verification](verification.md)
- [Monitoring](monitoring.md)
