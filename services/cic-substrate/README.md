# CIC Substrate Service

This is the Postgres-backed HTTP service for chunk storage and hybrid retrieval, built exactly to the blueprint.

## Features
- Complete Postgres Schema with `pgvector` for vector embeddings and `tsvector` for BM25.
- Governance Module enforcing type validation, namespaces, TTL, importance clamping, and size limits.
- Ingestion Pipeline implementing capture, normalize, classify, enrich, and persist stages.
- Hybrid Retrieval using BM25 (`ts_rank_cd`), vector cosine similarity, and Reciprocal Rank Fusion (RRF).
- Context endpoint `get_context_for_task` to query and greedy-pack chunks based on a token budget and type preferences.
- **Agentic Intelligence Layer** — rule engine, metrics, drift detection, and skill extraction for workflow quality analysis.

## Agentic Intelligence Layer

The intelligence layer provides deterministic, side-effect-free analysis of Claude usage patterns, workflow quality, and runtime drift.

### Rule Engine Lifecycle

1. **Load Context** — Fetch requests, contexts, and reviews for a user/workspace/window from the database via `context/loader`.
2. **Evaluate Rules** — `RuleEngine` runs all rules in `ruleRegistry` against the `RuleContext`. Rules are deterministic functions with no side effects.
3. **Generate Findings** — Each rule outputs `RuleFinding[]` with deterministic IDs (SHA-256 hash of rule + severity + message).
4. **Compute Metrics** — After all rules fire, compute aggregated metrics (promptDiscipline, contextHealth, reviewRigor, skillReuse, driftIndex, readinessIndex).
5. **Materialize Results** — Persist metrics to `agentic_metrics` table for fast MCP retrieval; findings optionally persisted to `rule_findings` if audit trail required.

### Metric Formulas

| Metric | Formula | Range | Notes |
|--------|---------|-------|-------|
| **promptDiscipline** | `1 - (0.4 * unreviewedLarge / largeOutputs) - (0.3 * errorRate)` | [0,1] | Penalizes unreviewed large outputs and request errors. |
| **contextHealth** | `(avgCoverage + avgFreshness) / 2` | [0,1] | Average of coverage and freshness scores from loaded contexts. |
| **reviewRigor** | `0.6 * reviewRate + 0.2 * norm(avgDiff, 0, 200) + 0.2 * norm(avgComments, 0, 20)` | [0,1] | Weighted review activity: rate, diff size, comment density. |
| **skillReuse** | `1 - (uniquePrompts / totalRequests)` | [0,1] | Higher when prompt hashes repeat (indicates reuse). |
| **driftIndex** | `0.5 * violationRate + 0.3 * errorRate + 0.2 * (1 - contextHealth)` | [0,1] | Composite drift signal: rule violations + errors + context decay. |
| **readinessIndex** | `(promptDiscipline + contextHealth + reviewRigor + skillReuse) / 4` | [0,1] | Unweighted average of all four quality signals. |

All metrics are clamped to `[0,1]`.

### Drift Logic

**Drift** measures workflow decay — when requests deviate from established patterns or violate quality rules.

**Computation:**

- **Violation Rate** — count of findings with severity ≥ 'high' divided by total requests.
- **Error Rate** — count of requests with status ≠ 'ok' divided by total requests.
- **Context Health** — computed metric (see above).

**Contributors to drift:** Each rule finding is tagged with a category (e.g., "output-size", "review-coverage", "context-freshness"). Contributors are weighted by severity and frequency to explain drift.

**Noise suppression:** Only findings with severity ≥ 'medium' contribute to drift. Single-request anomalies < 2% of window are de-weighted.

### Materialization Cadence

Metrics are computed and persisted on a rolling-window schedule:

| Window | Frequency | Use Case |
|--------|-----------|----------|
| **24h** | Every 1 minute | Real-time dashboard, Coach coaching decisions. |
| **7d** | Every 5 minutes | Trend detection, weekly summaries. |
| **30d** | Every 30 minutes | Long-term pattern analysis, monthly reports. |

Cadence is controlled by external job scheduler (e.g., Kubernetes CronJob, systemd timer, or cloud function). Each run calls `materializeMetricsForUserWorkspace(userId, workspace)` which:

1. Loads context for all three windows.
2. Runs rule engine and computes metrics.
3. Upserts results into `agentic_metrics` table.

### Skill Extraction (Substrate Side)

**Substrate-side** skill extraction detects repeated workflow patterns before the Coach sees them.

**Signals:**

- **Prompt Hash Repetition** — count frequency of each `promptHash`. High frequency indicates a stable, reusable skill.
- **Workflow Stability Score** — measure variance in context coverage and freshness across requests with the same promptHash. Low variance = stable workflow.
- **Session Clustering** — group requests by session; requests in the same session with repeated promptHash suggest a coherent skill/pattern.

**Integration with materialization:**

- `skillReuse` metric tracks global repetition.
- Per-rule skill detection can tag findings with `skill: { promptHash, stability, confidence }`.
- Results flow into Coach via MCP endpoint `/agentic/skill-detections`.

### MCP Endpoints

- `GET /agentic/readiness` — Return current readinessIndex and all sub-metrics.
- `GET /agentic/drift` — Return driftIndex and contributor array with explanations.
- `GET /agentic/rule-findings?userId=...&workspace=...&severity=...` — List all findings for a window.
- `GET /agentic/skill-detections?userId=...&workspace=...` — List detected skill patterns.

### Rule Registry

Rules are deterministic functions that take a `RuleContext` and return `RuleFinding[]`. Rules must:

- Never call external services.
- Never modify state (read-only).
- Never use randomness.
- Return findings with stable, reproducible IDs.

Add new rules to `src/agentic/rules/registry.ts`.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Database:**
   Ensure you have a Postgres database with the `pgvector` extension installed.
   Set the connection string in your `.env` file (or let it default to `postgresql://postgres:postgres@localhost:5432/postgres`):
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   PORT=3000
   ```

3. **Apply Migrations:**
   Run the `schema.sql` script against your database to set up the necessary tables, types, indexes, and triggers.

   ```bash
   psql -d dbname -f schema.sql
   ```

## Running the Service

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

## API Endpoints

- `POST /chunks` → Store a new chunk
- `PUT /chunks/:id` → Update an existing chunk
- `DELETE /chunks/:id` → Soft-delete a chunk
- `GET /chunks/:id` → Get a chunk by ID
- `POST /chunks/list` → List chunks optionally filtered by namespace
- `POST /search/hybrid` → Hybrid BM25 + Vector search
- `POST /context/task` → Get context tailored for a task (hybrid search + RRF + greedy packing)
- `GET /stats` → Get usage statistics
