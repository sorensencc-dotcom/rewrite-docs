# Six Rules Framework — Integration Guide

**Status:** Phase 27 Wave E Integration Ready  
**Date:** 2026-07-08  
**Location:** `cic-ingestion/src/{drift,autonomy}/`

---

## Overview

Six Rules Framework is a deterministic autonomous coding discipline system integrated into CIC OS Phase 27. It enforces:

1. **Verification First** — Write failing test before any fix
2. **Define Done** — Machine-verifiable acceptance criteria upfront
3. **Deterministic Debugging** — Reproduce → isolate → test
4. **Dependency Skepticism** — Justify every dependency
5. **Surface Uncertainty** — No confident guessing
6. **Failure Mode Self-Recognition** — Detect & halt on drift

---

## Architecture

### Three-Layer Design

```
ExecutionPolicy (existing)
  ↓
InstinctOps (NEW) — Pre-cognitive biases
  ↓
Code Execution
  ↓
CodeLevelDriftDetector (NEW) — Detect KS/WA/OP/RR
  ↓
ExecutionPolicyAutoHealing (NEW) — Halt + regenerate plan
  ↓
Resume Gate
```

### New Files

| File | Purpose | Location |
|------|---------|----------|
| `CodeLevelDriftDetector.ts` | Detects Kitchen Sink, Wrong Abstraction, Optimistic Path, Runaway Refactor | `cic-ingestion/src/drift/` |
| `InstinctOps.ts` | 10 pre-cognitive biases for autonomous agents | `cic-ingestion/src/autonomy/` |
| `ExecutionPolicyInterceptor.AutoHealing.ts` | Auto-healing: diagnose drift → rewrite plan/criteria → resume | `cic-ingestion/src/autonomy/` |
| `SixRulesFramework.ts` | Barrel export of all three layers | `cic-ingestion/src/autonomy/` |
| `six-rules-integration.test.ts` | Full test suite (30+ tests) | `cic-ingestion/src/tests/` |

---

## Usage: Wave E Integration

### 1. Import Framework

```typescript
import {
  CodeLevelDriftDetector,
  InstinctOps,
  ExecutionPolicyAutoHealing,
} from '../autonomy/SixRulesFramework.js';
```

### 2. Initialize in Autonomy Loop

```typescript
const driftDetector = new CodeLevelDriftDetector();
const instincts = new InstinctOps();
const healing = new ExecutionPolicyAutoHealing();

// In Wave E repair operation:
const input: CodeLevelInput = {
  plan: repairPlan,
  codeChanges: diffs,
  tests: testResults,
  dependencies: deps,
  logs: agentLogs,
};

// Check for drift
const drift = driftDetector.check(input);
if (drift) {
  // Halt and heal
  const healed = await healing.onDriftDetected(drift, {
    plan: repairPlan,
    criteria: acceptanceCriteria,
    logs: agentLogs,
  });

  if (healed.resumeAllowed) {
    // Resume with revised plan
    resumeWithPlan(healed.revisedPlan, healed.revisedCriteria);
  } else {
    // Request manual approval (hard drift)
    haltAndWaitForApproval(healed);
  }
}
```

### 3. Enforce Instincts Upfront

```typescript
const instinctContext = {
  taskId: repairTaskId,
  agentRole: 'coder' as const,
  timestamp: Date.now(),
  enforced: true, // halt on violation
};

// Before plan generation
const planViolations = instincts.beforePlan(instinctContext, {
  criteria: acceptanceCriteria,
  request: userRequest,
});

if (planViolations.shouldHalt) {
  throw new Error(planViolations.reason);
}

// Before dependency addition
const depViolations = instincts.beforeDependencyAdd(instinctContext, {
  depName: 'some-lib',
  justification: 'needed for X',
  version: '1.0.0',
});

// ... etc
```

---

## Drift Detection: Four Failure Modes

### Kitchen Sink (KS)

**Definition:** Scope creeps beyond acceptance criteria.

**Signals:**
- Files modified outside `expectedScope`
- Unrelated modules touched
- New files created without justification

**Hard Drift?** YES → requires manual approval to resume

**Healing Strategy:**
- Shrink scope to single file
- Constraint: `max_files_modified = 1`
- No new files allowed

---

### Wrong Abstraction (WA)

**Definition:** Duplicated logic across files not factored.

**Signals:**
- Identical code blocks in 3+ places
- No function extraction despite duplication
- Plan mentions "copy" or "duplicate"

**Hard Drift?** NO → can auto-heal and resume

**Healing Strategy:**
- Require explicit abstraction step
- Constraint: `extract_shared_function = true`
- Constraint: `no_duplicate_blocks = true`

---

