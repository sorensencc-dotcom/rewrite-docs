# ITEM 7: MEMORY + VAULT FUSION GOVERNANCE FRAMEWORK
**Date:** 2026-07-02  
**Applies to:** CIC + Rewrite Labs dual project system  
**Status:** Implementation-ready

---

## EXECUTIVE SUMMARY

Define authoritative split between:
- **Vault** (Obsidian @ C:\dev) — Stable, long-lived architecture & reference  
- **Memory** (Claude.md in-session) — Operator identity, preferences, and current task context
- **Living Docs** (OneDrive/Drive) — Volatile project state, status updates, phase logs

**Goal:** Enable Claude to answer structural questions from vault, operational questions from memory/state, and avoid storing volatile data in persistent memory.

---

## CORE PRINCIPLE

**If it changes in the same conversation → Memory (or Living Docs)**  
**If it's stable for months → Vault (or CLAUDE.md)**  
**If it's transient state → Memory only (never persist)**

---

## GOVERNANCE TABLE

| Category | Belongs | Rationale | Example | Refresh |
|----------|---------|-----------|---------|---------|
| **Identity & Role** | CLAUDE.md | Stable for project lifetime | Chris, sorensencc@gmail.com, CIC+RL operator | Never |
| **Long-term Preferences** | CLAUDE.md | Operator-specific, rarely change | "Be concise", "Load CIC context first", "Verify vs infer" | Quarterly |
| **Project Structure** | CLAUDE.md | Architecture stable across sessions | "CIC = research engine", "RL = redesign engine", "8-item build plan" | Quarterly |
| **Skill Registry** | CLAUDE.md | Skill list grows slowly | load-cic-context, run-cic-pipeline, generate-bob | Ad-hoc |
| **Vault Location & Structure** | CLAUDE.md | Filesystem config, rarely changes | C:\dev paths, .obsidian metadata, sync schedule | Ad-hoc |
| **System Architecture** | Vault (cic-ref/) | Design docs, reference material | BUILD-SUMMARY, AGENTS, CIC_ENV_REFERENCE | On-demand |
| **Research Findings** | Vault (cic-ref/) | Stable documented research | Token strategies, agent patterns, observability plans | On-demand |
| **Patterns & Playbooks** | Vault (architecture/) | Reusable system knowledge | "How to add an extractor", "Alert rule templates" | On-demand |
| **RL System Design** | Vault (rl-ref/) | Stable RL architecture (pending docs) | Redesign engine architecture, generation pipeline | On-demand |
| **Current Phase / Status** | STATE Docs (Drive) | Changes per session | "Phase 18 in progress", "Adapters completed", "Observability pending" | Per session |
| **Execution Progress** | STATE Docs (Drive) | Daily / weekly checkpoints | "Harvest: 400 docs, 2m elapsed", "Build quality: 94%" | Daily |
| **CIC Project State** | CIC_PROJECT_STATE.md | Volatile operational state | Current build phase, pending tasks, integration blockers | Daily |
| **RL Project State** | REWRITE_LABS_STATE.md | Volatile operational state | Current redesign phase, customer feedback, roadmap shifts | Daily |
| **Pending Questions** | In-session Memory | Conversation-level, discarded after | "Clarify RL doc location", "Confirm cost thresholds", "Verify Phase 18 timeline" | Session end |
| **Task Context** | In-session Memory | Current work in progress | "Building Item 2 dashboard", "Validating Item 3 graph", "Drafting Item 7 rules" | Session end |
| **File Paths / IDs** | Never in Memory | Session-specific, paths change | "C:\dev\cic-ref\BUILD-SUMMARY.md", "G:\My Drive\..." | Session only |
| **Batch Counts** | Never in Memory | Volatile operational counts | "Harvested 2,400 docs", "Indexed 45K vectors" | Session only |
| **Timestamps** | Never in Memory (except CLAUDE.md sync dates) | Volatile unless architecturally significant | "Generated 2026-07-02 16:30", "Last sync 10:42:39" | Live query |
| **Debug Logs** | Never in Memory | Session-specific noise | Error stacks, test output, API responses | Session only |

---

