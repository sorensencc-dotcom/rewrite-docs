# Phase 27.4 Skeleton Implementation — Team Dispatch

**Status:** All 8 critical bugs fixed. Skeleton locked. Ready for team parallel execution.

**Commit hashes (fixes merged to master):**
- cic repo: e757089, 2b38626, 35dffbe
- main repo: 38668c4, b1feed1

---

## Team A — Budget Ledger DB Wiring

**Module:** `cic/budget_ledger/`

**Completed:**
- ✅ API contract (camelCase, txn_ref validation, error schema)
- ✅ POST /transactions endpoint structure
- ✅ GET /accounts/{id} endpoint structure
- ✅ Double-entry accounting model

**TODOs (Priority Order):**

1. **[HIGH] Duplicate transaction check** — `cic/budget_ledger/api/server.py:87-88`
   - Check if `txn_ref` already exists in database
   - Return 409 Conflict if duplicate (idempotency key)
   - Implementation: Query `ledger_transactions WHERE txn_ref = ?`

2. **[HIGH] Store transaction in database** — `cic/budget_ledger/api/server.py:88`
   - Insert validated transaction into `ledger_transactions` table
   - Return 201 with transaction ID
   - Schema: `id, txn_ref, from_account, to_account, amount, status, created_at, last_update_ts`

3. **[MEDIUM] Query account balance** — `cic/budget_ledger/api/server.py:112-113`
   - GET /accounts/{id}/balance endpoint
   - Query `ledger_accounts` table by account_id
   - Return 404 if account not found

4. **[MEDIUM] Queue reconciliation job** — `cic/budget_ledger/api/server.py:136`
   - POST /reconcile endpoint
   - Queue async job to `reconciliation_queue` (Redis or async task queue)
   - Return 202 Accepted with job_id

5. **[MEDIUM] Reconciliation worker** — `cic/budget_ledger/reconciliation/worker.py:11, 60, 85`
   - Connect to Postgres
   - Query transactions by date range: `SELECT * FROM ledger_transactions WHERE created_at BETWEEN ? AND ?`
   - Compute imbalance (sum(debits) - sum(credits))
   - INSERT reconciliation record: `INSERT INTO reconciliation_records (period_start, period_end, imbalance, status, created_at)`
   - Emit metric: `cic_ledger_imbalances_total`

---

## Team B — SLO Controller Prometheus Integration

**Module:** `cic/slo_controller/`

**Completed:**
- ✅ Burn rate query wiring (Prometheus client)
- ✅ Threshold-based evaluation logic
- ✅ Control signal generation (CRITICAL/WARNING/OK)

**TODOs (Priority Order):**

1. **[HIGH] Replace in-memory state store with Redis** — `cic/slo_controller/controller.py:72`
   - Use Redis for persistent SLO state tracking (survive restarts)
   - Key pattern: `slo:{slo_id}:state` → JSON with status, burn rates, last_update
   - Initialize on startup; read/write on each control loop iteration

2. **[HIGH] Call adapter-gateway /control endpoint** — `cic/slo_controller/controller.py:211`
   - Emit POST /control with signal
   - Request body: `{slo_id, action, severity, context}`
   - Retry logic: 3 retries with exponential backoff
   - Handle 4xx (validation error), 5xx (retry)

3. **[MEDIUM] Call budget-ledger /transactions** — `cic/slo_controller/controller.py:212`
   - On CRITICAL cost accuracy signal (SLO-004): POST /transactions
   - Transaction: from=`system`, to=`reserve`, amount=calculated_penalty
   - Only emit if violation threshold exceeded

4. **[MEDIUM] Emit Prometheus metrics** — `cic/slo_controller/controller.py:213`
   - Export SLO state as Prometheus metrics
   - Metrics: `slo_status` (1=OK, 2=WARNING, 3=CRITICAL), `slo_burn_rate_fast`, `slo_burn_rate_slow`
   - Labels: `slo_id, slo_name`

5. **[LOW] Trigger PagerDuty alerts** — `cic/slo_controller/controller.py:216`
   - On CRITICAL signal, POST to PagerDuty integration key
   - Event body: `{routing_key, event_action: trigger, dedup_key: slo_id, payload: {severity, description, custom_details}}`
   - Dedup on SLO ID (prevent duplicate alerts for same SLO)

6. **[LOW] Implement metrics export endpoint** — `cic/slo_controller/controller.py:229-230`
   - GET /metrics endpoint returns Prometheus-formatted metrics
   - Include all SLO state metrics + control loop performance metrics
   - Format: `# HELP` + `# TYPE` + metric lines

---

## Team C — Adapter Gateway / Fallback Chain Integration

**Module:** `cic/adapters/gateway/`

