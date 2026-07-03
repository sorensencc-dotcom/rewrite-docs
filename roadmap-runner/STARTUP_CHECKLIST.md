# Roadmap Runner Startup Checklist (6am Launch)

Complete this checklist to spin up automated roadmap execution at 6am.

---

## M0 — Pre-Flight (Tonight, before 6am)

- [ ] **Verify Docker is running** on host machine
- [ ] **Test docker-compose** — `docker-compose version`
- [ ] **Copy .env.local template**
  ```bash
  cd roadmap-runner
  cp .env.local.example .env.local
  ```
- [ ] **Fill in credentials** in `.env.local`:
  - [ ] `REGISTRY` (Docker Hub or ECR URL)
  - [ ] `CLOUDFLARE_ACCOUNT_ID` (if RL-4.2 can run)
  - [ ] `CLOUDFLARE_API_TOKEN` (if RL-4.2 can run)
  - [ ] `OUTREACH_API_KEY` (if RL-4.5 can run)
  - [ ] `QDRANT_URL` (leave as `http://qdrant:6333` if local)

---

## M1 — First Run (6am, at the clock)

```bash
# 1. Navigate to roadmap-runner
cd roadmap-runner

# 2. Start services (builds Docker image, starts Qdrant + Prometheus)
make up

# 3. Verify services are healthy
sleep 10
make status

# 4. Run scheduler once (should check dependencies, print runnable phases)
make once

# 5. If successful, start continuous loop
make loop &
```

**Expected output (first run):**
```
[START] Roadmap Scheduler v3.0 | 2026-06-13T06:00:00Z
[GRAPH] Loaded 9 phases, 8 dependencies
[LOOP 1] Checking runnable phases...
[EXEC] Starting phase: RL-4.6
[DOCKER] RL-4.6: docker run --rm -e NODE_ENV=production ... rewrite-labs/rl-4.6:latest npm run test:crawler
...
[OK] Phase RL-4.6 | exit=0 | duration=15.2s | gates=true
[LOOP 2] Checking runnable phases...
[EXEC] Starting phase: RL-4.0
...
```

---

## M2 — Monitor & Debug (6am - 9am)

### Real-time logs
```bash
make logs
```

### Check phase status
```bash
make status
```

### If a phase fails
```bash
# View state-store.json
cat state-store.json | jq '.phases.["RL-4.0"]'

# Reset to pending and retry
make clean
make phase-RL-4.0
```

### If Docker image not found
```bash
# Check REGISTRY in .env.local
# Ensure image exists: docker pull REGISTRY/rewrite-labs/RL-4.0:latest

# Or create stub images for testing
docker tag node:20 docker.io/rewrite-labs/rl-4.6:latest
docker tag node:20 docker.io/rewrite-labs/rl-4.0:latest
# ... repeat for all phases
```

---

## M3 — Validate (9am - 12pm)

- [ ] **RL-4.6 succeeded** — crawler tests pass
- [ ] **RL-4.0 succeeded** — extraction + style match pass
- [ ] **Phases blocked correctly** — if RL-4.0 fails, RL-4.1 marked as blocked
- [ ] **State persists** — restart scheduler, should resume from where it left off
- [ ] **Metrics exported** — check Prometheus at `http://localhost:9090`

---

## M4 — Cleanup & Docs (12pm onwards)

- [ ] **Document learnings** — what worked, what didn't
- [ ] **Update phase configs** — add real success gates, metrics
- [ ] **Build real container images** — replace stub images
- [ ] **Enable Slack alerts** — (optional) add webhook to .env.local
- [ ] **Scale to parallel** — (future) update scheduler for concurrent phases

---

## Reference Commands

### Lifecycle
```bash
make setup              # Copy .env.local template
make build              # Build scheduler image
make up                 # Start all services (detached)
make down               # Stop all services
make once               # Run scheduler once (attached)
make loop               # Run scheduler continuously
```

### Debug
```bash
make logs               # Follow scheduler logs
make status             # Show phase state
make clean              # Reset state to pending
make phase-RL-4.6       # Run single phase
```

### Maintenance
```bash
docker-compose ps       # List running services
docker-compose logs -f  # Stream all logs
docker volume ls        # List persistent volumes
```