## ENFORCEMENT RULES

### Rule 1: Never Store Volatile State in CLAUDE.md
**Violation:** "CIC ingestion: 2,400 docs harvested, 45K vectors, Qdrant query p95=23ms"  
**Fix:** Query living docs (CIC_PROJECT_STATE.md) or dashboard (Prometheus) on demand.

**Violation:** "Last vault sync: 2026-07-02 10:42:39"  
**Fix:** Store in 00-INDEX.md frontmatter, refresh on every sync.

### Rule 2: Distinguish Memory from Vault
**Correct:**
```
# CLAUDE.md (identity + structure)
- Chris Sorensen, operator for CIC+RL
- 8-item build plan: research, dashboard, extraction, mirror, skills, graph, memory, audit
- Vault location: C:\dev (via Obsidian)

# vault: cic-ref/ (architecture & design)
- How adapters work (BUILD-SUMMARY.md)
- Token strategy (CIC_TOKEN_PACK_v2_0_FULL_LIST.md)
- SLO targets (OBSERVABILITY_PLAN.md)

# Living doc: CIC_PROJECT_STATE.md (state)
- Current phase: 18 (Parallel track, Observability)
- Tasks completed: Phases 1–4 (research, dashboard spec, vault extraction, RL mirror)
- Next: Items 5, 6, 8 (skills, graph, audit trail)
```

### Rule 3: Query Before Claiming
**When user asks:** "What's the status of the pipeline?"  
**Do NOT:** Assume from memory or prior conversation  
**Do:** Read CIC_PROJECT_STATE.md or query Prometheus for live state  
**Response:** "As of [timestamp], phase [X], [metric], next is [Y]"

### Rule 4: Memory as Bridge, Not Store
**Memory purpose:** Decode shorthand (nicknames, acronyms, internal jargon)  
**Not storage:** Don't use memory to cache query results; re-query each time

**Correct:**
```
# CLAUDE.md
"Shorthand: CIC = Cast Iron Charlie, RL = Rewrite Labs, 
 BOB = v1.1.0 LLM config, Phase 18 = Parallel Observability track"
```

**Incorrect:**
```
# CLAUDE.md
"CIC status: 400 docs harvested, 45K vectors, phase 18 at 60% complete"
← Don't store operational metrics in memory
```

### Rule 5: Vault as Single Source of Truth for Architecture
**Immutable by design:** cic-ref/ docs are synced from living source, never edited in vault.  
**Consequence:** If you need to change architecture, edit the living source first (Drive), then vault syncs.

**Workflow:**
1. User requests architecture change
2. Check: Is this a stable design change (months) or operational tweak (days)?
3. If stable → Add to CIC_SYSTEM.md (living doc) → Propose to vault on next sync
4. If operational → Add to CIC_PROJECT_STATE.md (living doc only, not vault)

---

## MEMORY AUDIT CHECKLIST

Before adding anything to CLAUDE.md, ask:

- [ ] **Is it stable?** Will this be true for 3+ months without updating?
- [ ] **Is it structural?** Does it describe system/project architecture, not current state?
- [ ] **Is it identity?** Does it define who Chris is or what he values?
- [ ] **Is it NOT a path/version/count?** If it's a file path, version number, or metric count → DON'T store
- [ ] **Would I want to remember this across all projects?** Or only within CIC+RL context?

**If any answer is NO or UNCLEAR → Store in vault or living docs instead.**

---

## LIVING DOCS STRUCTURE (Drive)

All volatile state lives in Google Drive / OneDrive in these files:

```
G:\My Drive\Cast Iron Charlie — Documentary Project\
├── CIC_SYSTEM.md                    ← System architecture (living source)
├── CIC_PROJECT_STATE.md             ← Current phase, tasks, blockers
├── REWRITE_LABS_SYSTEM.md           ← RL system architecture (living source)
├── REWRITE_LABS_STATE.md            ← RL phase, status, feedback
├── CIC_DAILY_LOG.md                 ← Day-by-day progress log (optional)
├── GOVERNANCE_AUDIT_LOG.md          ← When rules changed, what moved where
└── Research/
    ├── Daily Intake/                ← Raw documents
    ├── CIC_Processed/               ← Ingested documents
    └── ...
```

