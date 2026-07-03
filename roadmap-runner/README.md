# Roadmap Runner v3.0

Automated execution engine for CIC + Rewrite Labs phases via Docker.

Compiles the roadmap dependency graph, determines runnable phases, executes them in Docker containers, validates success gates, and tracks state.

---

## Quick Start

```bash
# 1. Setup environment
make setup
# Edit .env.local with your credentials

# 2. Build and start services
make up

# 3. Run scheduler once
make once

# 4. Or loop continuously
make loop

# 5. Monitor
make logs
make status
```

---

## What It Does

1. **Loads** `ROADMAP_DEPENDENCY_GRAPH.json` (compiled roadmap)
2. **Checks** `state-store.json` for phase history
3. **Finds** all runnable phases (dependencies satisfied, not yet complete)
4. **Executes** each phase in Docker (pulls image, runs container, captures logs)
5. **Validates** success gates (exit code, metrics, output patterns)
6. **Updates** state and marks dependents as blocked/runnable
7. **Emits** metrics to Prometheus Push Gateway (optional)

---

## Directory Structure

```
roadmap-runner/
  scheduler.js              # Main orchestrator
  docker-runner.js          # Docker executor
  success-gate-validator.js # Gate validation
  state-store.json          # Execution state (generated)
  .env.local                # Credentials (create from .example)
  .env.local.example        # Template
  package.json              # Node.js metadata
  Dockerfile                # Multi-stage build
  docker-compose.yml        # Services (scheduler + Qdrant + Prometheus)
  Makefile                  # Convenience commands
  
  phases/                   # Phase configurations
    RL-4.6.yaml             # CrawlerEngine v1
    RL-4.0.yaml             # Extraction Engine
    RL-4.1.yaml             # RedesignAgent + Variants
    RL-4.2.yaml             # SiteBundle + Delivery
    RL-4.3.yaml             # ChatEditSession + DOMPatch
    RL-4.4.yaml             # SaaSPricingGate
    RL-4.5.yaml             # OutreachAgent
    PHASE-0.9.yaml          # TheFoundry (CIC infrastructure)
    PHASE-26.yaml           # TorqueQuery (shared)
```

---

## Phase Configuration (phase.yaml)

Each phase defines:

```yaml
id: RL-4.0
title: Extraction Engine v1
container: docker.io/rewrite-labs/rl-4.0:latest
command:
  - npm
  - run
  - test:extraction

env:
  NODE_ENV: production
  LOG_LEVEL: info

dependencies:
  - RL-4.6

success_gates:
  - type: exit_code
    value: 0
  - type: metric
    key: style_match_confidence_avg
    op: ">="
    value: 0.75
  - type: output
    pattern: "✓.*StyleMatch.*confidence"
```

### Success Gate Types

| Type | Usage | Example |
|------|-------|---------|
| `exit_code` | Container exit code | `value: 0` |
| `metric` | Extracted JSON metrics | `key: tokens_extracted, op: ">=", value: 10` |
| `output` | Regex on stdout | `pattern: "✓.*success"` |

---

## Execution Flow

### State Lifecycle

```
pending → runnable → running → succeeded (or failed → blocked for dependents)
```

### Dependency Resolution

```
RL-4.6 CrawlerEngine (root)
  ↓
RL-4.0 Extraction Engine
  ↓
RL-4.1 RedesignAgent
  ↓
RL-4.2 SiteBundle
  ├→ RL-4.3 ChatEditSession
  └→ RL-4.4 SaaSPricingGate
    ↓
RL-4.5 OutreachAgent
```

---

## CLI Commands

### Run once (no loop)
```bash
node scheduler.js --once
```

### Run continuously (every 60s)
```bash
node scheduler.js --loop --interval 60
```

### Run single phase
```bash
node scheduler.js --phase RL-4.0
```

### Via Makefile
```bash
make once           # Run once
make loop           # Run continuously
make phase-RL-4.0   # Run single phase
```

---

## Environment Variables

Loaded from `.env.local` (created by `make setup`):

| Variable | Purpose | Example |
|----------|---------|---------|
| `REGISTRY` | Docker registry | `docker.io` or ECR URL |
| `CLOUDFLARE_ACCOUNT_ID` | RL-4.2 delivery | `abc123def456` |
| `CLOUDFLARE_API_TOKEN` | RL-4.2 delivery | `Bearer token...` |
| `OUTREACH_API_KEY` | RL-4.5 outreach | `key_xxx` |
| `QDRANT_URL` | Vector DB (Phase 26) | `http://qdrant:6333` |
| `LOG_LEVEL` | Scheduler verbosity | `info`, `debug`, `warn` |

---

## Outputs

