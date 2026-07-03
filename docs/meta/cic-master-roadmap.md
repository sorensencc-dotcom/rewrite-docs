# CIC Master Roadmap

## Work Summarizer v2 Upgrade — Stages 1–8

### Stage 1 ✅ — Migration & Baseline
- Migrated skill from `~/.claude/skills/work-summarizer-v2/` → `C:\dev\toolforge\skills\work-summarizer/`
- Zero behavior change; deterministic output validated
- Status: Complete, running live

### Stage 2 ✅ — Bug Fixes & Schema Versioning
- Fixed hardcoded `repo_deltas` (now wired to `analyzeRepoActivity()`)
- Fixed hardcoded `transcript_sessions_scanned` (now real count)
- Introduced `schema_version: "3.0.0"` for weekly-aggregator gating
- Status: Complete, monitoring for stable daily runs

### Stage 3 — Weekly Aggregator Schema Gating
- Add `schema_version` validation to `loadDailyReport()`
- Reject daily reports with `schema_version < 3` (returns `null`)
- Add mixed-version fixtures (`v2`, `v3`, malformed)
- Validate weekly force-rescan logic triggers correctly
- Enable gating only after several stable `v3` daily runs
- **Status:** Deferred until Stage 2 stabilizes (few real daily runs)

### Stage 4 — Drift-Term Tagging
- Extract drift terms from transcript chunks
- Tag subsystem impacts with drift categories
- Add drift-term aggregation to weekly summaries
- Add operator-facing drift-risk section
- **Depends on:** Stage 3
- **Questions:**
  - Drift taxonomy (predefined terms vs. LLM-extracted)?
  - Weekly aggregation strategy (merge/deduplicate drift signals)?

### Stage 5 — Operator Action Normalization
- Normalize LLM operator actions into action codes (deterministic mapping)
- Weekly aggregator groups actions by subsystem + frequency
- Emit Top-N actions per subsystem
- **Depends on:** Stage 3, Stage 7 (reasoning provider wired)
- **Questions:**
  - Action code taxonomy (static list or learned)?
  - Cardinality (how many distinct action codes)?
  - Conflict resolution (same subsystem, multiple actions)?

### Stage 6 — Cross-Repo Impact Severity Model
- Add severity scoring (0–3) based on dependency graph edges
- Daily: annotate cross-repo impacts with severity
- Weekly: aggregate severity trends
- Add hotspot detection (repeated high-severity impacts)
- **Depends on:** Stage 2 (repo_deltas + dependency graph already wired)
- **Questions:**
  - Severity formula (edge-weight only, or impact propagation)?
  - Hotspot threshold (how many repeats = hotspot)?
  - Weekly trend aggregation (raw counts vs. moving average)?

### Stage 7 — Claude Reasoning v2 (Provider-Agnostic)
- Claude as default provider (no-op from Stage 2; already implemented)
- Provider-agnostic `ReasoningProvider` interface (already exists)
- Add Ollama stub for future local inference
- Add `reasoningEnabled` toggle logic (already exists)
- Weekly aggregator uses reasoning when available
- **Depends on:** None (reasoning infrastructure already in Stage 2)
- **Questions:**
  - Ollama provider: minimum feature set (subsystem impacts only, or cross-repo)?
  - Weekly aggregator: fallback if reasoning unavailable at aggregation time?
  - Cost tracking: log reasoning spend per provider?

### Stage 8 — Weekly Report v2 (Operator-Grade)
- Add trend analysis (action frequency over time, drift signal curves)
- Add Top 5 Operator Actions (from Stage 5)
- Add Subsystems with Rising Risk (anomaly detection on trends)
- Add Cross-Repo Hotspots (from Stage 6)
- Add Recommended Operator Focus Areas (synthesis from above)
- Update report schema version to `"4.0.0"`
- **Depends on:** Stages 3, 4, 5, 6
- **Questions:**
  - Trend window (last 2 weeks, last month, or configurable)?
  - Rising-risk threshold (z-score, % change, absolute delta)?
  - Focus area synthesis: rule-based or LLM-driven?
  - Slack notification format (full weekly report or summary card)?

---

## Implementation Strategy

**Current Phase:** Stages 1–2 live, Stage 3 under monitoring (few real daily runs)

**Next Phase:** Stage 3 (schema gating validation + tests)

**Execution Order:** 3 → 4 → 5 → 6 → 7 → 8 (staged rollout with canary gates per existing governance)

**Risk Mitigations:**
- Each stage can ship independently; later stages add to existing schema, not replace it
- Weekly aggregation degrades gracefully if any stage's data unavailable
- Reasoning provider is additive; fallback templates ensure weekly report always generates

---

## 🔒 Locked Decisions (2026-07-03)

### 1. Drift Taxonomy (Stage 4) — LOCKED

Fixed enum + LLM secondary labels (metadata only, not gating).

```json
{
  "primary": ["schema-change", "perf-regression", "test-failure", "deprecation", "routing-drift", "ingestion-drift", "observability-gap"],
  "secondary": "free-form LLM tags (metadata, not scoring)"
}
```

### 2. Action Codes (Stage 5) — LOCKED

Static deterministic table. LLM outputs map to codes; no auto-growing registry.

```json
{
  "adopt": 1,
  "rollback": 2,
  "investigate": 3,
  "defer": 4,
  "monitor": 5,
  "escalate": 6
}
```

### 3. Severity Propagation (Stage 6) — LOCKED

Each edge independent; severity attenuates along chain (no cascade escalation).

- A→B high severity does NOT force B→C high
- B→C gets medium at most, unless B itself impacted

### 4. Ollama Provider Scope (Stage 7) — LOCKED

Match Claude schema exactly. Initially impl `subsystem_impacts` only; stub rest.

- Contract: same `ReasoningOutput` shape
- MVP: `subsystem_impacts`; others empty or minimal

### 5. Trend Window (Stage 8) — LOCKED

Fixed 4-week window (last 4 weekly reports); operator-configurable override later via env/config.

- Baseline: average over previous 3 weeks
- Rising risk: current ≥ 2× baseline

### 6. Rising-Risk Detection (Stage 8) — LOCKED

Simple % change threshold rule: activity/severity > 2× baseline.

- Advanced methods (z-score, Tukey fences) deferred
- Explainable + fast

### 7. Weekly Report Consumers — LOCKED

All three, staged:

1. Slack notification + channel post (immediate)
2. Dashboard display new section (follow-up)
3. Automated alerts to oncall (high/critical severity only)

---

## Implementation Readiness

**Status:** All 7 design decisions locked. Ready for Stage 3+ implementation sprints.

**Preconditions for Stage 3 build:**
- Wait for Stage 2 (schema v3.0.0) to stabilize (few real daily runs monitored)
- No new design decisions needed until Stage 4+
