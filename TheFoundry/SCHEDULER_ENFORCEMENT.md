# Scheduler Enforcement Patch

This is the code to add to `scheduler.js` to enforce that docs are fresh before running.

---

## Add to scheduler.js (top of main())

```javascript
async function main() {
  // ===== NEW: TheFoundry enforcement =====
  const manifestPath = path.join(__dirname, '..', 'TheFoundry', 'out', 'manifest.json');
  
  let manifest;
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(content);
  } catch (e) {
    console.error(`[ERROR] TheFoundry manifest missing: ${e.message}`);
    console.error(`[ERROR] Run: make foundry (in TheFoundry directory)`);
    process.exit(1);
  }

  // Check manifest is valid
  if (!manifest.version || !manifest.generated_at) {
    console.error('[ERROR] TheFoundry manifest is invalid');
    process.exit(1);
  }

  // Check manifest is fresh (< 1 hour old)
  const manifestAge = Date.now() - new Date(manifest.generated_at).getTime();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  if (manifestAge > maxAge) {
    console.error(
      `[ERROR] TheFoundry manifest is stale (${(manifestAge / 60000).toFixed(0)} minutes old)`
    );
    console.error('[ERROR] Run: make foundry (in TheFoundry directory)');
    process.exit(1);
  }

  console.log(`[OK] TheFoundry manifest valid | generated ${new Date(manifest.generated_at).toISOString()}`);
  console.log(`[OK] Dependency graph: ${manifest.graph_nodes_count} nodes, ${manifest.graph_edges_count} edges`);
  // ===== END: TheFoundry enforcement =====

  // ... rest of main() continues
```

---

## What This Does

1. Loads `TheFoundry/out/manifest.json`
2. Verifies it exists and is valid
3. Checks it's not older than 1 hour
4. If any check fails, exits with error message telling user to run `make foundry`

---

## Result

When scheduler starts:

**Good run:**
```
[OK] TheFoundry manifest valid | generated 2026-06-13T08:00:00Z
[OK] Dependency graph: 9 nodes, 8 edges
[START] Roadmap Scheduler v3.0 | 2026-06-13T08:05:00Z
...
```

**Bad run (docs stale):**
```
[ERROR] TheFoundry manifest is stale (125 minutes old)
[ERROR] Run: make foundry (in TheFoundry directory)
```

**Bad run (docs missing):**
```
[ERROR] TheFoundry manifest missing: ENOENT: no such file or directory
[ERROR] Run: make foundry (in TheFoundry directory)
```

---

## Integration Timeline

1. Build roadmap-runner (done ✓)
2. Build TheFoundry (done ✓)
3. Add enforcement patch to scheduler.js (this document)
4. Test full cycle:
   ```bash
   cd TheFoundry && make build
   cd ../roadmap-runner && make once
   ```

Expected behavior:
- TheFoundry builds docs + graph
- Scheduler enforces freshness
- Roadmap executes with validated, fresh docs
