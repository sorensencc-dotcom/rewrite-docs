---
title: "INTEGRATION GUIDE"
summary: "# CIC v3.0 Integration Guide"
created: "2026-07-03T19:43:46.065Z"
updated: "2026-07-03T19:43:46.065Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# CIC v3.0 Integration Guide

**Date:** 2026-06-13  
**Status:** Ready to launch

---

# Overview

You now have three integrated systems:

1. **roadmap-runner** (c:\dev\roadmap-runner\)  
   Executes roadmap phases in Docker, validates success gates, tracks state.

2. **TheFoundry** (c:\dev\TheFoundry\)  
   Compiles docs → dependency graph, validates schema, enforces consistency.

3. **Scheduler Enforcement** (scheduler.js patch)  
   Refuses to run unless docs are fresh.

Together: **Deterministic, reproducible, drift-free roadmap execution**.

---

# Architecture

```
Roadmap Markdown Files (docs/roadmap/)
    ↓
TheFoundry Pipeline
    ├─ build-docs.sh (markdown lint + compile graph)
    ├─ validate-docs.sh (schema + drift checks)
    └─ generate-manifest.js (create enforcement anchor)
    ↓
Artifacts: out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json + manifest.json
    ↓
Scheduler Enforcement (scheduler.js)
    ├─ Load manifest.json
    ├─ Verify freshness (< 1 hour old)
    └─ Refuse to run if stale
    ↓
roadmap-runner
    ├─ Load compiled graph
    ├─ Resolve dependencies
    ├─ Execute phases in Docker
    ├─ Validate success gates
    └─ Track state in state-store.json
```

---

# 6am Launch Sequence

## Step 1: Build TheFoundry (5:55am)

```bash
cd c:\dev\TheFoundry
make build
```

Expected output:
```
[build-docs] Copying roadmap markdown files...
[build-docs] Linting markdown files...
[build-docs] Compiling roadmap dependency graph...
[validate-docs] Validating roadmap schema...
[validate-docs] Validating phase configs...
[validate-docs] Running drift detection...
[generate-manifest] Manifest created:
  Version: v3.0
  Generated: 2026-06-13T05:55:00Z
  Docs: 4 files
  Graph nodes: 9
  Graph edges: 8

✓ TheFoundry build succeeded
```

Artifacts created:
- `TheFoundry/out/docs/roadmap/*.md` (copied + validated)
- `TheFoundry/out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json` (compiled)
- `TheFoundry/out/manifest.json` (enforcement anchor)

## Step 2: Add Scheduler Enforcement (6:00am)

Edit `roadmap-runner/scheduler.js`:

Add the code from `TheFoundry/SCHEDULER_ENFORCEMENT.md` to the top of `main()`.

Then restart scheduler:

```bash
cd c:\dev\roadmap-runner
make up
```

Scheduler will now:
1. Check manifest exists
2. Verify it's fresh
3. Refuse to run if stale

## Step 3: Run roadmap-runner (6:05am)

```bash
make once
```

Expected output:
```
[OK] TheFoundry manifest valid | generated 2026-06-13T05:55:00Z
[OK] Dependency graph: 9 nodes, 8 edges
[START] Roadmap Scheduler v3.0 | 2026-06-13T06:05:00Z
[GRAPH] Loaded 9 phases, 8 dependencies
[LOOP 1] Checking runnable phases...
[EXEC] Starting phase: RL-4.6
[DOCKER] RL-4.6: docker run --rm ... rewrite-labs/rl-4.6:latest npm run test:crawler
[OK] Phase RL-4.6 | exit=0 | duration=15.2s | gates=true
[LOOP 2] Checking runnable phases...
[EXEC] Starting phase: RL-4.0
...
```

---

# Workflows

## Adding a New Phase

1. **Edit roadmap** (docs/roadmap/REWRITE_LABS_SUBROADMAP_v3.0.md)
   ```markdown
   | RL-4.7 | New Phase | Pending |
   ```

2. **Build TheFoundry**
   ```bash
   cd TheFoundry && make build
   ```
   Compiler auto-detects new phase, adds to graph.

3. **Run scheduler**
   ```bash
   cd ../roadmap-runner && make once
   ```
   Scheduler uses new graph, phase is runnable when dependencies pass.

---

## Pruning a Phase

1. **Mark as pruned** (roadmap markdown)
   Remove phase row from table.

2. **Build TheFoundry**
   ```bash
   cd TheFoundry && make build
   ```
   Drift detector flags as removed, compiler excludes from graph.

3. **Update state-store.json**
   ```bash
   cd ../roadmap-runner
   make clean  # reset to pending (optional)
   ```

4. **Run scheduler**
   Scheduler ignores pruned phase, continues normally.

---

## Replaying a Phase

```bash
cd c:\dev\roadmap-runner
make replay PHASE=RL-4.1
make once  # Re-run scheduler
```

This marks RL-4.1 as pending again, allowing it to re-run.

---

# File Locations

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `c:\dev\docs\roadmap\` | Authoritative roadmap | `*.md` |
| `c:\dev\TheFoundry\` | Docs compiler | `build.sh`, `compile.js`, `validate-*.js` |
| `c:\dev\TheFoundry\out\` | Compiled artifacts | `manifest.json`, `ROADMAP_DEPENDENCY_GRAPH.json` |
| `c:\dev\roadmap-runner\` | Phase executor | `scheduler.js`, `docker-runner.js`, `state-store.json` |
| `c:\dev\roadmap-runner\phases\` | Phase configs | `RL-4.0.yaml`, `RL-4.1.yaml`, etc |

---

# Monitoring

### Check manifest freshness
```bash
cat c:\dev\TheFoundry\out\manifest.json | jq '.generated_at'
```

### Check phase state
```bash
cd c:\dev\roadmap-runner
make status
```

### Follow logs
```bash
make logs
```

---

# Troubleshooting

### Scheduler refuses to run (stale docs)
```bash
cd c:\dev\TheFoundry && make build
cd c:\dev\roadmap-runner && make once
```

### Drift detected (roadmap inconsistent)
TheFoundry will fail with error. Fix roadmap, re-run build.

### Phase stuck on pending
```bash
make status
# Check if dependencies succeeded
# If yes, validate phase.yaml syntax: make lint
```

---

# Success Criteria

After full integration test (6am-9am):

- [ ] TheFoundry builds without errors
- [ ] Manifest created with timestamp
- [ ] Scheduler enforces manifest freshness
- [ ] Scheduler resolves dependencies correctly
- [ ] RL-4.6 executes (or test container succeeds)
- [ ] RL-4.0 unblocks after RL-4.6
- [ ] State persists across scheduler restarts
- [ ] Editing roadmap → rebuild → scheduler picks up changes

---

# Next Steps (After Launch)

1. **Add CI integration** (GitHub Actions runs TheFoundry on PRs)
2. **Build real container images** (RL-4.0 through RL-4.6)
3. **Enable Prometheus metrics** (phases push to push gateway)
4. **Add Slack alerts** (failures notify channel)
5. **Build docs site** (mdBook or MkDocs from compiled markdown)

---

# References

- **roadmap-runner README:** `c:\dev\roadmap-runner\README.md`
- **roadmap-runner Startup Checklist:** `c:\dev\roadmap-runner\STARTUP_CHECKLIST.md`
- **TheFoundry README:** `c:\dev\TheFoundry\README.md`
- **Scheduler Enforcement Patch:** `c:\dev\TheFoundry\SCHEDULER_ENFORCEMENT.md`
