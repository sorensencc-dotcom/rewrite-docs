---
name: roadmap-risk-register-phases-23-27
description: Risk register and mitigation planning for phases 23-27
metadata:
  type: roadmap
---

# Risk Register: Phases 23–27 Autonomy Stack

**Owner:** Autonomy Stack Lead  
**Updated:** 2026-07-05  
**Review Cadence:** Weekly standup + critical path daily

---

## Phase 23: Memory Layer

### Risk 1: Replication Lag > TTL Window

**Severity:** CRITICAL | **Likelihood:** MEDIUM

**Description:**  
Memory packets replicated asynchronously. If lag > 30s and Phase 24 queries replica before write propagates, governance decisions made on stale/missing memory.

**Failure Scenario:**  
- Phase 23.4 writes memory packet (cost estimate $5.00, confidence 0.92)
- Replication queued (lag 45s)
- Phase 24 proposal submitted for skill execution
- Proposal queries memory → misses recent packet
- Council votes on incomplete evidence
- Decision made with obsolete cost data

**Impact:**  
- Governance decisions based on incomplete evidence
- Policy violations possible (cost overruns, risk under-estimated)
- Audit trail broken, compliance issue

**Mitigation:**

1. **Write-through cache** (Week 1): Phase 23 writes to in-memory cache + async PostgreSQL. Phase 24 queries cache first.
   - Verification: 100 memory packets cached, p99 latency <10ms
   
2. **Replication health check** (Week 1): Monitor lag via `SELECT pg_last_xact_replay_timestamp()`. Alert if lag > 5s.
   - Verification: Alert fires within 10s of lag spike

3. **Read-your-own-writes guarantee** (Week 1): Phase 23 returns packet ID + explicit "ready for query" flag only after replication ack.
   - Verification: Phase 24 never sees "ready_for_query=false"

4. **Fallback to leader** (Week 2): If replica lag detected, Phase 24 queries primary directly (higher latency, guaranteed fresh).
   - Verification: Query succeeds even with replica down

**Owner:** Backend Lead  
**Deadline:** EOD Week 1  
**Status:** OPEN

---

### Risk 2: Memory Packet Data Loss on Crash

**Severity:** CRITICAL | **Likelihood:** LOW

**Description:**  
In-memory cache lost on process restart. Phase 23 writes queued but not yet replicated to PostgreSQL.

**Failure Scenario:**  
- Phase 23 writes 1000 memory packets to cache, queues async replication
- Server crash (unplanned restart)
- Replication queue lost; packets never reach PostgreSQL
- Downstream phases (24–27) discover missing evidence post-mortem
- Governance decisions cannot be audited

**Impact:**  
- Data loss; audit trail incomplete
- Compliance violation (missing decision evidence)
- Inability to replay counterfactual scenarios

**Mitigation:**

1. **Durable write queue** (Week 1): Before ack to Phase 23 client, write to local RocksDB or write-ahead log.
   - Verification: Recover 100 packets after simulated crash

2. **Fsync on critical writes** (Week 1): Governance proposals + council votes sync to disk before returning success.
   - Verification: Zero data loss on kill -9

3. **Recovery mechanism** (Week 2): On startup, replay write-ahead log to PostgreSQL before accepting new writes.
   - Verification: Recover from 1-hour worth of packets

**Owner:** Backend Lead  
**Deadline:** EOD Week 1  
**Status:** OPEN

---

### Risk 3: MemoryPacket Schema Incompatibility

**Severity:** HIGH | **Likelihood:** MEDIUM

**Description:**  
Phase 23 spec locked, but downstream phases (24–27) may require fields not anticipated. Adds incompatible fields → query failures.

**Failure Scenario:**  
- Phase 23 spec locked (MemoryPacket v1.0)
- Phase 27 implemented; requires "execution_context" field missing from schema
- Phase 27 code tries to deserialize → null pointer exception
- Counterfactual reasoning crashes
- Build delayed 1 week for schema migration

**Impact:**  
- Phase 27 blocked until schema updated + migration run
- Critical path slip (Week 3 → Week 4)

**Mitigation:**

1. **Schema review (all phases)** (Fri Week 1): Present MemoryPacket draft to 24/25/26/27 leads. Collect required fields.
   - Verification: Signed-off MemoryPacket v1.0 by all phase leads

2. **Versioning from day 1** (Week 1): MemoryPacket includes `schema_version` field. Support v1.0 + v1.1 in reads.
   - Verification: Can read packets from future minor versions

