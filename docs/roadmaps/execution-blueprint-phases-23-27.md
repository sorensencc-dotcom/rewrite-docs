---
name: roadmap-execution-blueprint-phases-23-27
description: Execution blueprint for phases 23-27 autonomy stack
metadata:
  type: roadmap
---

# Execution Blueprint: Phases 23–27 Autonomy Stack
**Timeline:** 4-week sprint starting ~2026-07-08  
**Critical Path:** 23 → 24 → 25 → 26 → 27  
**Parallel Tracks:** 23+26 can overlap; 24+25 can overlap  

---

## Dependency Graph (DAG)

```
Week 1:
┌─────────────────────────────────────────┐
│ Phase 23: Memory Layer                  │
│ (23.1–23.4) FOUNDATION + API lock       │
│ Deliverable: phase-23-memory-api.yaml   │
└──────────────┬──────────────────────────┘
               │
               ├─────────────────────────────┬──────────────────────────┐
               │                             │                          │
               ↓                             ↓                          ↓
        Phase 24 (Week 2)            Phase 25 (Week 2)          Phase 26 (Week 1–2)
        Governance Layer             Skills + Policy             TorqueQuery Indexing
        Council voting               Skill registry              Parallel track
        Policy rails                 Execution gates             Feeds from 23 + 24
        (blocks 25, 27)              (blocks 27)                 (blocks 27)
               │                             │                          │
               └─────────────────────────────┴──────────────────────────┘
                                    │
                                    ↓
                          Phase 27 (Week 3–4)
                          CRO: Counterfactual Reasoning
                          Reads from 23, 24, 26
```

---

## Weekly Breakdown

### Week 1: Phase 23 + Phase 26 Foundation (2026-07-08 to 2026-07-14)

**Phase 23.1–23.2: Memory Storage & Query (Mon–Wed)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | Design MemoryPacket schema | Autonomy Lead | YAML schema | None | Schema has all fields in spec |
| Tue | Implement write endpoint (/memory/packets) | Backend | Working endpoint | None | POST returns 200 + packet_id |
| Wed | Implement query endpoint (/memory/query) | Backend | Indexed queries | Write endpoint | Query returns <100ms on 10K docs |
| Thu | Unit tests (23.1) | QA | 30 test cases | Endpoints | Coverage >90% |
| Fri | Integration test (23 ↔ storage) | QA | E2E flow | Unit tests | Write→query→retrieve works |

**Phase 23.3–23.4: Evidence Linking (Thu–Fri)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Thu | Evidence packet schema | Autonomy Lead | YAML update | None | Linked to memory packets |
| Fri | State snapshot capture | Backend | Snapshot logic | Schema | KG hash + governance version logged |

**Parallel: Phase 26.1–26.2 (Mon–Fri)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | TorqueQuery indexing schema | Search Lead | IndexableDocument YAML | None | Schema matches TQ API spec |
| Tue | Full-text indexer stub | Backend | Index service | Schema | Can ingest 1K docs |
| Wed | Semantic embeddings model | ML | Embedding service | None | Generates 1536-dim vectors |
| Thu | Document ingest pipeline | Backend | Batch ingest (Phase 23→26) | Indexer + embeddings | 100 docs/sec throughput |
| Fri | Search endpoint (basic) | Backend | /search/query POST | Ingest | Query latency <100ms |

**Blockers checked:** Phase 23 MemoryPacket API must be locked by EOD Wed; Phase 26 embeddings model chosen by EOD Wed.

---

### Week 2: Phase 24 + Phase 25 (2026-07-15 to 2026-07-21)

**Phase 24.1–24.2: Governance Foundations (Mon–Wed)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | PolicyRail + CouncilVote schema | Governance Lead | YAML schema | None | Covers [critical, high, medium, low] |
| Tue | Policy query endpoint | Backend | /governance/policy-rails GET | Schema | Returns active rails <50ms |
| Wed | Proposal submission endpoint | Backend | /governance/proposals POST | Query endpoint | Proposes 200+ rejection reason |
| Thu | Council voting mechanism | Backend | /proposals/{id}/vote POST | Proposal endpoint | Records vote + signature |
| Fri | Policy version management | Backend | Governance.v24.x versioning | Voting | Can roll back to prior version |

**Phase 24.3–24.4: Evidence Vault (Thu–Fri)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Thu | Evidence packet schema | Governance Lead | Risk assessment + cost | Phase 23 evidence | Packet links memory_packets array |
| Fri | Evidence retrieval | Backend | /governance/evidence GET | Storage | Returns full packet in <200ms |

**Blocker check:** Phase 24 API locked by EOD Wed; council member roster defined by EOD Thu.

**Parallel: Phase 25.1–25.2 (Mon–Fri)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | Skill registry schema | Skills Lead | Skill metadata YAML | None | Tracks [id, name, cost, risk] |
| Tue | Skill lookup endpoint | Backend | /skills/{id} GET | Registry schema | Returns <50ms |
| Wed | Policy gate logic | Backend | Before executing skill, check rails | Phase 24 governance | Blocks skill if rail violated |
| Thu | Skill execution wrapper | Backend | Execute skill + log decision | Gate logic | Logs phase + memory packet |
| Fri | Phase 25 integration tests | QA | 20 E2E tests | All above | Cost/error/latency logged |

**Blocker check:** Skill registry + policy gate wiring must be complete by EOD Fri; Phase 24 governance must be queryable from Phase 25 code.

---

### Week 3: Phase 26 + Phase 27 Wiring (2026-07-22 to 2026-07-28)

