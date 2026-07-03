# UNIFIED MEMORY MODEL (UMM) — D3 EXECUTION PLAN

**Status:** Phase planning locked  
**Scope:** 5 phases, ~25 tasks, 7–10 day execution  
**Owner:** Chris Sorensen  
**Entry point:** Phase 1 scaffold  

---

## PHASE 1: WORKSPACE SCAFFOLD (Days 1–2)

**Goal:** Establish canonical workspace structure that all models (Copilot, Antigravity, Claude, Local LLMs, CIC) read/write into.

### Milestone 1.1: Create Directory Structure
**Task 1.1.1** — Create root `/workspace` with 9 subdirectories  
- **Input:** None  
- **Output:** Clean folder tree  
- **Files affected:** `/workspace/*` (new)  
- **Success criteria:** All 9 folders exist, empty, no files yet  
- **Depends on:** Nothing  
- **Blast radius:** Low (setup only)  

**Task 1.1.2** — Create `/workspace/projects` with 5 sub-project folders  
- **Input:** List of projects (cic, rewrite-labs, ai-os, harvester, torque-query)  
- **Output:** `/workspace/projects/{cic,rewrite-labs,ai-os,harvester,torque-query}`  
- **Files affected:** 5 new project roots  
- **Success criteria:** All 5 project folders exist and are empty  
- **Depends on:** 1.1.1  
- **Blast radius:** Low  

---

### Milestone 1.2: Define Naming Conventions
**Task 1.2.1** — Lock versioned filename pattern  
- **Input:** Decisions from UMM design (semver format)  
- **Output:** `/workspace/specs/NAMING_CONVENTIONS.v1.0.0.md`  
- **Files affected:** 1 new document  
- **Pattern:** `name.vMAJOR.MINOR.PATCH.md` for all roadmaps, specs, architecture docs, agent registries  
- **Success criteria:** Document published, all naming rules unambiguous, examples provided  
- **Depends on:** None  
- **Blast radius:** Medium (affects all future naming)  

**Task 1.2.2** — Lock CLI transcript naming pattern  
- **Input:** Decision: `YYYY-MM-DD_HHMM_project_task.session.md`  
- **Output:** `/workspace/specs/CLI_TRANSCRIPT_PATTERN.v1.0.0.md`  
- **Files affected:** 1 new document  
- **Success criteria:** Pattern locked, examples provided  
- **Depends on:** None  
- **Blast radius:** Medium (affects CLI logging)  

**Task 1.2.3** — Lock log entry format  
- **Input:** Decision: `timestamp | actor | project | artifact | action`  
- **Output:** `/workspace/specs/LOG_ENTRY_FORMAT.v1.0.0.md`  
- **Files affected:** 1 new document  
- **Success criteria:** Format locked, regex pattern provided  
- **Depends on:** None  
- **Blast radius:** Medium (affects all event logs)  

---

### Milestone 1.3: Initialize Core Documents
**Task 1.3.1** — Create empty roadmaps for all 5 projects  
- **Input:** Project list  
- **Output:** 5 roadmap files, versioned as v0.1.0  
- **Files affected:** `/workspace/roadmaps/cic-roadmap.v0.1.0.md` (and 4 others)  
- **Success criteria:** All 5 exist, are empty shells, ready to populate  
- **Depends on:** 1.1.1, 1.2.1  
- **Blast radius:** Low  

**Task 1.3.2** — Create empty agent registries for all 5 projects  
- **Input:** Project list  
- **Output:** 5 JSON registry files, versioned as v0.1.0  
- **Files affected:** `/workspace/agents/{cic,rewrite-labs,ai-os,harvester,torque-query}-agents-registry.v0.1.0.json`  
- **Structure:** `{ agents: [], updated: ISO8601, version: "0.1.0" }`  
- **Success criteria:** All 5 exist, valid JSON, ready to populate  
- **Depends on:** 1.1.1, 1.2.1  
- **Blast radius:** Low  