3. **Extension field** (Week 1): Add `custom_fields: object` to MemoryPacket for unanticipated phase needs.
   - Verification: Phase 27 uses custom_fields for execution_context

**Owner:** Autonomy Lead  
**Deadline:** EOD Week 1  
**Status:** OPEN

---

## Phase 24: Governance

### Risk 4: Council Deadlock (Supermajority Votes Never Resolve)

**Severity:** CRITICAL | **Likelihood:** LOW

**Description:**  
Supermajority voting threshold (3/5 council members) but members unavailable or voting "abstain". Proposal waits indefinitely; skill execution blocked.

**Failure Scenario:**  
- Phase 25 submits proposal for high-risk skill execution
- 5 council members; voting threshold = supermajority (3 approvals needed)
- Member A: offline
- Member B: defers (time zone, no contact)
- Member C: approves
- Members D, E: abstain (uncertain)
- Proposal never reaches 3 approvals
- Skill execution blocked forever
- Service degradation (latency spike, failing requests)

**Impact:**  
- Production incident; skill unavailable
- SLO miss (skill availability <99.9%)
- Manual intervention required

**Mitigation:**

1. **Majority + automatic escalation** (Fri Week 2): Change threshold to majority (3/5) for routine decisions. Escalate supermajority to governance admin if deadline missed.
   - Verification: Define routine (cost <$10, risk=low) vs high-risk

2. **Voting deadline** (Wed Week 2): All proposals have 1-hour timeout. Unseen votes → automatic abstain.
   - Verification: Proposal status = "expired" after 1h, not "pending"

3. **Default decision** (Thu Week 2): If timeout, defer to established policy. If policy unclear, block (safe default).
   - Verification: Test with 5s timeout; proposal auto-decides within 6s

4. **Council availability SLO** (Fri Week 2): Require ≥4/5 online before accepting proposals. Monitor on-call roster.
   - Verification: Alert if < 4 members available

**Owner:** Governance Lead  
**Deadline:** EOD Week 2  
**Status:** OPEN

---

### Risk 5: Evidence Packet Missing Memory Link

**Severity:** HIGH | **Likelihood:** MEDIUM

**Description:**  
Evidence packet references memory packet ID that was purged (TTL expired before evidence created). Audit trail broken.

**Failure Scenario:**  
- Phase 23 writes memory packet (expires in 30 days)
- Phase 24 proposal submitted 25 days later
- Evidence packet created, links to memory packet ID
- 5 days later: Memory packet auto-purged (TTL expired)
- Governance audit: "Why was this decision approved?" → Reference memory gone
- Non-compliance with audit requirements

**Impact:**  
- Audit trail incomplete
- Regulatory non-compliance
- Cannot explain historical decisions

**Mitigation:**

1. **Extended TTL for governance** (Wed Week 2): If memory packet is referenced in evidence, extend TTL to match decision deadline + 90 days.
   - Verification: Memory packet TTL updated when evidence created

2. **Evidence immutability** (Wed Week 2): Copy full memory content into evidence packet (snapshot). Don't rely on reference.
   - Verification: Evidence packet size <1MB even with snapshot

3. **Orphan detection** (Thu Week 2): Periodic job (weekly) scans evidence packets for missing memory references. Alert if found.
   - Verification: Detect orphaned reference within 1 week

**Owner:** Governance Lead  
**Deadline:** EOD Week 2  
**Status:** OPEN

---

## Phase 25: Skills

### Risk 6: Policy Rail Blocks Legitimate Skill

**Severity:** HIGH | **Likelihood:** HIGH

**Description:**  
Policy rail too broad; blocks skill execution even when safe. False positive gate causes skill unavailable.

**Failure Scenario:**  
- Policy rail: "Block all web-scraping skills" (intended: block untrusted scrapers)
- Phase 25 executes trusted skill `web-scraper-v2` (approved, tested)
- Policy gate evaluates condition: `skill_ids == ["*"]` (oops, matches all)
- Skill blocked incorrectly
- Phase 25 logs error: "Policy violation: web-scraper-v2 blocked"
- User-facing latency spike

**Impact:**  
- False positive blocking legitimate operations
- User-facing service degradation
- Requires policy update + redeploy

**Mitigation:**

1. **Policy rule testing** (Mon Week 2): Define test cases for each policy rail. Run skill X → expect [approve|block].
   - Verification: 100% of policy rails have passing tests