**Completed:**
- ✅ Circuit breaker state machine (CLOSED/OPEN/HALF_OPEN)
- ✅ p95 latency tracking + threshold detection
- ✅ Error rate threshold evaluation
- ✅ Fallback chain framework (sync handlers)

**TODOs (Priority Order):**

1. **[HIGH] Wire primary_handler to adapter API** — `cic/adapters/gateway/fallbacks.py:59`
   - Fetch from primary adapter endpoint (HTTP call)
   - Format: GET /adapters/{adapter_id}/execute with request params
   - Parse response, validate against schema
   - Return result or None on failure
   - Note: Must be synchronous (no async/await)

2. **[HIGH] Wire secondary_handler to Redis cache** — `cic/adapters/gateway/fallbacks.py:64`
   - Query Redis for last successful response: `GET adapter:{adapter_id}:last_response`
   - Return parsed JSON or None if not cached
   - Check cache freshness (max age configurable, default 5min)

3. **[MEDIUM] LaunchDarkly feature flag integration** — No skeleton yet
   - Gate canary rollout stages via LaunchDarkly
   - Flag: `phase-27-4-canary-stage` with variant (5%, 25%, 100%)
   - Circuit breaker rejects traffic if flag disabled
   - Check flag on every is_available() call

4. **[MEDIUM] Cache primary response on success** — Not in skeleton
   - After primary_handler returns success, store in Redis
   - Key: `adapter:{adapter_id}:last_response`
   - Value: JSON-serialized response
   - TTL: 5 minutes (configurable)

---

## Team D — Fire Drill Scenarios

**Module:** `cic/fire_drills/scenarios/`

**Completed:**
- ✅ FD-01 latency spike skeleton structure
- ✅ Evaluation phases (inject → observe → verify → cleanup)
- ✅ Metrics query framework

**TODOs (Priority Order):**

1. **[HIGH] FD-01: Inject synthetic latency** — `cic/fire_drills/scenarios/fd_01_latency_spike.py:57`
   - Use toxiproxy or similar to add 2000ms latency to primary adapter
   - Target: cic-adapter-gateway port 3100
   - Duration: 5 minutes
   - Verify injection: query latency metrics, confirm p95 > 2000ms

2. **[HIGH] FD-01: Query control signal emission** — `cic/fire_drills/scenarios/fd_01_latency_spike.py:107`
   - During inject phase, poll for SLO controller signal
   - Query: `GET /slo-controller/state` for SLO-002 status = CRITICAL
   - Verify action = DEGRADE or THROTTLE
   - Timeout: 30 seconds

3. **[HIGH] FD-01: Cleanup & stabilization** — `cic/fire_drills/scenarios/fd_01_latency_spike.py:115-117`
   - Remove toxiproxy latency injection
   - Wait 2 minutes for metrics to stabilize
   - Query p95 latency, verify < 500ms before test complete

4. **[MEDIUM] FD-02 through FD-20** — Create scenarios for:
   - FD-02: Error rate spike (500 responses)
   - FD-03: Adapter unavailability (504 gateway timeout)
   - FD-04: Cost accuracy drift (imbalance injection)
   - FD-05: Pipeline staleness (stop updates)
   - FD-06–20: Additional degradation scenarios (half-open recovery, canary stage progression, fallback chain activation, etc.)

5. **[MEDIUM] Assertion framework** — Standardize all FD scenarios
   - Assert control signal emitted within 60 seconds
   - Assert recommended action matches severity
   - Assert fallback chain triggered on primary failure
   - Assert metrics reflect system state

---

## Dependency Graph

```
Team A (Budget Ledger) → Team B (SLO Controller)
                           ↓
Team C (Adapter Gateway) ← Team B
                           ↓
Team D (Fire Drills) ← All (Teams A, B, C)
```

**Critical Path:**
1. Teams A, B, C can work in parallel on infrastructure
2. Team D (fire drills) depends on all three being testable
3. Canary rollout script ready; gates automatically validate all teams' work

---

## Testing & Integration

**Unit tests:** Each team runs `npm test` in their module
- Team A: `cic/budget_ledger/` tests
- Team B: `cic/slo_controller/` tests
- Team C: `cic/adapters/gateway/` tests
- Team D: `cic/fire_drills/` tests

**Integration testing:** After all teams complete TODOs
- Docker: `docker-compose up --build`
- Run fire-drill suite: `npm run fire-drills`
- Canary rollout simulation: `bash deploy/scripts/canary_rollout_274.sh`

**Success Criteria:**
- ≥98% unit test pass rate per team
- All fire-drill scenarios pass (FD-01 through FD-20)
- Canary rollout gates pass: error_rate <1%, latency <600ms, drift <0.1%

---

## Questions / Blockers?

Post in #phase-27-4 Slack channel. Will triage dependencies.

Dispatch: 2026-06-21 15:00 UTC
Target completion: 2026-06-22 18:00 UTC (36 hours)