**Task 1.3.3** — Create workspace README  
- **Input:** Workspace governance rules from UMM design  
- **Output:** `/workspace/README.md`  
- **Contents:** Purpose, folder layout, versioning rules, canonical truth rules, who reads/writes what  
- **Success criteria:** Complete, links to all other docs  
- **Depends on:** 1.2.1, 1.2.2, 1.2.3  
- **Blast radius:** Low  

---

**Phase 1 Success Gate:**  
- ✅ All 9 workspace folders exist  
- ✅ Naming conventions locked in 3 docs  
- ✅ Empty roadmaps + agent registries created  
- ✅ README complete  
- ✅ No code yet, pure scaffolding  

---

## PHASE 2: COPILOT MEMORY MAPPING (Days 2–3)

**Goal:** Define and populate Copilot's durable memory layer — the facts that shape every task.

### Milestone 2.1: Define Memory Schema
**Task 2.1.1** — Create Copilot Memory schema document  
- **Input:** UMM design (what Copilot stores)  
- **Output:** `/workspace/specs/COPILOT_MEMORY_SCHEMA.v1.0.0.md`  
- **Contents:**  
  - Operator identity section  
  - CIC phases section  
  - Rewrite Labs architecture section  
  - Deterministic preferences section  
  - Routing rules section  
  - Agent definitions section  
  - Versioning rules section  
- **Success criteria:** Schema complete, examples provided, structured as JSON + markdown  
- **Depends on:** Phase 1  
- **Blast radius:** High (affects all Copilot behavior)  

---

### Milestone 2.2: Populate Operator Identity
**Task 2.2.1** — Document operator identity facts in Copilot Memory  
- **Input:** Chris Sorensen profile (from CLAUDE.md + memory files)  
- **Output:** Copilot Memory section: Operator Identity  
- **Contents:**  
  - Name, role, domain expertise  
  - Preferences: deterministic, ESM-first, JSON-first, no ambiguity  
  - Communication style: terse, caveman mode active  
  - Tools in use: Copilot, Antigravity, Claude, local LLMs, CIC  
  - Stack familiarity: TypeScript, Node.js, Docker, PostgreSQL, Qdrant  
- **Success criteria:** Identity locked, all preferences documented  
- **Depends on:** 2.1.1  
- **Blast radius:** Medium (affects task shaping)  

---

### Milestone 2.3: Populate CIC Phases
**Task 2.3.1** — Map CIC Phase 1–26 definitions into Copilot Memory  
- **Input:** MASTER_ROADMAP_v3.0.md, phase memory files  
- **Output:** Copilot Memory section: CIC Phases (v1.0.0)  
- **Structure:** For each phase: phase name, goals, deliverables, dependencies, completion status  
- **Success criteria:** All 26 phases mapped, current phase (26) marked, roadmap linked  
- **Depends on:** 2.1.1  
- **Blast radius:** Medium  

**Task 2.3.2** — Map Phase 27–31 planned work into Copilot Memory  
- **Input:** Phase 27–31 specs from workspace  
- **Output:** Copilot Memory section: Planned Phases (v1.0.0)  
- **Structure:** Phase name, goals, rough timeline, dependencies  
- **Success criteria:** All 5 planned phases mapped, clearly marked as "planned"  
- **Depends on:** 2.3.1  
- **Blast radius:** Medium  

---

### Milestone 2.4: Populate Architecture Facts
**Task 2.4.1** — Map Rewrite Labs architecture into Copilot Memory  
- **Input:** BUILD-SUMMARY.md, architecture docs  
- **Output:** Copilot Memory section: Rewrite Labs Architecture  
- **Structure:** 5-layer model, key services, API contracts, deployment patterns  
- **Success criteria:** Architecture locked, layer dependencies clear, deployment patterns documented  
- **Depends on:** 2.1.1  
- **Blast radius:** Medium  

**Task 2.4.2** — Map CIC governance model into Copilot Memory  
- **Input:** Phase 24 governance docs, council rules, vault schema  
- **Output:** Copilot Memory section: CIC Governance Model  
- **Structure:** Council voting, policy rails, decay logic, approval gates  
- **Success criteria:** Governance model locked, voting thresholds documented, rail precedence clear  
- **Depends on:** 2.1.1  
- **Blast radius:** High (affects CIC execution)  