### Optimistic Path (OP)

**Definition:** Missing error handling or negative test cases.

**Signals:**
- No try/catch or guards in code
- Acceptance criteria error cases → zero negative tests
- No malformed input / null / timeout tests

**Hard Drift?** NO → can auto-heal and resume

**Healing Strategy:**
- Enumerate all error scenarios
- Require tests for each error case
- Constraint: `require_error_tests = true`

---

### Runaway Refactor (RR)

**Definition:** Cascading changes beyond requested scope.

**Signals:**
- 4+ files modified
- Logs contain "clean up", "modernize", "refactor", "rename"
- Architecture changes without request

**Hard Drift?** YES → requires manual approval to resume

**Healing Strategy:**
- Freeze architecture
- Limit to 1-2 files surgical changes
- No renames or restructuring
- Constraint: `max_files_modified = 2`

---

## Instinct Layer: 10 Rules

| Instinct | Hook | Checks | Halts On Violation |
|----------|------|--------|-------------------|
| Verification First | `beforeFix` | Failing test exists | YES |
| Define Done | `beforePlan` | Acceptance criteria defined | YES |
| Deterministic Debugging | `beforeFix` | Error reproduced | YES |
| Dependency Skepticism | `beforeDependencyAdd` | Justification + version | YES |
| Surface Uncertainty | `beforeCode` | No confident guessing | YES |
| Failure Mode Recognition | `onDrift` | Drift detected | YES |
| Surgical Change | `beforeRefactor` | ≤1 file OR justified | YES |
| Plan Before Code | `beforeCode` | Step-bounded plan exists | YES |
| Negative Case Awareness | `beforeCode` | Error cases have tests | YES |
| Drift Halt Reflex | `onDrift` | Stop immediately on drift | YES |

---

## Auto-Healing Output

When drift is detected and auto-healing fires:

```json
{
  "revisedPlan": "# Revised Plan (Healed: KITCHEN_SINK)\n...",
  "revisedCriteria": "# Revised Acceptance Criteria\n...",
  "amplifiedConstraints": {
    "mode": "INSTINCT_ENFORCED",
    "max_files_modified": 1,
    "no_new_files": true,
    "haltOnViolation": true
  },
  "resumeAllowed": false,
  "reason": "Healed KITCHEN_SINK: Scope expanded beyond criteria",
  "healingDuration": 234
}
```

---

## Integration with ExecutionPolicy

New ExecutionMode available:

```typescript
export enum ExecutionMode {
  INTERACTIVE = 'INTERACTIVE',
  UNATTENDED = 'UNATTENDED',
  BATCH = 'BATCH',
  MAINTENANCE = 'MAINTENANCE',
  INSTINCT_ENFORCED = 'INSTINCT_ENFORCED', // NEW
}
```

Use `INSTINCT_ENFORCED` mode when:
- Running autonomous coding tasks
- Drift detection is critical
- Wave E repair/prune operations
- High-stakes transformations

---

## Testing

Run full test suite:

```bash
npm test -- six-rules-integration.test.ts
```

Coverage:
- CodeLevelDriftDetector: 8 test suites, 20+ tests
- InstinctOps: 3 test suites, 15+ tests
- ExecutionPolicyAutoHealing: 3 test suites, 10+ tests

---

## Metrics & Telemetry

InstinctOps tracks all violations:

```typescript
const telemetry = instincts.getTelemetry();
// {
//   verification_first: 5,
//   define_done: 8,
//   plan_first: 7,
//   dependency_skepticism: 3,
//   ...
// }
```

All drift events logged:
- DriftSignal.type (KS/WA/OP/RR)
- DriftSignal.severity (LOW/MEDIUM/HIGH/CRITICAL)
- DriftSignal.details (structured reason)
- DriftSignal.timestamp

---

## Phase 27 Wave E Integration Checklist

- [ ] Import `SixRulesFramework` into Wave E repair loop
- [ ] Initialize `CodeLevelDriftDetector` for repair operations
- [ ] Add `InstinctOps` enforcement to planner + coder roles
- [ ] Wire `ExecutionPolicyAutoHealing` into repair execution
- [ ] Set ExecutionMode to `INSTINCT_ENFORCED` for Wave E
- [ ] Run integration tests: `npm test -- six-rules-integration.test.ts`
- [ ] Test repair operation end-to-end with dummy drift scenario
- [ ] Monitor telemetry during first Wave E run
- [ ] Document lessons learned in session memory

---

## See Also

- [CIC Drift Engine](../reference/pipeline-architecture.md)
- [ExecutionPolicy Architecture](../autonomy-model.md)
- [Phase 27 Autonomy Specification](phase-27-ingestion-autonomy-locked.md)