2. **Gradual rollout** (Tue Week 2): New policy rails in "audit" mode (log but don't block) for 7 days before enforcement.
   - Verification: Policy.enforcement = "audit" for week 1, then "block"

3. **Skill whitelist override** (Wed Week 2): Pre-approved skills can bypass policy for 24h (emergency gate).
   - Verification: Skill flagged as "approved_until=<timestamp>"

4. **Policy impact dashboard** (Thu Week 2): Show blocked skills + reasons. Alert if > 10 blocks/min (anomaly).
   - Verification: Dashboard live by EOD Week 2

**Owner:** Skills Lead  
**Deadline:** EOD Week 2  
**Status:** OPEN

---

### Risk 7: Skill Execution Cost Overrun

**Severity:** MEDIUM | **Likelihood:** MEDIUM

**Description:**  
Skill estimated cost ($10), actual cost ($50). Phase 24 approved based on estimate; governance exceeded budget.

**Failure Scenario:**  
- Phase 25 submits skill execution proposal
- Evidence packet: estimated cost $10, confidence 0.85
- Council approves based on estimate
- Skill executes; actual cost $50 (due to unexpected API calls)
- Budget exceeded
- CIC forced to stop skill execution mid-task

**Impact:**  
- Cost overrun; governance overspent
- Task incomplete (skill stopped mid-execution)
- Inconsistent state

**Mitigation:**

1. **Cost simulation** (Tue Week 2): Run skill in sandbox with input constraints. Measure actual token usage vs estimate.
   - Verification: Estimate matches simulation within ±10%

2. **Cost ceiling** (Wed Week 2): Set hard limit in proposal. If skill exceeds limit, automatically rollback.
   - Verification: Skill stopped, state rolled back if cost > ceiling

3. **Cost monitoring** (Thu Week 2): Real-time cost tracking during skill execution. Alert if > 120% of estimate.
   - Verification: Alert fires within 10s of crossing threshold

4. **Post-mortem cost review** (Week 3): Analyze cost overruns. Update estimates + add guards.
   - Verification: Skill cost estimate updated; rerun simulation

**Owner:** Skills Lead  
**Deadline:** EOD Week 2  
**Status:** OPEN

---

## Phase 26: TorqueQuery

### Risk 8: Index Fragmentation → Query Latency Spike

**Severity:** MEDIUM | **Likelihood:** MEDIUM

**Description:**  
Index grows to 10GB; fragmented. Query latency p99 > 5s (target: <1s). Downstream phases timeout.

**Failure Scenario:**  
- Phase 26 indexes 300K documents over 4 weeks
- No reindex; index becomes fragmented (gaps from deleted docs)
- Search latency degrades: Week 1 (50ms) → Week 2 (100ms) → Week 3 (500ms) → Week 4 (5s)
- Phase 27 CRO query times out (5s deadline exceeded)
- Counterfactual reasoning fails
- Build blocked Week 4

**Impact:**  
- Phase 27 integration tests flaky/timeout
- Critical path slip to Week 5

**Mitigation:**

1. **Reindex schedule** (Mon Week 1): Plan reindex job daily. Window: 2am UTC (low traffic).
   - Verification: Reindex completes in <10min; queries still responsive

2. **Index health monitoring** (Wed Week 1): Track fragmentation % + query latency. Alert if either threshold crossed.
   - Verification: Dashboard shows fragmentation trend

3. **Incremental compaction** (Thu Week 1): Use search engine's native compaction (Lucene/Elasticsearch merge segments) hourly.
   - Verification: Fragmentation stays <20%

4. **Query timeout + fallback** (Fri Week 1): Phase 27 queries with 3s timeout. If timeout, use cached results from prior query.
   - Verification: Never block phase 27 on index latency

**Owner:** Search Lead  
**Deadline:** EOD Week 1  
**Status:** OPEN

---

### Risk 9: Memory→TQ Bridge Ingestion Lag

**Severity:** MEDIUM | **Likelihood:** HIGH

**Description:**  
Phase 23 writes memory packet; async job ingests to TQ. Lag > 5 min. Phase 27 queries stale index (missing recent decisions).

**Failure Scenario:**  
- Phase 23 writes memory packet at 10:00 AM (decision "approve skill X")
- Ingest job runs every 5 min (10:00, 10:05, 10:10)
- At 10:02 AM, Phase 27 queries TQ for counterfactual: "What if we had rejected skill X?"
- Ingest job hasn't run yet; recent packet not indexed
- Phase 27 doesn't see the approval decision
- Reasoning incomplete/inaccurate

**Impact:**  
- Phase 27 counterfactual reasoning misses recent state
- Decisions less informed

**Mitigation:**

1. **Push-based ingestion** (Mon Week 3): Phase 23 directly calls TQ ingest endpoint (instead of poll job).
   - Verification: Memory packet indexed <100ms after write

2. **Async ingest with SLA** (Tue Week 3): Keep poll job as backup. SLA: 95% indexed within 1 min.
   - Verification: Monitor lag metric; alert if SLA missed

3. **Query-time bridge** (Tue Week 3): If Phase 27 queries TQ but needs recent data, query Phase 23 directly for missing packets.
   - Verification: Phase 27 fallback logic tested

**Owner:** Search Lead + Backend  
**Deadline:** EOD Week 3  
**Status:** OPEN

---

## Phase 27: Counterfactual Reasoning

### Risk 10: Reasoning Loop (Infinite Counterfactuals)

**Severity:** CRITICAL | **Likelihood:** LOW

**Description:**  
CRO generates counterfactual scenario → new memory packet → new proposal → new evidence → next counterfactual queries that. Infinite loop.

**Failure Scenario:**  
- Phase 27 reasoning: "If we rejected skill X, what would happen?"
- Generates hypothetical outcome → writes to memory (marked as "counterfactual")
- Phase 24 governance sees new memory packet
- Proposes decision based on hypothetical
- Phase 27 re-queries: "Given that decision, what if we then approved Y?"
- Chain continues indefinitely
- Memory + proposal backlog explodes
- System timeout

**Impact:**  
- Resource exhaustion (memory, API quota)
- Service unavailable

**Mitigation:**

1. **Counterfactual flag** (Mon Week 3): Memory packets include `is_counterfactual=true`. Phase 24 rejects counterfactual-sourced evidence for real proposals.
   - Verification: Governance refuses evidence from counterfactual packets

2. **Reasoning depth limit** (Tue Week 3): CRO enforces max reasoning chain depth (e.g., 5 levels). Stops deepening at limit.
   - Verification: Chain never exceeds 5 levels

3. **Loop detection** (Wed Week 3): Track which scenarios have been explored. Reject if duplicate detected.
   - Verification: CRO skips second attempt to explore same counterfactual

**Owner:** CRO Lead  
**Deadline:** EOD Week 3  
**Status:** OPEN

---

### Risk 11: Counterfactual Accuracy Unvalidated

**Severity:** MEDIUM | **Likelihood:** HIGH

**Description:**  
Phase 27 generates counterfactual outcome (e.g., "If we approved skill X, cost would be $50"). No validation against reality. Wrong predictions feed future decisions.

**Failure Scenario:**  
- Phase 27 predicts: "If we had approved skill X on 2026-07-10, cost would be $50"
- Skill was actually approved; actual cost = $200
- Prediction was 75% wrong
- But CRO uses this as evidence for "skill X is cheap"
- Future proposals biased by bad prediction
- Cost estimates increasingly inaccurate over time

**Impact:**  
- CRO loses credibility
- Decision quality degrades over time
- Cost estimates drift from reality

**Mitigation:**

1. **Backtest counterfactuals** (Wed Week 3): For each counterfactual scenario, run ground-truth simulation + compare.
   - Verification: Accuracy metric: predictions vs reality <10% error

2. **Confidence decay** (Thu Week 3): Older counterfactual scenarios lose confidence over time (exponential decay). Recent data weighted higher.
   - Verification: Confidence(prediction, age=1 day) = 0.9; confidence(age=30 days) = 0.5

3. **Manual validation gate** (Fri Week 3): Critical counterfactuals (high cost impact) require human sign-off before use in future decisions.
   - Verification: CRO flags "high-impact" scenarios; audit log shows validation

**Owner:** CRO Lead  
**Deadline:** EOD Week 3  
**Status:** OPEN

---

## Cross-Phase Risks

### Risk 12: Integration Test Flakiness

**Severity:** HIGH | **Likelihood:** HIGH

**Description:**  
E2E tests span Phases 23–27. Timing-dependent, network-dependent, order-dependent. Tests pass/fail randomly.

**Failure Scenario:**  
- Week 4 integration test: Memory→Governance→Skills→TQ→CRO flow
- Test 1 (Mon): PASS
- Test 2 (Tue): FAIL (timeout on TQ query)
- Test 3 (Wed): PASS
- Test 4 (Thu): FAIL (memory packet not replicated in time)
- QA: "Are tests reliable? Should we ship?"
- Confidence in Phase 27 delivery low

**Impact:**  
- Cannot confidently say "build is ready"
- May ship with hidden bugs
- Cascading failures in production

**Mitigation:**

1. **Dependency injection** (Week 2): Tests mock external services (Phase 23→24→25→26→27). No real APIs called.
   - Verification: Test runs in <1s (no I/O wait)

2. **Deterministic ordering** (Week 3): Tests use explicit orchestration (no race conditions). Clear setup→action→assert phases.
   - Verification: Same test run 100x = 100 PASS (zero flakiness)

3. **Timeout > max latency** (Week 3): Set timeouts conservatively (e.g., SLA = 100ms, timeout = 1s). No false timeouts.
   - Verification: Load test shows max latency; timeout set to 5x

4. **Retry logic** (Week 4): Transient failures (replication lag) retry up to 3x with exponential backoff.
   - Verification: Flaky test made reliable; passes all 10 runs

**Owner:** QA Lead  
**Deadline:** EOD Week 3  
**Status:** OPEN

---

### Risk 13: Phase 23–27 Dependency Critical Path Not Optimized

**Severity:** MEDIUM | **Likelihood:** MEDIUM

**Description:**  
Critical path assumes 23 → 24 → 25 → 26 → 27 (serial). Phases 26 + 27 could start earlier. Slips to Week 5 possible.

**Failure Scenario:**  
- Planning assumes linear: 23 (Week 1) → 24 (Week 2) → 25 (Week 2) → 26 (Week 3) → 27 (Week 3–4)
- Actual: Phase 26 blocked on Phase 23 API (unavailable until Wed Week 1)
- Phase 26 then blocked on Phase 24 ingest bridge (unavailable until Tue Week 3)
- Phase 26 integration delayed to Fri Week 3
- Phase 27 starts too late; integration test only 3 days
- Quality suffers

**Impact:**  
- Rushed integration
- Inadequate testing
- Higher defect rate

**Mitigation:**

1. **Parallel workstreams** (Week 1): Start Phase 26 with mock Phase 23 API. Update to real API mid-Week 1.
   - Verification: Phase 26 search endpoint live by Thu Week 1 (2 days early)

2. **API stubbing** (Week 2): Phase 27 development doesn't wait for Phase 26 live. Use TQ mock (pre-canned responses).
   - Verification: Phase 27 integration ready 2 days early

3. **Critical path buffer** (Week 4): Add 1-day buffer between phases. If prior phase misses deadline, buffer absorbs slip.
   - Verification: Full 7 days for integration (Mon–Sun Week 4)

**Owner:** Autonomy Lead  
**Deadline:** Fri Week 1 (replan)  
**Status:** OPEN

---

## Summary Table

| Risk | Phase | Severity | Likelihood | Mitigation Owner | Deadline | Status |
|------|-------|----------|-----------|------------------|----------|--------|
| 1 | 23 | CRITICAL | MEDIUM | Backend Lead | EOD W1 | OPEN |
| 2 | 23 | CRITICAL | LOW | Backend Lead | EOD W1 | OPEN |
| 3 | 23 | HIGH | MEDIUM | Autonomy Lead | EOD W1 | OPEN |
| 4 | 24 | CRITICAL | LOW | Governance Lead | EOD W2 | OPEN |
| 5 | 24 | HIGH | MEDIUM | Governance Lead | EOD W2 | OPEN |
| 6 | 25 | HIGH | HIGH | Skills Lead | EOD W2 | OPEN |
| 7 | 25 | MEDIUM | MEDIUM | Skills Lead | EOD W2 | OPEN |
| 8 | 26 | MEDIUM | MEDIUM | Search Lead | EOD W1 | OPEN |
| 9 | 26 | MEDIUM | HIGH | Search Lead | EOD W3 | OPEN |
| 10 | 27 | CRITICAL | LOW | CRO Lead | EOD W3 | OPEN |
| 11 | 27 | MEDIUM | HIGH | CRO Lead | EOD W3 | OPEN |
| 12 | Cross | HIGH | HIGH | QA Lead | EOD W3 | OPEN |
| 13 | Cross | MEDIUM | MEDIUM | Autonomy Lead | Fri W1 | OPEN |

---

## Escalation Path

**Daily standup (9am UTC):** Risk leads brief blockers + mitigations.  
**Weekly review (Fri 3pm UTC):** All risks re-scored. Any CRITICAL → immediate action plan.  
**Executive dashboard:** Owner reports to CIC Roadmap Board weekly.