---

### Milestone 2.5: Lock Routing Rules
**Task 2.5.1** — Document model-routing hierarchy in Copilot Memory  
- **Input:** Routing decisions from handoff design  
- **Output:** Copilot Memory section: Model Routing Rules  
- **Structure:**  
  - Copilot = task shaper + memory  
  - Antigravity = coding engine  
  - Claude = deep reasoning  
  - Local LLMs = deterministic transforms  
  - CIC = autonomous execution  
  - Workspace = canonical state  
- **Success criteria:** Hierarchy locked, routing logic unambiguous, conflict resolution rules documented  
- **Depends on:** 2.1.1  
- **Blast radius:** High (affects all task routing)  

---

**Phase 2 Success Gate:**  
- ✅ Copilot Memory schema locked in spec  
- ✅ Operator identity fully documented  
- ✅ All 31 CIC phases mapped  
- ✅ Architecture facts populated  
- ✅ Governance model locked  
- ✅ Model routing rules documented  

---

## PHASE 3: CROSS-MODEL HANDOFF PROTOCOL (Days 3–5)

**Goal:** Define deterministic handoff patterns between Copilot, Antigravity, Claude, local LLMs, and CIC.

### Milestone 3.1: Document Copilot → Antigravity Handoff
**Task 3.1.1** — Create handoff protocol document  
- **Input:** Daily loop design from UMM  
- **Output:** `/workspace/specs/HANDOFF_COPILOT_ANTIGRAVITY.v1.0.0.md`  
- **Contents:**  
  - What Copilot provides (task spec, file list, constraints, instructions)  
  - What Antigravity executes (code write, file updates, structure maintenance)  
  - Success criteria for handoff  
  - Example handoff (with exact format)  
- **Success criteria:** Protocol documented with 3+ example handoffs, no ambiguity  
- **Depends on:** Phase 2  
- **Blast radius:** High (primary handoff)  

**Task 3.1.2** — Create Antigravity → Copilot context-update pattern  
- **Input:** Daily loop design  
- **Output:** `/workspace/specs/PATTERN_ANTIGRAVITY_COPILOT_SYNC.v1.0.0.md`  
- **Contents:**  
  - How Copilot re-anchors after code updates  
  - What files Copilot reads  
  - How context is updated  
  - Example sync (with exact format)  
- **Success criteria:** Pattern locked, example provided  
- **Depends on:** 3.1.1  
- **Blast radius:** Medium  

---

### Milestone 3.2: Document Copilot → Claude Handoff
**Task 3.2.1** — Create handoff protocol: Copilot shapes, Claude reasons  
- **Input:** Daily loop design  
- **Output:** `/workspace/specs/HANDOFF_COPILOT_CLAUDE.v1.0.0.md`  
- **Contents:**  
  - What Copilot provides (problem frame, files, constraints)  
  - What Claude executes (reasoning, validation, refactor planning)  
  - Success criteria for deep reasoning  
  - Example handoff  
- **Success criteria:** Protocol locked with example  
- **Depends on:** Phase 2  
- **Blast radius:** Medium  

**Task 3.2.2** — Create Claude → Antigravity handoff  
- **Input:** Daily loop design  
- **Output:** `/workspace/specs/HANDOFF_CLAUDE_ANTIGRAVITY.v1.0.0.md`  
- **Contents:**  
  - What Claude provides (validated plan, refactor spec)  
  - What Antigravity implements  
  - Success criteria  
- **Success criteria:** Pattern locked  
- **Depends on:** 3.2.1  
- **Blast radius:** Medium  

---

### Milestone 3.3: Document Local LLM Deterministic Transforms
**Task 3.3.1** — Create local-LLM transform protocol  
- **Input:** Daily loop design  
- **Output:** `/workspace/specs/HANDOFF_LOCAL_LLMS.v1.0.0.md`  
- **Contents:**  
  - What Copilot specifies (transform, file, constraints)  
  - What local LLM executes (schema expansion, JSON rewrite, boilerplate)  
  - Success criteria for determinism  
  - Example transform  
