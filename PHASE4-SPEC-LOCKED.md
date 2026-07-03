# Phase 4 Specification LOCKED
## v0.4.0-maal-codesign-canary-foundation

**Date:** 2026-06-27  
**Status:** READY FOR IMPLEMENTATION  
**Freeze Tag:** `v0.4.0-maal-codesign-canary-foundation`

---

## What is Phase 4?

MAAL–SPL co-design + canary-gated structural evolution.

SPL proposes structural MAAL deltas via high-level DSL.
MAAL validates invariants.
Governance approves changes.
Canary executes with adaptive, governance-capped cohorts.
Telemetry determines promotion or rollback.

---

## Specification Complete

- **Phase 4 Contract** (immutable)
- **Phase 4 Implementation Order** (15 steps)
- **Phase 4 Test Suite** (25 tests)
- **Phase 4 Governance Playbook 2.0**
- **Phase 4 CI Gate** (10 hard-fail rules)
- **Phase 4 Lint** (24 rules, 6 categories)
- **BLOCK Gap Resolutions** (5 decisions locked)
- **Phase 4 Directory Tree** (canonical file structure)

---

## Key Decisions

1. **Rollback:** Fail-fast + Idempotent + No partial states
2. **Governance TTL:** 7 days + SPL may resubmit
3. **Metric Thresholds:** GlobalRoutingBounds (Phase 1/2) + Phase 4 governance config
4. **BridgeOrchestrator Hooks:** All 5 hooks return structured Result<T, E>
5. **CanaryGrowthConfig Persistence:** Append-only database table

---

## Review Status

✅ **CONDITIONAL → UNLOCKED**

All 5 BLOCK findings from ijfw-review resolved:
1. Rollback state machine defined
2. Governance approval timeout semantics locked
3. Metric thresholds concrete + sourced
4. BridgeOrchestrator hook signatures explicit
5. CanaryGrowthConfig persistence model locked

---

## Next Steps

Implementation in new chat.

See: `.claude/projects/c--dev/memory/phase-4-complete-spec.md`