### state-store.json
Tracks phase execution history:

```json
{
  "version": "v3.0",
  "phases": {
    "RL-4.0": {
      "status": "succeeded",
      "lastRunAt": "2026-06-13T14:30:00Z",
      "runs": [
        {
          "startedAt": "2026-06-13T14:30:00Z",
          "finishedAt": "2026-06-13T14:32:15Z",
          "exitCode": 0,
          "success": true,
          "duration": 135.2,
          "metrics": {
            "dom_parse_success_rate": 0.95,
            "style_match_confidence_avg": 0.82
          }
        }
      ]
    }
  }
}
```

### Logs
Streamed to stdout in real-time + stored in Docker logs.

### Metrics
Pushed to Prometheus Push Gateway (for integration with observability dashboard).

---

## Services (docker-compose.yml)

| Service | Port | Purpose |
|---------|------|---------|
| `roadmap-runner` | — | Scheduler (main) |
| `qdrant` | 6333 | Vector DB (Phase 26 TorqueQuery) |
| `prometheus` | 9090 | Metrics collection |
| `prometheus-pushgateway` | 9091 | Phase metrics push |

---

## Failure Handling

**Retry Logic:** 1 retry with 60s backoff (locked defaults).

**Blocked Phases:** If a phase fails, all dependents are marked as `blocked` until you manually reset or rerun the phase.

**Reset State:**
```bash
make clean  # Resets state-store.json to all pending
```

---

## Integration with CIC Observability

Scheduler emits JSON lines to stdout:

```json
{"phase_id":"RL-4.0","status":"succeeded","exit_code":0,"duration":135.2,"gates_passed":4}
```

CIC's observability layer can:
1. Ingest these logs from Docker logs API
2. Parse metrics and push to Prometheus
3. Alert on failures via Slack webhook (optional)

---

## Roadmap Dependency Graph

Expects `docs/roadmap/ROADMAP_DEPENDENCY_GRAPH.json` to be compiled from:
- `CIC_SUBROADMAP_v3.0.md`
- `REWRITE_LABS_SUBROADMAP_v3.0.md`
- `MASTER_ROADMAP_v3.0.md`

Graph format:

```json
{
  "nodes": [
    {"id":"RL-4.6","title":"CrawlerEngine v1"},
    {"id":"RL-4.0","title":"Extraction Engine"}
  ],
  "edges": [
    {"from":"RL-4.6","to":"RL-4.0"}
  ]
}
```

---

## Development

### Run tests
```bash
npm test
```

### Lint phase configs
```bash
make lint
```

### Debug single phase
```bash
make phase-RL-4.6
```

---

## Production Readiness

- [x] Sequential execution (one phase at a time)
- [x] Dependency resolution
- [x] Success gate validation
- [x] State persistence across restarts
- [x] Docker-in-Docker support (can spawn child containers)
- [ ] Metrics export to Prometheus (stubbed, requires phase containers to emit JSON lines)
- [ ] Slack alerts on failure (optional, requires webhook URL)
- [ ] Parallel phase execution (future, after validation)
- [ ] Auto-retry with exponential backoff (future, currently 1x retry @ 60s)

---

## Deployment

### Local
```bash
make up   # Starts scheduler + Qdrant + Prometheus
```

### Kubernetes
```bash
# Generate manifests (future)
make k8s-manifests
```

---

## Troubleshooting

**Docker pull fails:**
```bash
# Check REGISTRY in .env.local
# Ensure images exist at that registry
```

**Phase stuck on pending:**
```bash
make status  # Check if dependencies succeeded
# If yes, check phase config for syntax errors
make lint
```

**State corrupted:**
```bash
make clean   # Reset to all pending
```

---

## References

- **Roadmap:** `docs/roadmap/ROADMAP_INDEX.md`
- **Phase specs:** `docs/roadmap/MASTER_ROADMAP_v3.0.md`
- **CIC roadmap:** `docs/roadmap/CIC_SUBROADMAP_v3.0.md`
- **RL roadmap:** `docs/roadmap/REWRITE_LABS_SUBROADMAP_v3.0.md`
- **Dependency graph:** `docs/roadmap/ROADMAP_DEPENDENCY_GRAPH.json` (auto-generated)

---

## Next Steps (after M1 success)

1. **Build phase container images** (RL-4.6, RL-4.0, etc.)
2. **Compile `ROADMAP_DEPENDENCY_GRAPH.json`** from roadmaps
3. **Test gates** with real phase outputs
4. **Enable Prometheus push** from phase containers
5. **Wire Slack alerts** (optional)
6. **Scale to parallel execution** (after sequential validation)

---

## License

MIT — CIC Platform Team