- **Success criteria:** Protocol locked, determinism guarantee documented  
- **Depends on:** Phase 2  
- **Blast radius:** Medium  

---

### Milestone 3.4: Document CIC Autonomous Execution
**Task 3.4.1** — Create CIC execution protocol  
- **Input:** CIC autonomy decisions from Phase 2  
- **Output:** `/workspace/specs/HANDOFF_COPILOT_CIC.v1.0.0.md`  
- **Contents:**  
  - What Copilot specifies (goal, phase, constraints)  
  - What CIC executes (ingestion, enrichment, orchestration, synthesis)  
  - CIC approval gates (what requires operator sign-off)  
  - Success criteria  
- **Success criteria:** Protocol locked, approval gates clear  
- **Depends on:** Phase 2  
- **Blast radius:** High (affects CIC scope)  

---

### Milestone 3.5: Consolidate Daily Loop
**Task 3.5.1** — Create comprehensive daily-loop document  
- **Input:** All handoff protocols from 3.1–3.4  
- **Output:** `/workspace/specs/DAILY_LOOP.v1.0.0.md`  
- **Contents:**  
  - Full workflow sequence: Copilot → Antigravity → Copilot → Claude → Antigravity → Local LLMs → Copilot → CIC  
  - Each handoff linked to its protocol document  
  - Example full-day workflow  
  - Troubleshooting guide (what to do when handoff fails)  
- **Success criteria:** Complete loop documented, no gaps, example workflow clear  
- **Depends on:** 3.1–3.4  
- **Blast radius:** High (operational reference)  

---

### Milestone 3.6: Create Operator Playbook
**Task 3.6.1** — Generate Operator Playbook artifact  
- **Input:** All handoff protocols, daily loop, routing rules  
- **Output:** `/workspace/specs/OPERATOR_PLAYBOOK.v1.0.0.md`  
- **Contents:** Summary of all handoff rules, daily loop, quick-reference checklist  
- **Success criteria:** Playbook is the one-page reference for daily work, complete and actionable  
- **Depends on:** 3.5.1  
- **Blast radius:** Low (reference only)  

---

**Phase 3 Success Gate:**  
- ✅ All handoff protocols locked (Copilot→Antigravity, Copilot→Claude, Local LLMs, CIC)  
- ✅ Daily loop consolidated  
- ✅ Operator Playbook generated  
- ✅ Example workflows provided  
- ✅ No ambiguity in any handoff  

---

## PHASE 4: CIC AUTONOMY CHARTER (Days 5–6)

**Goal:** Define CIC's authority boundaries, approval gates, and agent registry structure.

### Milestone 4.1: Define CIC Authority Boundaries
**Task 4.1.1** — Create CIC autonomy charter  
- **Input:** CIC autonomy decisions from Phase 2, governance model  
- **Output:** `/workspace/specs/CIC_AUTONOMY_CHARTER.v1.0.0.md`  
- **Contents:**  
  - What CIC can do without approval: ingest, enrich, analyze, log, synthesize  
  - What CIC must ask for: modify architecture, modify specs, modify roadmaps, create agents, alter pipeline  
  - Approval gate rules  
  - Escalation patterns  
- **Success criteria:** Authority boundaries crystal clear, no gray area  
- **Depends on:** Phase 2  
- **Blast radius:** High (affects all CIC autonomy)  

---

### Milestone 4.2: Populate Agent Registry
**Task 4.2.1** — Define agent registry schema  
- **Input:** Agent design from workspace  
- **Output:** `/workspace/specs/AGENT_REGISTRY_SCHEMA.v1.0.0.json`  
- **Structure:** Agent name, capabilities, router logic, constraints, approval gates  
- **Success criteria:** Schema is valid JSON, supports all 5 projects  
- **Depends on:** Phase 1  
- **Blast radius:** Medium  