### CIC_PROJECT_STATE.md Format
```markdown
# CIC PROJECT STATE — Last Updated 2026-07-02 16:45 UTC

## Current Phase
- **Phase:** 18 (Parallel Observability Track)
- **Status:** In Progress
- **Started:** 2026-06-20
- **Estimated Completion:** 2026-07-10

## Completed Items (Phases 1–4)
1. ✅ Research Skill
2. ✅ Observability Dashboard Spec
3. ✅ Document Extraction (Vault Backlinks → System Map)
4. ✅ RL Vault Mirror

## In Progress
- [ ] Item 5: Skill Generator
- [ ] Item 6: Knowledge Graph
- [ ] Item 7: Memory + Vault Fusion
- [ ] Item 8: Audit Trail

## Blockers & Dependencies
- [Blocker 1] RL documentation source not confirmed (awaiting location)
- [Blocker 2] Qdrant cluster sizing (pending cost analysis)

## Metrics (Operational)
- Vault docs synced: 7 (CIC), 0 (RL pending)
- Pipeline ingestion: 2,400 docs harvested
- Skill registry: 6 skills active
- System map: Ready for validation

## Next Actions
- Confirm RL docs location (priority 1)
- Implement Item 5 (skill generator)
- Run system map validation (priority 2)
```

---

## QUERY PATTERNS (What Claude Should Do)

### Pattern 1: User Asks About Architecture
**User:** "How many adapters does CIC have?"  
**Claude:** Queries vault (cic-ref/BUILD-SUMMARY.md) → "5 adapters (Browser, Screenshot, Model, Anthropic, Puppeteer)"  
**Durability:** Stable answer; references vault structure

### Pattern 2: User Asks About Status
**User:** "What's the current extraction latency?"  
**Claude:** Queries Prometheus OR reads CIC_PROJECT_STATE.md (if offline) → "p95 = 245ms (real-time from metrics)"  
**Durability:** Transient; do NOT store in memory

### Pattern 3: User References Internal Acronym
**User:** "Is BOB ready?"  
**Claude:** Decodes from memory ("BOB = v1.1.0 LLM config in src/llm/") → Answers  
**Durability:** Stable; okay to store in CLAUDE.md

### Pattern 4: User Asks About Execution Plan
**User:** "What's our next priority?"  
**Claude:** Reads CIC_PROJECT_STATE.md (living doc) → "Item 5: Skill Generator (unstarted)"  
**Durability:** Volatile; references living doc, not memory

---

## MIGRATION CHECKLIST (If Updating Rules)

When these rules change, update in this order:
1. [ ] Update GOVERNANCE_AUDIT_LOG.md (document the change)
2. [ ] Review current CLAUDE.md against new rules
3. [ ] Move any volatile data from CLAUDE.md to living docs
4. [ ] Verify no paths/counts in CLAUDE.md
5. [ ] Test: Can Claude answer all 4 pattern types correctly?
6. [ ] Commit changes to vault (.github/workflows/memory-audit.yml)

---

## EXAMPLE: Item 2 Integration

### How Item 2 (Dashboard) Interacts with Governance

**Architecture stays in vault:**
```
cic-ref/CIC_RUNTIME_OBSERVABILITY_PLAN.md
├── Metrics schema (stable)
├── Grafana dashboard layout (stable)
└── Alert rule thresholds (stable)
```

**Operational state → Living docs:**
```
CIC_PROJECT_STATE.md
├── "Item 2: Observability Dashboard Spec — COMPLETE"
├── "Prometheus scrape interval: 5s"
├── "Current dashboard version: 1.0.0"
└── "Last validation: 2026-07-02 14:30"
```

**Query results → Memory during session only:**
```
In-session context:
"Item 2 dashboard has 3 panels, 6 queries, 4 alerts"
← Don't store this; query the spec on demand
```

---

## EXAMPLE: Item 3 Integration

### How Item 3 (System Map) Enforces Governance

**Vault structure:**
- System map itself lives as `system-map.json` in vault
- Shows stable architectural relationships