---

## Locked Defaults (Baked In)

✅ **Sequential execution** — one phase at a time  
✅ **Dependency resolution** — all dependencies must succeed  
✅ **1 retry with 60s backoff** — on failure, retry once then mark failed  
✅ **Success gates** — exit code, metrics, output pattern matching  
✅ **State persistence** — `state-store.json` survives restarts  
✅ **Docker-in-Docker** — scheduler can spawn child containers  
✅ **No parallel execution yet** — validate sequential first  
✅ **No external secrets manager** — use `.env.local` file  
✅ **Prometheus metrics** — push gateway available (phases opt-in)  
✅ **Slack alerts** — stubbed, not required  

---

## What Phase Containers Must Emit

For success gates to work, phase containers should:

1. **Exit code 0 on success, 1 on failure**
2. **JSON lines to stdout** (for metric extraction):
   ```json
   {"metric":"tokens_extracted","value":10}
   {"metric":"style_match_confidence_avg","value":0.82}
   ```
3. **Log output matching patterns** (for regex gates)

Example (Node.js phase):
```javascript
console.log(JSON.stringify({metric: "style_match_confidence_avg", value: 0.82}));
process.exit(result.success ? 0 : 1);
```

---

## Troubleshooting

### "docker: command not found"
Install Docker Desktop (Windows/Mac) or Docker Engine (Linux).

### "Cannot connect to Docker daemon"
Start Docker Desktop or `systemctl start docker`.

### "docker pull fails"
Check `REGISTRY` in `.env.local`. Image must exist at that registry.

### "Phase stuck on pending"
```bash
make status  # Check if dependencies succeeded
make lint    # Validate phase.yaml syntax
```

### "State corrupted or broken"
```bash
make clean  # Reset to all pending, or
rm state-store.json  # Let it regenerate
```

---

## Success Criteria

After 3 hours (6am - 9am), you should have:

- [ ] All services running (`make up` succeeds)
- [ ] First phase executed (RL-4.6 or PHASE-0.9)
- [ ] State tracked in `state-store.json`
- [ ] Logs visible in real-time (`make logs`)
- [ ] Second phase unblocked and ready (RL-4.0)

---

## Next Steps (After M1-M3)

1. **Build real container images** for RL-4.0–RL-4.6
2. **Wire up Prometheus** (phases push metrics to push gateway)
3. **Add Slack webhook** (on failure, notify channel)
4. **Enable parallel execution** (after sequential validation)
5. **Integrate with CIC observability** (ingest logs, emit alerts)

---

## Files Deployed

```
c:\dev\roadmap-runner\
  ✅ scheduler.js                 (main orchestrator)
  ✅ docker-runner.js             (docker executor)
  ✅ success-gate-validator.js    (gate validation)
  ✅ state-store.json             (seed state)
  ✅ .env.local.example           (template)
  ✅ .gitignore                   (git ignore)
  ✅ package.json                 (node metadata)
  ✅ Dockerfile                   (scheduler image)
  ✅ docker-compose.yml           (services)
  ✅ Makefile                     (commands)
  ✅ prometheus.yml               (metrics config)
  ✅ README.md                    (full docs)
  ✅ STARTUP_CHECKLIST.md         (this file)
  
  ✅ phases/
    ✅ RL-4.6.yaml                (CrawlerEngine)
    ✅ RL-4.0.yaml                (Extraction)
    ✅ RL-4.1.yaml                (RedesignAgent)
    ✅ RL-4.2.yaml                (SiteBundle)
    ✅ RL-4.3.yaml                (ChatEditSession)
    ✅ RL-4.4.yaml                (SaaSPricingGate)
    ✅ RL-4.5.yaml                (OutreachAgent)
    ✅ PHASE-0.9.yaml             (TheFoundry)
    ✅ PHASE-26.yaml              (TorqueQuery)

c:\dev\docs\roadmap\
  ✅ ROADMAP_DEPENDENCY_GRAPH.json (compiled graph)
```

---

## Go.

Time to automate the roadmap.

```bash
cd c:\dev\roadmap-runner
make setup
make up
make once
```

🚀