**Task 4.2.2** — Populate CIC agent registry  
- **Input:** Existing CIC agents (build, roadmap, analyzer, ingestor, orchestrator)  
- **Output:** `/workspace/agents/cic-agents-registry.v1.0.0.json`  
- **Contents:** All 5 CIC agents with profiles  
- **Success criteria:** Registry complete, valid JSON, all agents documented  
- **Depends on:** 4.2.1  
- **Blast radius:** Medium  

**Task 4.2.3** — Populate Rewrite Labs agent registry  
- **Input:** Rewrite Labs agents  
- **Output:** `/workspace/agents/rewrite-labs-agents-registry.v1.0.0.json`  
- **Success criteria:** Registry complete  
- **Depends on:** 4.2.1  
- **Blast radius:** Medium  

**Task 4.2.4** — Create agent profile templates  
- **Input:** Agent design patterns  
- **Output:** `/workspace/agents/AGENT_PROFILE_TEMPLATE.v1.0.0.json`  
- **Structure:** Template for new agents  
- **Success criteria:** Template is usable, comprehensive, extensible  
- **Depends on:** 4.2.1  
- **Blast radius:** Low  

---

### Milestone 4.3: Lock CIC Execution Policies
**Task 4.3.1** — Create CIC execution policy document  
- **Input:** Autonomy charter, routing rules, governance model  
- **Output:** `/workspace/specs/CIC_EXECUTION_POLICIES.v1.0.0.md`  
- **Contents:**  
  - When CIC executes automatically  
  - When CIC waits for approval  
  - Timeout policies  
  - Fallback behavior  
  - Error handling  
- **Success criteria:** Policies unambiguous, testable, complete  
- **Depends on:** 4.1.1  
- **Blast radius:** High (affects runtime behavior)  

---

**Phase 4 Success Gate:**  
- ✅ CIC autonomy charter locked  
- ✅ Agent registries populated for CIC + Rewrite Labs  
- ✅ CIC execution policies locked  
- ✅ Authority boundaries clear, no surprises  

---

## PHASE 5: GOVERNANCE AUDIT LAYER (Days 6–8)

**Goal:** Establish drift detection, conflict resolution, and rollback procedures.

### Milestone 5.1: Define Drift Detection
**Task 5.1.1** — Create drift-detection rules document  
- **Input:** Governance model, versioning rules  
- **Output:** `/workspace/specs/DRIFT_DETECTION_RULES.v1.0.0.md`  
- **Contents:**  
  - What constitutes drift (spec modified without version, roadmap overwritten, architecture changed without approval)  
  - How to detect it (file comparison, timestamp checks, version tracking)  
  - How to alert (log entry, Copilot notification, CIC escalation)  
  - How to prevent it (immutability rules, versioning enforcement)  
- **Success criteria:** Rules clear, detection patterns defined, prevention measures documented  
- **Depends on:** Phase 2  
- **Blast radius:** Medium  

---

### Milestone 5.2: Define Conflict Resolution
**Task 5.2.1** — Create conflict-resolution hierarchy document  
- **Input:** Routing rules, hierarchy from handoff design  
- **Output:** `/workspace/specs/CONFLICT_RESOLUTION_HIERARCHY.v1.0.0.md`  
- **Contents:**  
  - Decision hierarchy (Copilot Memory > Workspace > Claude > Antigravity > Local LLMs > CIC)  
  - Example conflicts and resolution  
  - Escalation to operator  
  - No model can override another below it  
- **Success criteria:** Hierarchy locked, examples clear, no ambiguity  
- **Depends on:** Phase 2  
- **Blast radius:** High (affects all decision-making)  

---

### Milestone 5.3: Define Rollback Procedures
**Task 5.3.1** — Create rollback procedure document  
- **Input:** Versioning rules, workspace structure  
- **Output:** `/workspace/specs/ROLLBACK_PROCEDURES.v1.0.0.md`  
- **Contents:**  
  - How to revert any artifact to a previous version  
  - How to restore workspace state from snapshot  
  - How to replay CLI commands from transcript  
  - How to audit rollback actions  
- **Success criteria:** Procedures testable, complete, safe  
- **Depends on:** Phase 1  
- **Blast radius:** Medium  