**Phase 26.3–26.5: Bridge & Specialized Queries (Mon–Wed)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | Memory→TQ ingest bridge | Backend | Automatic indexing on memory write | Phase 23 + Phase 26 ingest | Each memory packet auto-indexed <5min |
| Tue | Governance→TQ ingest bridge | Backend | Index governance decisions | Phase 24 + Phase 26 ingest | Each decision auto-indexed <5min |
| Wed | RL cost-query endpoint | Backend | /search/rl-query POST | Both bridges | Returns cost trends + recommendation |
| Thu | CRO counterfactual endpoint | Backend | /search/cic-query POST | Both bridges | Queries state replay scenarios |
| Fri | TQ health + reindex | Backend | /index/stats, /index/reindex | All above | Index 50K docs, <1MB |

**Phase 27.1–27.2: CRO Foundation (Mon–Fri)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | Counterfactual reasoning schema | CRO Lead | Decision tree YAML | None | Handles if/then/else scenarios |
| Tue | State replay engine | Backend | Query TQ + reconstruct past state | Phase 26 /cic-query | Replays state <100ms |
| Wed | Policy rail validator | Backend | Check decision against rails | Phase 24 governance | Validates 100 decisions/sec |
| Thu | Observability integration | Backend | Log all CRO decisions | All above | All decisions to audit trail |
| Fri | Phase 27 integration tests | QA | 15 E2E counterfactual scenarios | All above | Policy compliance 100% |

**Blocker check:** Phase 26 bridge endpoints live by EOD Tue; Phase 27 reasoning schema locked by EOD Mon.

---

### Week 4: Integration & Validation (2026-07-29 to 2026-08-04)

**Integration Tests (Mon–Thu)**

| Day | Task | Owner | Deliverable | Blocked By | Success Criterion |
|-----|------|-------|-------------|-----------|-------------------|
| Mon | E2E memory→governance flow | QA | Packet created, proposal voted, logged | Weeks 1–3 | Full trace captured |
| Tue | E2E governance→skills flow | QA | Policy queried, skill gated, executed | Weeks 1–3 | Decision + audit trail |
| Wed | E2E TQ cost estimation (RL) | QA | Cost trend query works end-to-end | Week 3 bridge | Returns cost + confidence |
| Thu | E2E CRO reasoning (Phase 27) | QA | Counterfactual scenario runs, validated | Weeks 3–4 | Policy compliance verified |

**Load Testing (Fri)**

| Test | Target | Threshold |
|------|--------|-----------|
| Memory write burst | 1K packets/sec | <500ms p99 |
| Governance proposal vote | 100 votes/min | <200ms each |
| TQ search (10K docs) | 100 queries/sec | <100ms p99 |
| CRO reasoning chain | 10 parallel scenarios | <5s per scenario |

**Success Gate (Fri):**
- [x] All endpoints in spec functional
- [x] All integration tests PASS
- [x] Load tests meet targets
- [x] Zero data loss on restart
- [x] Audit trail 100% captured
- [x] API documentation complete

---

## Critical Path Timeline

```
Week 1:
  Mon 7/8:  Phase 23.1 schema locked ─┐
  Tue 7/9:  23 write endpoint live     │
  Wed 7/10: 23 query endpoint live ────┤──→ Phase 24 can start Thu
  Thu 7/11: Phase 26.1 indexer live    │
  Fri 7/12: Phase 26 search working ───┘

Week 2:
  Mon 7/15: Phase 24.1 schema locked ──┐
  Tue 7/16: 24 policy query live       │
  Wed 7/17: 24 proposal endpoint live ─┤──→ Phase 25 can start
  Thu 7/18: Phase 25.1 skill registry ──┤──→ Phase 27 can prep
  Fri 7/19: 25 policy gate working ────┘

Week 3:
  Mon 7/22: Phase 26 bridge live ──┐
  Tue 7/23: TQ RL endpoint live ───┤──→ Phase 27 ready
  Wed 7/24: TQ CRO endpoint live ──┤
  Thu 7/25: Phase 27 reasoning start │
  Fri 7/26: Phase 27 validator live ┘

Week 4:
  Mon 7/29–Thu 8/1: Integration tests
  Fri 8/2:          Load + ship gate
```

---

## Resource Allocation

| Phase | Backend | QA | Lead | Blockers | Notes |
|-------|---------|----|----|----------|-------|
| 23 | 2 eng | 1 | Autonomy | None | Memory write-heavy, needs replication |
| 24 | 2 eng | 1 | Governance | 23 API | Council member roster needed |
| 25 | 1 eng | 1 | Skills | 24 governance | Lightweight, calls existing skill code |
| 26 | 2 eng | 1 | Search | 23+24 feeds | ML embedding model choice critical |
| 27 | 2 eng | 1 | CRO | All | Most complex; start early (Week 2) |

**On-call rotation:** Escalation path for blockers; daily standup sync.

---

## Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Phase 23 replication lag (>5min) | Medium | High | Pre-stage PostgreSQL replica, test failover Week 1 |
| Council voting deadlock | Low | Critical | Define tie-breaking rule (admin override) before Week 2 |
| TQ index fragmentation | Medium | Medium | Plan reindex strategy, test on 50K docs before Week 3 |
| Phase 27 counterfactual timeout (>5s) | Medium | Medium | Cache common scenarios, add parallel query limit |
| Integration test flakiness | High | Medium | Disable networking dependencies, use in-memory stubs |

---

## Sign-Off Gates

**EOD Week 1:** Phase 23 API locked, Phase 26 search live, no critical blockers.  
**EOD Week 2:** Phase 24 governance live, Phase 25 gate working, Phase 27 prep complete.  
**EOD Week 3:** Phase 26 bridges live, Phase 27 reasoning working, E2E traces captured.  
**EOD Week 4:** All integration tests PASS, load tests PASS, ready for Phase 28+ onboarding.
