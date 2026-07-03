#!/usr/bin/env node

/**
 * Phase 3 Builder: Handoff Protocol Spec Generator
 * Docker-based execution for creating all handoff specifications
 *
 * Input: Phase 2 memory documents from /workspace/memory/
 * Output: 6 handoff protocol specs in /workspace/specs/
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/workspace';
const SPECS_DIR = path.join(WORKSPACE, 'specs');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

// Ensure output directory exists
if (!fs.existsSync(SPECS_DIR)) {
  fs.mkdirSync(SPECS_DIR, { recursive: true });
}

// Template: Handoff Protocol Spec
function createHandoffSpec(name, milestone, from, to, input, output, contents) {
  return `# ${name}

**Version:** 1.0.0
**Locked:** 2026-06-19
**Milestone:** ${milestone}
**From:** ${from}
**To:** ${to}

---

## Overview

Deterministic handoff protocol between ${from} and ${to}.

**Input to handoff:**
${input.map(i => `- ${i}`).join('\n')}

**Output from handoff:**
${output.map(o => `- ${o}`).join('\n')}

---

${contents}

---

## Success Criteria

✅ Protocol unambiguous
✅ Example handoff provided with exact format
✅ No gray areas in task scope
✅ Rollback procedure defined
✅ Locked as v1.0.0 (immutable)

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-06-19 | Initial handoff protocol locked |

This is version 1.0.0 (immutable). Future updates create v1.0.1, v1.1.0, or v2.0.0 as appropriate.
`;
}

// Generate HANDOFF_COPILOT_ANTIGRAVITY.v1.0.0.md
const spec1 = createHandoffSpec(
  'Copilot → Antigravity Handoff',
  '3.1.1',
  'Copilot (task shaper)',
  'Antigravity (execution engine)',
  [
    'Task specification (goal, files affected, constraints)',
    'File list to modify',
    'Style constraints (naming, testing, determinism)',
    'Success criteria (tests pass, code reviews)',
    'Operator preferences from memory'
  ],
  [
    'Modified files (committed to branch)',
    'Test results (pass/fail with output)',
    'Context update (what changed, why)',
    'Blockers (if any)',
    'Audit trail (what tool was used)'
  ],
  `## Handoff Task Format

\`\`\`json
{
  "task_id": "copilot-2026-06-19-001",
  "goal": "Fix auth middleware token expiry check",
  "files": [
    {
      "path": "src/auth/middleware.ts",
      "action": "modify",
      "context": "Change < to <= in expiry comparison"
    }
  ],
  "constraints": {
    "style": "camelCase, no docstrings",
    "testing": "Jest, ts-jest preset, npm test only",
    "commits": "Conventional commits, atomic, auto-signed"
  },
  "success_criteria": [
    "All tests pass (npm test)",
    "Code review approved",
    "No regressions in other auth flows"
  ],
  "timestamp": "2026-06-19T10:00:00Z"
}
\`\`\`

## Antigravity Response Format

\`\`\`json
{
  "task_id": "copilot-2026-06-19-001",
  "status": "complete",
  "files_modified": [
    {
      "path": "src/auth/middleware.ts",
      "lines_changed": 3,
      "commit_sha": "a1b2c3d4e5f6"
    }
  ],
  "tests_result": {
    "passed": 156,
    "failed": 0,
    "duration_ms": 4200
  },
  "context_updates": {
    "files_read": ["src/auth/middleware.ts"],
    "files_written": ["src/auth/middleware.ts"],
    "new_state": "Token expiry now uses <= comparison"
  },
  "timestamp": "2026-06-19T10:02:15Z",
  "next_step": "Copilot reviews results and updates context"
}
\`\`\`

## Failure Handling

If Antigravity encounters error:

1. **Test failure:** Return failed test output; Copilot reviews and reshapes task
2. **File not found:** Return error; Copilot clarifies file path
3. **Constraint violation:** Copilot clarifies constraint; Antigravity retries

**Rollback:** Antigravity can revert last commit if operator approves.

---

## Pattern: Antigravity → Copilot Context Sync

After code changes, Antigravity signals Copilot to re-anchor:

\`\`\`json
{
  "event": "code_update_complete",
  "task_id": "copilot-2026-06-19-001",
  "files_to_reread": [
    "src/auth/middleware.ts",
    "jest.config.js"
  ],
  "metrics": {
    "lines_added": 2,
    "lines_deleted": 1,
    "test_pass_rate": 1.0
  },
  "timestamp": "2026-06-19T10:02:15Z"
}
\`\`\`

Copilot reads updated files and refreshes its context.
`
);

// Generate HANDOFF_COPILOT_CLAUDE.v1.0.0.md
const spec2 = createHandoffSpec(
  'Copilot → Claude Handoff',
  '3.2.1',
  'Copilot (problem framing)',
  'Claude (deep reasoning)',
  [
    'Problem statement (business goal, constraints)',
    'Code excerpt or architecture diagram',
    'Prior attempts or context',
    'Success criteria (what "correct" looks like)'
  ],
  [
    'Validated plan or refactor specification',
    'Trade-off analysis (pros/cons of approaches)',
    'Risk assessment',
    'Recommendations for Antigravity'
  ],
  `## Handoff Problem Format

\`\`\`json
{
  "reasoning_task_id": "claude-2026-06-19-001",
  "problem": "CIC governance voting thresholds causing deadlocks",
  "context": "Phase 24 governance model requires 2/3 council vote on all decisions. Current council has 3 members. Single dissent blocks approval.",
  "constraints": [
    "Immutable once locked",
    "Must match operator intent",
    "Cannot break prior governance records"
  ],
  "success_criteria": "Recommend threshold that prevents deadlock while preserving governance strength",
  "timestamp": "2026-06-19T11:00:00Z"
}
\`\`\`

## Claude Response Format

\`\`\`json
{
  "reasoning_task_id": "claude-2026-06-19-001",
  "analysis": "Current 2/3 threshold is too strict for 3-member council (blocks on single dissent). Recommend moving to 1-dissent-allowed (2/3 actually means 2 votes required, not 2/3 of votes).",
  "recommendation": "Change thresholdMode from 'supermajority' to 'majority_plus_one', updating from 2/3 to 3/4 effectively",
  "trade_offs": [
    {
      "option": "Stick with 2/3 (2 votes)",
      "pros": ["Stronger governance"],
      "cons": ["Deadlock risk with 3-member council"]
    },
    {
      "option": "Move to majority (2/3 votes)",
      "pros": ["Deadlock-free"],
      "cons": ["Weaker governance"]
    }
  ],
  "risk_assessment": "Low risk if done correctly (governance is isolated, can be reverted)",
  "handoff_to_antigravity": "Update GovernanceModel.ts threshold logic and tests",
  "timestamp": "2026-06-19T11:05:30Z",
  "next_step": "Copilot validates recommendation and routes to Antigravity for implementation"
}
\`\`\`

## Claude → Antigravity Handoff

Claude sends validated plan to Antigravity:

\`\`\`json
{
  "implementation_task_id": "antigravity-2026-06-19-001",
  "spec": {
    "file": "src/governance/GovernanceModel.ts",
    "change": "Update thresholdMode from 'supermajority' to 'majority_plus_one'",
    "logic_change": "2/3 threshold → 3/4 threshold (new formula: Math.ceil(council.size * 0.75))"
  },
  "tests_required": [
    "3-member council with 2 votes passes",
    "3-member council with 1 vote fails",
    "Historical governance records unaffected"
  ],
  "timestamp": "2026-06-19T11:06:00Z"
}
\`\`\`
`
);

// Generate HANDOFF_LOCAL_LLMS.v1.0.0.md
const spec3 = createHandoffSpec(
  'Copilot → Local LLMs Handoff',
  '3.3.1',
  'Copilot (task specification)',
  'Local LLM (deterministic transform)',
  [
    'Input JSON/YAML/schema to transform',
    'Transformation rule (expand, rewrite, generate)',
    'Output format spec',
    'Determinism constraint (same input → same output)'
  ],
  [
    'Transformed output (exact format specified)',
    'Hash of output (for determinism verification)',
    'Execution time',
    'Any validation errors'
  ],
  `## Deterministic Transform Task

\`\`\`json
{
  "transform_id": "local-llm-2026-06-19-001",
  "operation": "expand_agent_profile",
  "input": {
    "agent_name": "CICBuildAgent",
    "description": "Build orchestration",
    "capabilities": ["execute", "log", "retry"]
  },
  "output_schema": {
    "name": "string",
    "description": "string",
    "capabilities": ["string"],
    "governance": "boolean",
    "api_contract": "object"
  },
  "determinism_check": "sha256(output) == known_hash",
  "timestamp": "2026-06-19T12:00:00Z"
}
\`\`\`

## Local LLM Response

\`\`\`json
{
  "transform_id": "local-llm-2026-06-19-001",
  "status": "success",
  "output": {
    "name": "CICBuildAgent",
    "description": "Build orchestration; phase execution coordination",
    "capabilities": ["execute", "log", "retry", "approve"],
    "governance": true,
    "api_contract": {
      "input": "TaskSpec",
      "output": "ExecutionResult",
      "timeout_ms": 300000
    }
  },
  "output_hash": "abc123def456...",
  "known_hash": "abc123def456...",
  "determinism_verified": true,
  "execution_time_ms": 245,
  "timestamp": "2026-06-19T12:00:01Z"
}
\`\`\`

## Failure: Determinism Mismatch

If output hash ≠ known hash:

\`\`\`json
{
  "status": "error",
  "error_code": "DETERMINISM_MISMATCH",
  "expected_hash": "abc123def456...",
  "actual_hash": "different_hash_here",
  "message": "Transform did not produce deterministic output. Input changed or LLM model drift detected."
}
\`\`\`

Copilot escalates to operator.
`
);

// Generate HANDOFF_COPILOT_CIC.v1.0.0.md
const spec4 = createHandoffSpec(
  'Copilot → CIC Autonomy Handoff',
  '3.4.1',
  'Copilot (goal specification)',
  'CIC (autonomous execution)',
  [
    'Goal statement (ingest, enrich, analyze, synthesize)',
    'Data input (repo, phase, roadmap)',
    'Constraints (approval gates, limits)',
    'Success metrics'
  ],
  [
    'Synthesis result (insights, artifacts)',
    'Approval decision (approved / needs review)',
    'Evidence vault record (lineage packet)',
    'Operator sign-off (if required)'
  ],
  `## CIC Autonomy Task

\`\`\`json
{
  "cic_task_id": "cic-2026-06-19-001",
  "goal": "Synthesize Phase 26 completion status",
  "operation": "synthesize_phase_status",
  "input": {
    "phase": 26,
    "roadmap": "cic-roadmap.v0.1.0.md",
    "governance": "autonomous"
  },
  "approval_gates": {
    "modify_spec": "requires_operator",
    "modify_roadmap": "requires_operator",
    "ingest_only": "autonomous"
  },
  "constraints": {
    "cascade_depth_limit": 5,
    "budget_race_protection": true,
    "rbac_validation": true
  },
  "timestamp": "2026-06-19T13:00:00Z"
}
\`\`\`

## CIC Response

\`\`\`json
{
  "cic_task_id": "cic-2026-06-19-001",
  "status": "success",
  "synthesis": {
    "phase": 26,
    "completion": 0.95,
    "insights": ["78 tests passing", "Event ingestion complete", "Validation module locked"],
    "recommendations": ["Merge Phase 26", "Begin Phase 27"]
  },
  "vault_record": {
    "lineage_packet_id": "lp-123456",
    "decision": "Phase 26 ready for Phase 27",
    "approver": "copilot",
    "timestamp": "2026-06-19T13:02:30Z"
  },
  "approval_status": "approved",
  "timestamp": "2026-06-19T13:02:30Z"
}
\`\`\`

## CIC Approval Gate

CIC operations requiring operator approval:

| Operation | Auto-approve | Requires Review |
|-----------|--------------|-----------------|
| Ingest events | ✅ Yes | N/A |
| Enrich data | ✅ Yes | N/A |
| Analyze patterns | ✅ Yes | N/A |
| Synthesize insights | ✅ Yes | N/A |
| Modify governance spec | ❌ No | ✅ Operator only |
| Modify roadmap | ❌ No | ✅ Operator only |
| Create agents | ❌ No | ✅ Operator only |
| Approve builds | ✅ Council vote | CIC + Operator consensus |
`
);

// Generate DAILY_LOOP.v1.0.0.md
const spec5 = createHandoffSpec(
  'Daily Loop: Full Workflow',
  '3.5.1',
  'All models (Copilot, Antigravity, Claude, Local LLMs, CIC)',
  'All models (coordinated execution)',
  [
    'Operator input (task, goal, constraints)',
    'Workspace state (specs, roadmaps, memory)',
    'CIC synthesis (prior day insights)'
  ],
  [
    'Code changes (merged to branch)',
    'Updated memory (operator identity, phase progress)',
    'Vault records (approval decisions)',
    'Metrics (test pass rate, token usage)'
  ],
  `## Daily Workflow Sequence

### Morning: Planning (Copilot)

1. Load Phase 2 memory (operator identity, phases, governance model)
2. Read current roadmap state
3. Identify today's tasks

### Development Loop (Copilot → Antigravity → Claude → Local LLMs)

**Step 1: Copilot Shapes Task**
- Frame problem from memory constraints
- List files to modify
- Define success criteria

**Step 2: Copilot → Antigravity (Code Execution)**
- Send task via HANDOFF_COPILOT_ANTIGRAVITY protocol
- Antigravity executes (writes code, runs tests)
- Return result with metrics

**Step 3: Antigravity → Copilot (Context Sync)**
- Update Copilot on code changes
- Copilot reads modified files

**Step 4: Copilot → Claude (Deep Reasoning)**
- If reasoning needed: send via HANDOFF_COPILOT_CLAUDE protocol
- Claude analyzes trade-offs
- Return validated plan

**Step 5: Claude → Antigravity (Implementation)**
- Claude recommends refactor or fix
- Antigravity implements
- Loop back to step 2

**Step 6: Copilot → Local LLMs (Boilerplate)**
- Generate schemas, config, tests
- Local LLM ensures determinism
- Copilot validates output

### Evening: Autonomy (Copilot → CIC)

1. Gather day's changes
2. Hand off to CIC for synthesis via HANDOFF_COPILOT_CIC protocol
3. CIC analyzes phase progress, ingests events
4. CIC records approval decisions to vault
5. Copilot updates memory with day's learnings

### Next Morning: Review

1. CIC synthesis from yesterday available
2. Operator reviews vault records
3. Copilot incorporates insights into new tasks

---

## Example Full-Day Workflow

**Goal:** Fix auth middleware and add tests

**08:00 — Copilot shapes**
- Read operator memory (wants camelCase, Jest, auto-signed commits)
- Identify auth middleware bug
- List files: [auth/middleware.ts, auth/middleware.test.ts]

**08:05 — Copilot → Antigravity**
- Send HANDOFF task: "Fix token expiry check in middleware.ts"

**08:10 — Antigravity executes**
- Read middleware.ts
- Change < to <= in expiry check
- Run Jest tests: 156 pass, 0 fail

**08:12 — Antigravity → Copilot (sync)**
- Update Copilot: "Middleware fixed, tests pass"
- Copilot re-reads middleware.ts

**08:15 — Copilot → Claude (reasoning)**
- Send: "Should we add regression test for this specific case?"

**08:20 — Claude responds**
- "Yes, add test_authExpiry_edgeCase_exactly_zero"

**08:22 — Claude → Antigravity (handoff)**
- Copilot routes to Antigravity
- Add regression test + document

**08:25 — Antigravity executes**
- Add test to middleware.test.ts
- All 157 tests pass

**17:00 — Copilot → CIC (synthesis)**
- Send: "Phase 26 auth work done. 2 commits. 157 tests pass."

**17:05 — CIC synthesizes**
- Records decisions to vault
- Updates phase progress
- Returns synthesis: "Auth complete, tests locked, ready for Phase 27"

**Next day — Copilot reviews**
- Reads CIC synthesis
- Operator sees vault records
- Begin Phase 27 tasks

---

## Troubleshooting: Handoff Failures

| Problem | Cause | Resolution |
|---------|-------|-----------|
| Antigravity fails tests | Code change broke something | Copilot reshapes task, Antigravity retries |
| Claude can't decide | Ambiguous problem | Copilot clarifies constraints, reframes |
| Local LLM determinism fails | Model drift | Use cached version or escalate to operator |
| CIC approval blocked | Modification to protected spec | Operator reviews and signs off |
| Copilot context stale | Too many file changes | Copilot re-reads all modified files |
`
);

// Generate OPERATOR_PLAYBOOK.v1.0.0.md
const spec6 = `# Operator Playbook: Daily UMM Workflow

**Version:** 1.0.0
**Locked:** 2026-06-19
**Scope:** Quick reference for daily work with 5-model handoff system

---

## Quick Start

### Morning

1. Open workspace at \`/workspace\`
2. Copilot loads Phase 2 memory (operator identity, phases, governance)
3. Copilot identifies today's tasks from roadmap
4. Go to "Planning" section below

### Development

1. Ask Copilot: "Fix [issue]" or "Add [feature]"
2. Copilot shapes task, routes to appropriate model
3. Check progress in workspace logs

### Evening

1. Copilot summarizes day's work
2. CIC synthesizes and stores in vault
3. Operator reviews vault records
4. Approve/reject governance decisions

---

## Handoff Quick Reference

### Copilot → Antigravity

**When:** Code needs to be written
**Format:** Task spec with files, constraints, success criteria
**Response:** Modified files, test results, context update
**Doc:** HANDOFF_COPILOT_ANTIGRAVITY.v1.0.0.md

\`\`\`
Copilot: "Fix auth middleware, camelCase, Jest tests"
↓
Antigravity: "Modified, 156 tests pass, context ready"
\`\`\`

### Copilot → Claude

**When:** Deep reasoning needed (trade-offs, validation, refactor planning)
**Format:** Problem frame, constraints, success criteria
**Response:** Analysis, recommendations, risk assessment
**Doc:** HANDOFF_COPILOT_CLAUDE.v1.0.0.md

\`\`\`
Copilot: "Should we change governance thresholds?"
↓
Claude: "Yes, here's why and what to change"
↓
Copilot: Routes validated plan to Antigravity
\`\`\`

### Copilot → Local LLMs

**When:** Deterministic boilerplate generation
**Format:** Input schema, output spec, determinism constraint
**Response:** Transformed output, hash verification
**Doc:** HANDOFF_LOCAL_LLMS.v1.0.0.md

\`\`\`
Copilot: "Expand agent profile for CICBuildAgent"
↓
Local LLM: "Output hash verified, determinism confirmed"
\`\`\`

### Copilot → CIC

**When:** Autonomous synthesis, ingestion, approval
**Format:** Goal, operation, constraints, approval gates
**Response:** Synthesis result, vault record, approval status
**Doc:** HANDOFF_COPILOT_CIC.v1.0.0.md

\`\`\`
Copilot: "Synthesize Phase 26 status"
↓
CIC: "Status synthesized, vault recorded, approved"
\`\`\`

---

## Decision Tree: Which Model?

**Problem: Fix a bug?**
→ Copilot → Antigravity

**Problem: Analyze trade-offs?**
→ Copilot → Claude (then Antigravity if Claude recommends implementation)

**Problem: Generate boilerplate?**
→ Copilot → Local LLMs

**Problem: Synthesize insights?**
→ Copilot → CIC

**Problem: Governance decision?**
→ Copilot → CIC → Vault Record → Operator Sign-Off

---

## Workspace Structure (Navigate With)

\`\`\`
/workspace/
├── memory/                    # Phase 2: Copilot's durable knowledge
│   ├── operator-identity.v1.0.0.md       # Your profile
│   ├── cic-phases.v1.0.0.md              # All 31 phases
│   ├── model-routing-rules.v1.0.0.md     # Which model for what
│   └── ...
├── specs/                     # Phase 3-5: Protocols, charters, policies
│   ├── HANDOFF_COPILOT_ANTIGRAVITY.v1.0.0.md
│   ├── HANDOFF_COPILOT_CLAUDE.v1.0.0.md
│   ├── DAILY_LOOP.v1.0.0.md
│   └── ...
├── agents/                    # Phase 4: Agent registries
│   ├── cic-agents-registry.v1.0.0.json
│   └── ...
├── logs/                      # Phase 5: Audit trail
│   ├── workspace-changes.log
│   ├── cic-events.log
│   └── agents-events.log
└── snapshots/                 # Workspace state backups
    └── archive/
\`\`\`

**Read these daily:**
- \`/workspace/memory/operator-identity.v1.0.0.md\` — Your constraints + preferences
- \`/workspace/specs/DAILY_LOOP.v1.0.0.md\` — Workflow reference
- \`/workspace/memory/model-routing-rules.v1.0.0.md\` — Which model to use

---

## Common Scenarios

### Scenario: Add new feature

1. Copilot: Read roadmap, find feature in phase milestone
2. Copilot shapes task (files, tests, constraints from memory)
3. Copilot → Antigravity: Execute code
4. If complex: Copilot → Claude: Validate approach
5. Copilot → CIC: Synthesize and vault record
6. Operator: Review vault, approve if needed

### Scenario: Fix production bug

1. Copilot: Read operator memory (fast decisions preferred)
2. Copilot shapes minimal fix
3. Copilot → Antigravity: Single-file fix, tests
4. No Claude needed (simple fix)
5. No CIC synthesis needed (operational, not governance)
6. Merge and deploy

### Scenario: Governance decision

1. Copilot: Read cic-governance-model.v1.0.0.md
2. Copilot → Claude: Analyze impact, trade-offs
3. Copilot → CIC: Submit decision via approval gate
4. CIC: Records to vault with lineage packet
5. Operator: Reviews vault record, approves/rejects
6. Copilot: Updates memory with decision

### Scenario: End-of-day synthesis

1. Copilot: Summarize all tasks completed today
2. Copilot → CIC: Hand off for autonomous synthesis
3. CIC: Ingests events, enriches data, synthesizes insights
4. CIC: Stores lineage packet in vault
5. Operator: Reviews vault next morning, gets Copilot summary
6. Copilot: Incorporates insights into next day's memory

---

## Failure Recovery

**If Antigravity fails:** Copilot retries or reshapes task
**If Claude can't decide:** Copilot clarifies constraints
**If Local LLM determinism fails:** Escalate to operator
**If CIC approval blocked:** Operator reviews and signs off
**If Copilot context stale:** Copilot re-reads modified files

---

## Immutability Rules (Don't Break)

✅ Do:
- Update workspace memory (creates v1.0.1+)
- Update roadmaps (creates new version)
- Add logs (append-only)
- Create snapshots (versioned backups)

❌ Don't:
- Modify a v1.0.0 spec
- Delete old versions
- Overwrite vault records
- Change versioning rules

If you need to fix a v1.0.0, create v1.0.1.

---

## Key Contacts

| Role | Model | Task |
|------|-------|------|
| Task Shaper | Copilot | Shapes work, routes to models, updates memory |
| Code Executor | Antigravity | Writes code, runs tests, commits |
| Reasoner | Claude | Validates approaches, analyzes trade-offs |
| Transformer | Local LLMs | Deterministic boilerplate generation |
| Autonomy | CIC | Ingestion, synthesis, approval gates |

---

## Approval Checklist

Before operator approval:

- [ ] Task completed (code written, tests pass)
- [ ] Memory updated (phase progress, new facts)
- [ ] Governance decision recorded (if applicable)
- [ ] Vault record created (lineage packet)
- [ ] No immutability violations
- [ ] Logs append-only

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-06-19 | Operator Playbook locked |

This is version 1.0.0 (immutable). Future updates create v1.0.1, v1.1.0, or v2.0.0 as appropriate.
`;

// Write all specs
const specs = [
  { name: 'HANDOFF_COPILOT_ANTIGRAVITY.v1.0.0.md', content: spec1 },
  { name: 'HANDOFF_COPILOT_CLAUDE.v1.0.0.md', content: spec2 },
  { name: 'HANDOFF_LOCAL_LLMS.v1.0.0.md', content: spec3 },
  { name: 'HANDOFF_COPILOT_CIC.v1.0.0.md', content: spec4 },
  { name: 'DAILY_LOOP.v1.0.0.md', content: spec5 },
  { name: 'OPERATOR_PLAYBOOK.v1.0.0.md', content: spec6 }
];

console.error('Generating Phase 3 handoff specs...');

specs.forEach(spec => {
  const filePath = path.join(SPECS_DIR, spec.name);
  fs.writeFileSync(filePath, spec.content, 'utf8');
  console.error(`✅ Created ${spec.name}`);
});

console.error('\nPhase 3 complete. 6 handoff specs generated:');
specs.forEach(spec => {
  console.error(`  - ${spec.name}`);
});

console.error('\nOutput specs in: ' + SPECS_DIR);
console.error('\nReady to lock Phase 3 success gate.');
