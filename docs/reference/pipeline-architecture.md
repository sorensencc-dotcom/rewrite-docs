---
title: "Pipeline Architecture & Phases"
description: "Unified pipeline execution model with phase and batch terminology standards"
created: "2026-07-07"
tags:
  - architecture
  - pipeline
  - phases
  - batch
  - execution
canonical: true
backlinks:
  - docs/item-5-skill-generator.md (Runbook patterns)
  - docs/item-6-knowledge-graph.md (Impact analysis)
  - cic-ref/ROADMAP.md (Phase definitions)
---

# Pipeline Architecture & Phases

Single source of truth for CIC pipeline execution model, phase lifecycle, and batch processing semantics.

---

## PIPELINE OVERVIEW

### Core Concept

**Pipeline** = Orchestrated sequence of phases that transforms input (vault docs) into output (skills, dashboards, knowledge graph).

**Phase** = Atomic unit of work with clear inputs, validation gates, and outputs.

**Batch** = Collection of items (documents, repos, skills) processed in a single phase execution.

```
Input (Vault Docs)
    ↓
Phase 1: Extract     [Transform docs → concepts]
    ↓ (validation gate)
Phase 2: Analyze     [Dependency mapping]
    ↓ (validation gate)
Phase 3: Generate    [Create skills/dashboards]
    ↓ (validation gate)
Phase 4: Validate    [Test generated artifacts]
    ↓ (validation gate)
Phase 5: Deploy      [Register skills, publish]
    ↓
Output (Runbook Skills, Dashboards, Graphs)
```

---

## PHASE LIFECYCLE

### State Machine

```
PENDING
  ↓
RUNNING (executing batch items)
  ├→ ERROR (failed validation gate)
  │   ↓ (human review + fix)
  │   → RETRYING
  │
  └→ COMPLETE (all items succeeded)
      ↓
      ARCHIVED (moved to history)
```

**Phase Status Fields:**
- `id` — Unique phase identifier (e.g., "phase-27-skill-generation")
- `name` — Human-readable name (e.g., "Skill Generation")
- `state` — PENDING|RUNNING|ERROR|COMPLETE|ARCHIVED
- `started_at` — ISO 8601 timestamp
- `completed_at` — ISO 8601 timestamp (null if not complete)
- `batch_size` — Number of items to process
- `batch_processed` — Items completed so far
- `error_count` — Number of failed items
- `validation_gates` — List of gates (must pass before proceeding)

### Example: Phase Execution Log

```json
{
  "phase_id": "phase-27-skill-generation",
  "name": "Skill Generation",
  "state": "RUNNING",
  "started_at": "2026-07-07T10:00:00Z",
  "batch": {
    "total": 5,
    "processed": 3,
    "failed": 0,
    "items": [
      {
        "id": "skill-1-cic-env-validator",
        "state": "COMPLETE",
        "output": "C:\\dev\\toolforge\\skills\\cic-env-validator\\skill.json",
        "duration_ms": 850
      },
      {
        "id": "skill-2-deploy-checklist",
        "state": "RUNNING",
        "progress": "Generating tests..."
      }
    ]
  },
  "validation_gates": [
    {
      "gate": "skill.json syntax",
      "status": "PASS"
    },
    {
      "gate": "Implementation logic complete",
      "status": "PENDING"
    }
  ]
}
```

---

## BATCH PROCESSING MODEL

### Batch Definition

A batch is a collection of items processed together in a single phase:

**Skill Generation Batch (Item 5):**
- Input: 7 vault docs (cic-ref/*.md)
- Phase: Skill Generation
- Batch items: 5 skills (cic-env-validator, deploy-checklist, token-lookup, etc.)
- Expected output: 5 skill directories + tests + docs
- Validation gate: All tests pass (npm test)

**Pipeline State Batch (Item 2):**
- Input: CIC + RL system state
- Phase: Metrics Emission
- Batch items: 8 metric types (latency, error, throughput, schema)
- Expected output: Prometheus /metrics endpoint serving valid metrics
- Validation gate: Prometheus successfully scrapes data

### Batch Execution Semantics

**Serial Execution (Default):**
- Items processed one at a time
- Prevents resource contention (file I/O, API calls)
- Used for: Skill generation, doc extraction

**Parallel Execution (When Safe):**
- Items processed concurrently
- Used for: Independent queries, read-only operations
- Constraint: No shared writes (JSON files, databases)

**Batch Retry Logic:**
```
For each item in batch:
  attempt = 0
  while attempt < 3:
    try:
      process(item)
      mark COMPLETE
      break
    catch error:
      attempt++
      if attempt == 3:
        log ERROR
        mark FAILED
        report
```

---

## PHASE DEFINITIONS

### Phase 1: Extraction

**Purpose:** Parse vault docs, extract structured metadata

**Inputs:**
- Vault doc directory (cic-ref/*.md)
- Extraction template (JSON schema)

**Processing:**
1. Read each doc
2. Parse frontmatter (title, purpose, tags)
3. Extract sections (Requires, Produces, Steps, Validation Rules)
4. Build extraction record (JSON)

**Outputs:**
- extraction_manifest.json (all docs + extracted fields)
- validation_report (any parsing errors)

**Validation Gates:**
- ✅ All required sections found
- ✅ Extracted JSON valid against schema
- ✅ No parsing errors (warnings allowed)

**Example Output:**
```json
{
  "doc_id": "cic-ref/CIC_ENV_REFERENCE",
  "extracted": {
    "title": "CIC Environment Reference",
    "purpose": "Validate environment configuration",
    "inputs": ["System .env file"],
    "outputs": ["Validation report (JSON)"],
    "requires": [
      {
        "name": "ANTHROPIC_API_KEY",
        "type": "string",
        "required": true,
        "validation": "non-empty"
      },
      {
        "name": "PORT",
        "type": "number",
        "required": false,
        "default": 4000,
        "validation": "1024-65535"
      }
    ]
  }
}
```

### Phase 2: Analysis

**Purpose:** Map dependencies, identify relationships, compute impact

**Inputs:**
- extraction_manifest.json from Phase 1

**Processing:**
1. For each extracted doc:
   - Identify referenced docs (wikilinks, section references)
   - Map skill → doc dependencies
   - Infer concept relationships
2. Build dependency graph
3. Compute critical path (what must complete first)

**Outputs:**
- dependency_graph.json (nodes + edges)
- impact_analysis.json (if change X, what breaks?)
- critical_path.json (minimum viable sequence)

**Validation Gates:**
- ✅ No cycles in dependency graph
- ✅ All referenced docs exist
- ✅ Impact scores computed (<5s)

### Phase 3: Generation

**Purpose:** Create executable artifacts (skills, dashboards, etc.)

**Inputs:**
- extraction_manifest.json
- dependency_graph.json
- skill templates (src/index.ts, skill.json)

**Processing:**
1. For each extracted doc:
   - Determine skill type (validator, runbook, query, integration)
   - Generate skill.json (metadata + configuration)
   - Generate src/index.ts (with stubs)
   - Generate tests/skill.test.ts (test cases from docs)
   - Generate docs/USAGE.md (operator guide)

**Outputs:**
- Skill directories: `C:\dev\toolforge\skills\{name}/`
  - skill.json
  - src/index.ts
  - tests/skill.test.ts
  - docs/USAGE.md
  - package.json

**Validation Gates:**
- ✅ skill.json syntax valid (JSON schema)
- ✅ TypeScript compiles (tsc --noEmit)
- ✅ File structure matches pattern

### Phase 4: Validation

**Purpose:** Verify generated artifacts work correctly

**Inputs:**
- Generated skills from Phase 3
- Test cases extracted from docs

**Processing:**
1. npm test (run Jest suite for each skill)
2. Manual validation (execute skill with test inputs)
3. Documentation review (USAGE.md complete)
4. Schema validation (outputs match declared schema)

**Outputs:**
- test_results.json (pass/fail for each skill)
- validation_report.md (any issues found)

**Validation Gates:**
- ✅ All tests pass (100% pass rate)
- ✅ No TypeScript errors
- ✅ Documentation complete
- ✅ Triggers cover 3+ use cases

### Phase 5: Deployment

**Purpose:** Register skills, make available to Claude

**Inputs:**
- Validated skills from Phase 4
- SKILLPACK_MANIFEST.json template

**Processing:**
1. Update SKILLPACK_MANIFEST.json
2. Copy skill directories to final location
3. Verify skills load (Claude skill registry check)
4. Document in skill-registry.md

**Outputs:**
- Updated SKILLPACK_MANIFEST.json
- Deployed skills in toolforge/
- skill-registry.md (current skill inventory)

**Validation Gates:**
- ✅ Manifest updated correctly
- ✅ Skills loadable in Claude
- ✅ No broken symlinks or paths

---

## BATCH VS PHASE TERMINOLOGY

### Standard Terms

| Term | Meaning | Usage |
|------|---------|-------|
| **Phase** | Atomic work unit with inputs, validation, outputs | "We're in Phase 3: Generation" |
| **Batch** | Collection of items processed in one phase | "Batch contains 5 skills" |
| **Item** | Single unit within batch | "Skill 1: cic-env-validator is an item" |
| **Gate** | Validation checkpoint before proceeding | "Code must pass all tests (gate)" |
| **Stage** | Synonym for phase (use sparingly) | Avoid; use "phase" instead |
| **Step** | Detailed procedural action | "Step 1: Read vault docs" |

### Naming Convention

**Phase names** (use noun + verb or noun only):
- ✅ "Extraction" or "Extract Metadata"
- ✅ "Analysis" or "Build Dependencies"
- ✅ "Generation" or "Generate Skills"
- ❌ "Extract" (too terse, ambiguous)

**Batch names** (use item type + count):
- ✅ "5 skills" or "Skill Batch (5 items)"
- ✅ "Extraction batch (7 docs)"
- ❌ "Phase 3 batch" (redundant)

---

## PIPELINE STATE PERSISTENCE

### State File Location

`C:\dev\.ijfw\pipeline-state.json`

**Fields:**
```json
{
  "current_phase": "phase-27-skill-generation",
  "phase_status": "RUNNING",
  "batch": {
    "total": 5,
    "processed": 3,
    "failed": 0
  },
  "started_at": "2026-07-07T10:00:00Z",
  "checkpoint": {
    "last_completed_item": "skill-2",
    "resume_from": "skill-3"
  },
  "validation_gates": [
    { "gate": "syntax", "status": "PASS" },
    { "gate": "tests", "status": "PENDING" }
  ]
}
```

**Checkpoint Recovery:**
- On resume: Load last checkpoint
- Skip completed items
- Resume from `resume_from` item
- Prevents duplicate work

---

## OBSERVABILITY & MONITORING

### Metrics to Track

Per-phase metrics (emit to Prometheus):
```
pipeline_phase_duration_seconds{phase, status}     # Histogram
pipeline_batch_items_total{phase, status}          # Counter
pipeline_validation_gate_status{phase, gate}       # Gauge
pipeline_phase_errors_total{phase}                 # Counter
```

Example PromQL queries:
```
# Phase duration (p95, last 7 days)
histogram_quantile(0.95, pipeline_phase_duration_seconds{phase="skill-generation"}[7d])

# Success rate by phase
sum(pipeline_batch_items_total{status="COMPLETE"}) 
/ sum(pipeline_batch_items_total) by (phase)
```

### Logging Events

**Phase Transitions:**
```json
{
  "event": "phase_started",
  "phase_id": "phase-27",
  "phase_name": "Skill Generation",
  "batch_size": 5,
  "timestamp": "2026-07-07T10:00:00Z"
}
```

**Batch Item Completion:**
```json
{
  "event": "batch_item_complete",
  "phase_id": "phase-27",
  "item_id": "skill-1-cic-env-validator",
  "status": "COMPLETE",
  "duration_ms": 850,
  "output_path": "C:\\dev\\toolforge\\skills\\cic-env-validator\\",
  "timestamp": "2026-07-07T10:08:30Z"
}
```

**Validation Gate Results:**
```json
{
  "event": "validation_gate_result",
  "phase_id": "phase-27",
  "gate": "all_tests_pass",
  "status": "PASS",
  "details": {
    "passed": 15,
    "failed": 0,
    "skipped": 2
  },
  "timestamp": "2026-07-07T10:15:45Z"
}
```

---

## INTEGRATION WITH OTHER ITEMS

### Item 2: Observability Dashboard
- Dashboard panel: "Pipeline Status" (current phase + batch progress)
- Metrics: phase duration, batch items processed, error rate
- Drill-down: Link to detailed phase logs

### Item 3: Vault Extraction
- Phase 1 (Extraction) reads vault docs
- Outputs extraction_manifest.json used by Phase 2

### Item 5: Skill Generator
- Phase 3 (Generation) runs skill generation
- Phase 4 (Validation) tests generated skills
- Phase 5 (Deployment) registers skills

### Item 6: Knowledge Graph
- Phase 2 (Analysis) builds dependency graph
- Knowledge graph visualizes phase dependencies
- Impact queries: "If I change Phase X..."

### Item 7: Memory Governance
- Pipeline state persisted to vault
- Checkpoints enable resume capability
- Phase transitions logged for audit trail

---

## TROUBLESHOOTING

### Phase Stuck in RUNNING

**Symptoms:** Phase doesn't transition to COMPLETE or ERROR

**Debug:**
1. Check pipeline-state.json (is it updating?)
2. Review phase logs (stderr/stdout capture)
3. Verify validation gates (any marked PENDING?)
4. Check for hanging processes (npm test timeout?)

**Recovery:**
1. Manual inspection of partially-generated files
2. Update pipeline-state.json: `"state": "ERROR"`
3. Fix underlying issue (e.g., timeout value)
4. Manually transition to next phase or resume

### Batch Item Fails

**Symptoms:** One skill fails to generate; others not attempted

**Debug:**
1. Check test_results.json (which test failed?)
2. Review error log (parsing error? missing section?)
3. Validate input extraction (was item extracted correctly?)

**Recovery:**
1. Fix source doc (add missing section)
2. Re-run Phase 1 (extraction)
3. Resume batch from failed item

---

## SUCCESS CRITERIA

✅ Pipeline completes all 5 phases without manual intervention  
✅ Batch items process sequentially (no dropped items)  
✅ Validation gates pass before proceeding  
✅ State persisted (can resume from checkpoint)  
✅ Metrics emitted (pipeline dashboard shows progress)  
✅ Logs complete (can audit phase history)  
✅ Critical path computed correctly  

---

## CROSS-REFERENCES

- **Phases in CIC Roadmap:** See `cic-ref/ROADMAP.md`
- **Observability:** See `docs/reference/configuration-logging.md`
- **Impact Analysis:** See `docs/item-6-knowledge-graph.md`
- **Skill Framework:** See `docs/reference/skill-framework.md`

---

**Last Updated:** 2026-07-07  
**Extracted From:** Merge Candidates Review (421 duplicate pairs) + Skill Generator + Knowledge Graph  
**Maintainer:** Platform Architecture