**Governance benefit:**
- Queries "Which skills read which docs?" → Answered from system map (stable)
- Queries "How many docs were processed today?" → Answered from living docs (volatile)
- System map **enforces the distinction** by design

**Memory stores:**
- "System map exists at C:\dev\system-map.json" ← stable, OK
- "Current graph has 24 nodes, 67 edges" ← volatile, query on demand

---

## EXAMPLE: Item 7 Integration (This Document)

**This governance framework itself:**
- Stored in vault as `GOVERNANCE_FRAMEWORK.md`
- Stable for months; operator-facing reference doc
- Copied to memory during session for quick lookup

**Application:**
- Every time Claude adds to CLAUDE.md, audit against table above
- Every time operator asks about state, query living docs first
- Never let operational counts leak into memory

---

## SUCCESS CRITERIA

✅ CLAUDE.md <500 lines (mostly identity + preferences, no state)  
✅ No file paths in CLAUDE.md (except vault root: C:\dev)  
✅ No timestamps in CLAUDE.md (except "synced on [quarterly date]")  
✅ No metric counts in CLAUDE.md (harvest counts, token usage, queue depth all live elsewhere)  
✅ Living docs updated daily (CIC_PROJECT_STATE.md, RL_STATE.md)  
✅ System map queries execute <100ms (not cached in memory, computed on-demand)  
✅ Governance audit log tracks every change to rules  

---

## IMPLEMENTATION STEPS

### Step 1: Audit Current CLAUDE.md (15 min)
- Read current CLAUDE.md
- Mark violations of governance rules (file paths, counts, timestamps)
- Move violations to living docs

### Step 2: Create Governance Audit Log (10 min)
- Create GOVERNANCE_AUDIT_LOG.md in Drive
- Record: "2026-07-02: Migrated vault sync timestamp from memory to 00-INDEX.md"

### Step 3: Update Living Docs Structure (20 min)
- Ensure CIC_PROJECT_STATE.md exists and is current
- Ensure REWRITE_LABS_STATE.md exists and is current
- Add frontmatter: "Last Updated: [timestamp]"

### Step 4: Integrate with Item 3 (System Map) (20 min)
- System map validator checks for CLAUDE.md violations
- Query: "Does system map reference any files stored in memory?"
- Answer: "No; all references are vault or live queries"

### Step 5: Document in Team Wiki (optional)
- Share this framework with team
- Link in onboarding docs

---

## ONGOING MAINTENANCE

**Weekly:**
- Spot-check CLAUDE.md for drift (no new operational data)

**Monthly:**
- Audit living docs for completeness
- Verify CIC_PROJECT_STATE.md updated at least weekly

**Quarterly:**
- Review governance rules (this doc)
- Update CLAUDE.md preferences if operator behavior changes
- Sync vault from living source

---

## QUICK REFERENCE: WHERE DOES IT GO?

```
┌─────────────────────────────────────────────────────────┐
│ QUESTION: Where should I store this information?         │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
    STABLE FOR >3MO?   STRUCTURAL?    IDENTITY/PREF?
       │ Yes               │ Yes            │ Yes
       ↓ No                ↓ No             ↓ No
       │                   │                │
    ┌──┴──┐          ┌─────┴────┐       ┌──┴──┐
    │     │          │          │       │     │
   VAULT  LIVE      VAULT      LIVE   MEMORY LIVE
   │      DOCS      │          DOCS    │      DOCS
   │      │         │          │       │      │
   ✓ CIC  │ Phase   ✓ System   │ Phase ✓ Role │ Status
   ✓ RL   │ Status   ✓ Design  │ Progress │ Prefs │ Tasks
   ✓ Arch │ Metrics  ✓ Patterns│ Queries  ✓ Skills │
   │      │         │          │       │ Style│
   └──────┘         └──────────┘       └─────┘
```

---

## REFERENCES

- **Governance Rules Table:** Section "Governance Table" above
- **Living Docs Structure:** Section "Living Docs Structure (Drive)" above
- **Query Patterns:** Section "Query Patterns (What Claude Should Do)" above
- **Audit Checklist:** Section "Memory Audit Checklist" above