**Task 5.3.2** — Create snapshot procedure document  
- **Input:** Workspace structure  
- **Output:** `/workspace/specs/SNAPSHOT_PROCEDURES.v1.0.0.md`  
- **Contents:**  
  - When to take snapshots (after each phase, after each major task)  
  - What to include (workspace state, agent logs, metrics)  
  - Snapshot naming and versioning  
  - How to load snapshots  
- **Success criteria:** Procedure clear, automatable  
- **Depends on:** Phase 1  
- **Blast radius:** Low  

---

### Milestone 5.4: Consolidate Governance Document
**Task 5.4.1** — Create master governance document  
- **Input:** All governance specs from Phase 5  
- **Output:** `/workspace/specs/UMM_GOVERNANCE.v1.0.0.md`  
- **Contents:**  
  - Drift detection  
  - Conflict resolution hierarchy  
  - Rollback procedures  
  - Snapshot procedures  
  - Approval gates  
  - Audit log format  
- **Success criteria:** Complete governance reference, linked to all detail docs  
- **Depends on:** 5.1–5.3  
- **Blast radius:** Low (reference)  

---

### Milestone 5.5: Create Audit Log Infrastructure
**Task 5.5.1** — Initialize audit logs in workspace  
- **Input:** Log entry format from Phase 1  
- **Output:**  
  - `/workspace/logs/workspace-changes.log` (empty, ready for entries)  
  - `/workspace/logs/cic-events.log` (empty)  
  - `/workspace/logs/agents-events.log` (empty)  
- **Files affected:** 3 new log files  
- **Success criteria:** All logs exist, format documented, ready to receive entries  
- **Depends on:** Phase 1, 5.4.1  
- **Blast radius:** Low  

---

**Phase 5 Success Gate:**  
- ✅ Drift detection rules locked  
- ✅ Conflict resolution hierarchy locked  
- ✅ Rollback procedures documented  
- ✅ Snapshot procedures documented  
- ✅ Master governance document created  
- ✅ Audit logs initialized  

---

## EXECUTION SUMMARY

| Phase | Goal | Days | Key Deliverables |
|-------|------|------|------------------|
| 1 | Workspace scaffold | 1–2 | 9 folders, naming rules, empty registries |
| 2 | Copilot Memory | 2–3 | Durable facts, identity, architecture, phases |
| 3 | Handoff protocol | 3–5 | 5 handoff specs, daily loop, playbook |
| 4 | CIC autonomy | 5–6 | Charter, agent registries, execution policies |
| 5 | Governance audit | 6–8 | Drift detection, conflict resolution, rollback |

**Total:** ~25 tasks, 7–10 days, production-ready UMM.

---

## SUCCESS GATES (All-or-nothing)

- ✅ Phase 1: Workspace structure canonical, no files drift  
- ✅ Phase 2: Copilot Memory locked, all 31 phases mapped  
- ✅ Phase 3: Daily loop executable, all handoffs documented  
- ✅ Phase 4: CIC authority clear, agent registries complete  
- ✅ Phase 5: Governance auditable, rollback testable  

---

## DEPENDENCIES

```
Phase 1 ─┬─→ Phase 2 ─┬─→ Phase 3
         │           │
         ├─→ Phase 4 ─┤
         │           │
         └─→ Phase 5 ─┴──→ (ready to execute)
```

Phase 1 must complete before anything else.  
Phase 2 must complete before Phase 3.  
Phase 3, 4, 5 can run in parallel after Phase 2.

---

## BLAST RADIUS

| Phase | Scope | Risk | Mitigation |
|-------|-------|------|-----------|
| 1 | Scaffolding | Low | No code, pure structure |
| 2 | Memory mapping | Medium | Copilot behavior changes, test with tasks first |
| 3 | Handoff protocol | High | All future work depends on this, validate with example workflows |
| 4 | CIC autonomy | High | Agent scope expands, test in sandbox first |
| 5 | Governance | Medium | Audit-only, no code changes, rollback always available |

---

## NEXT STEP

Start Phase 1, Task 1.1.1: Create `/workspace` root directory with 9 subdirectories.

Ready?
