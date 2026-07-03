# Pre-Flight Checklist (6am Launch)

Everything is pre-coded. Follow this exact sequence tomorrow.

---

## **5:30am — Health Check (Validate Setup)**

```bash
cd c:\dev\TheFoundry
bash health-check.sh
```

Expected output:
```
✅ Docker running
✅ .env.local exists
✅ TheFoundry dependencies ok
✅ Phase configs present (9 files)
✅ scheduler.js syntax ok
✅ Roadmap graph exists (9 nodes)
✅ Manifest exists
✅ Docker container runtime ok

✅ All checks passed. Ready to launch at 6am.
```

If any check fails, fix it now. Don't proceed until all pass.

---

## **5:45am — Create Docker Stubs (Test Images)**

```bash
bash docker-stubs.sh
```

Expected output:
```
✅ Base stub image built
✅ Created stub: docker.io/rewrite-labs/rl-4.6:latest
✅ Created stub: docker.io/rewrite-labs/rl-4.0:latest
... (9 total)
```

This lets you test the scheduler without real container images.

---

## **5:55am — Build TheFoundry**

```bash
make build
```

Expected output:
```
[1/4] Building docs...
[2/4] Validating docs...
[3/4] Generating manifest...
[4/4] Build complete!

✓ TheFoundry build succeeded
```

Artifacts created:
- `out/roadmap/ROADMAP_DEPENDENCY_GRAPH.json` (compiled graph)
- `out/manifest.json` (enforcement anchor)

---

## **6:00am — Apply Scheduler Enforcement Patch**

Open `c:\dev\roadmap-runner\scheduler.js`:

Find the top of `async function main() {`

Insert the code from `TheFoundry/scheduler-enforcement-patch.js` **before any other code**.

Save the file.

---

## **6:05am — Launch roadmap-runner**

```bash
cd c:\dev\roadmap-runner
make up
sleep 10
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
[DOCKER] RL-4.6: docker run --rm ... roadmap-stub:latest npm run test
[OK] Phase RL-4.6 | exit=0 | duration=2.1s | gates=true
[LOOP 2] Checking runnable phases...
[EXEC] Starting phase: RL-4.0
...
```

---

## **6:15am — Monitor**

```bash
make logs      # Follow real-time logs
make status    # Check phase state (run every 30m)
```

---

## **Success Criteria (by 9:00am)**

- [ ] Scheduler enforces manifest freshness
- [ ] All 9 phases load from dependency graph
- [ ] RL-4.6 (or stub) executes successfully
- [ ] RL-4.0 unblocks and runs
- [ ] Dependencies resolve correctly
- [ ] State persists in state-store.json
- [ ] No crashes or errors in logs

---

## **Files Pre-Coded (Ready to Use)**

| File | Purpose | How to Use |
|------|---------|-----------|
| `scheduler-enforcement-patch.js` | Enforces fresh docs | Paste into top of `scheduler.js` main() |
| `phase-metadata.json` | Timeline injection data | Auto-loaded by plugin |
| `health-check.sh` | Validates entire setup | `bash health-check.sh` |
| `docker-stubs.sh` | Creates test images | `bash docker-stubs.sh` |
| `PRE_FLIGHT.md` | This checklist | Reference as you go |

---

## **If Something Breaks**

### Scheduler won't start
```bash
cd TheFoundry && make build
cd ../roadmap-runner && make once
```

### Phase stuck on pending
```bash
make status     # Check if dependencies succeeded
make lint       # Validate phase.yaml syntax
```

### Docker image not found
```bash
bash docker-stubs.sh  # Create stubs
# or build real images
docker build -t rewrite-labs/RL-4.0:latest ./packages/agents/
```

### Manifest stale
```bash
cd TheFoundry && make build
cd ../roadmap-runner && make once
```

---

## **Go.**

Everything is ready. Follow this checklist tomorrow at 5:30am.

🚀
