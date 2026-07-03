---
title: "Work Summarizer Implementation Guide"
summary: "# Work Summarizer v2 Upgrade — Implementation Guide (Stages 3–8)"
created: "2026-07-03T19:43:45.953Z"
updated: "2026-07-03T19:43:45.953Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Work Summarizer v2 Upgrade — Implementation Guide (Stages 3–8)

**Target audience:** Builder agent or developer implementing Stages 3–8

**Precondition:** Stages 1–2 live and stable (schema v3.0.0, repo_deltas + sessions_scanned wired)

---

## Stage 3 — Weekly Aggregator Schema Gating

### Contract

**File:** `src/weekly-aggregator.ts` → Update `loadDailyReport()`

```typescript
export interface DailyReportV3 {
  schema_version: "3.0.0" | "4.0.0"; // Accept both during transition
  // ... existing fields
}

export function loadDailyReport(filePath: string): DailyReportV3 | null {
  // NEW: If schema_version < 3, return null (triggers force-rescan in caller)
  // EXISTING: Parse JSON, validate shape
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const version = raw.schema_version ? parseInt(raw.schema_version.split('.')[0]) : 0;
    if (version < 3) return null; // Reject old schemas
    return raw as DailyReportV3;
  } catch {
    return null;
  }
}
```

### Files Touched

- `src/weekly-aggregator.ts` — Add schema_version check to `loadDailyReport()`
- `src/schema.ts` (existing) — Already defines `schema_version: "3.0.0"`

### Tests

**File:** `tests/weekly-aggregator.test.ts` (new or extend existing)

```typescript
describe("loadDailyReport schema gating", () => {
  test("accepts schema v3.0.0", () => {
    const v3Report = { schema_version: "3.0.0", /* ... */ };
    expect(loadDailyReport(v3Path)).toBeDefined();
  });

  test("accepts schema v4.0.0", () => {
    const v4Report = { schema_version: "4.0.0", /* ... */ };
    expect(loadDailyReport(v4Path)).toBeDefined();
  });

  test("rejects schema v2.0.0 (returns null)", () => {
    const v2Report = { schema_version: "2.0.0", /* ... */ };
    expect(loadDailyReport(v2Path)).toBeNull();
  });

  test("rejects malformed schema (returns null)", () => {
    expect(loadDailyReport(malformedPath)).toBeNull();
  });

  test("weekly aggregator force-rescans when loadDailyReport returns null", () => {
    const agg = aggregateDailyReports(outputDir, "weekly");
    // Mix of v2 and v3 reports → shouldFullRescan() returns true
    expect(shouldFullRescan(agg)).toBe(true);
  });
});
```

### Test Fixtures

Create in `tests/fixtures/`:
- `daily-report-v2.0.0.json` (old schema, missing repo_deltas.active_subsystems)
- `daily-report-v3.0.0.json` (current, has repo_deltas.active_subsystems)
- `daily-report-v4.0.0.json` (future, has drift_terms + action_codes)
- `daily-report-malformed.json` (invalid JSON)

### Success Criteria

- `loadDailyReport()` returns `null` for schema < 3
- Mixed v2/v3 reports in output dir trigger `shouldFullRescan()` → `true`
- All unit tests pass
- Manual test: seed output dir with old v2 report, run weekly mode → verifies force-rescan behavior

---

## Stage 4 — Drift-Term Tagging

### Contract

**Files:** `src/drift-detector.ts` + `src/schema.ts`

```typescript
// In schema.ts
export interface DriftSignal {
  type: "transcript" | "activity" | "none";
  count: number;
  score: number;
  files: string[];
  sessions_scanned?: number;
  drift_terms?: Array<{
    term: string;           // "schema-change", "perf-regression", etc.
    frequency: number;      // How many times extracted
    associated_files: string[];
    severity: "low" | "medium" | "high";
  }>;
}

export interface SubsystemImpact {
  subsystem: string;
  impact_summary: string;
  operator_actions: string[];
  drift_tags?: string[];     // NEW: Primary drift categories for this subsystem
}

// Locked taxonomy (from decision #1)
export const DRIFT_TAXONOMY = [
  "schema-change",
  "perf-regression",
  "test-failure",
  "deprecation",
  "routing-drift",
  "ingestion-drift",
  "observability-gap"
];
```

**Function:** `extractDriftTerms()`

```typescript
// In drift-detector.ts
export function extractDriftTerms(
  transcriptChunks: string[],
  taxonomy: string[] = DRIFT_TAXONOMY
): DriftSignal['drift_terms'] {
  const terms: Map<string, number> = new Map();
  
  for (const chunk of transcriptChunks) {
    for (const term of taxonomy) {
      // Simple keyword matching (future: LLM extraction)
      const regex = new RegExp(`\\b${term.replace(/-/g, '[-\\s]')}\\b`, 'gi');
      const matches = chunk.match(regex);
      if (matches) {
        terms.set(term, (terms.get(term) || 0) + matches.length);
      }
    }
  }
  
  return Array.from(terms.entries()).map(([term, freq]) => ({
    term,
    frequency: freq,
    associated_files: [],  // Filled by caller
    severity: freq >= 5 ? "high" : freq >= 2 ? "medium" : "low"
  }));
}
```

### Files Touched

- `src/schema.ts` — Add `DRIFT_TAXONOMY`, extend `DriftSignal`, update `SubsystemImpact`
- `src/drift-detector.ts` — Add `extractDriftTerms()` function
- `src/index.ts` — Call `extractDriftTerms()` when `driftSignal` computed (line ~173)

### Tests

**File:** `tests/drift-detector.test.ts` (extend existing)

```typescript
describe("extractDriftTerms", () => {
  test("extracts primary drift terms from transcript chunks", () => {
    const chunks = ["schema-change detected in migration", "another chunk"];
    const terms = extractDriftTerms(chunks);
    expect(terms).toContainEqual(
      expect.objectContaining({ term: "schema-change", frequency: expect.any(Number) })
    );
  });

  test("assigns severity based on frequency", () => {
    const chunks = ["schema-change".repeat(10)];
    const terms = extractDriftTerms(chunks);
    expect(terms[0].severity).toBe("high"); // freq >= 5
  });

  test("ignores terms outside taxonomy", () => {
    const chunks = ["made-up-term everywhere"];
    const terms = extractDriftTerms(chunks);
    expect(terms.length).toBe(0);
  });
});
```

### Integration Point

In `index.ts` (run function):

```typescript
// After driftSignal = scanTranscriptsForDrift(...)
const driftTerms = extractDriftTerms(
  driftSignal.files.map(f => readFileSync(f, 'utf-8'))
);
driftSignal.drift_terms = driftTerms;

// Later, in report construction:
report.drift_signals = {
  type: driftSignal.type,
  count: driftSignal.count,
  score: driftScore,
  drift_terms: driftSignal.drift_terms, // NEW
  summary: summarizeDriftSignals(driftSignal)
};
```

### Success Criteria

- `extractDriftTerms()` extracts fixed taxonomy terms from transcripts
- Severity assigned correctly (0–2 → low, 2–5 → medium, ≥5 → high)
- Weekly aggregator includes `drift_terms` in aggregated report
- All unit tests pass
- Manual test: run with sample transcripts, confirm drift_terms appear in JSON output

---

## Stage 5 — Operator Action Normalization

### Contract

**Files:** `src/schema.ts` + `src/action-normalizer.ts` (new)

```typescript
// In schema.ts
export const ACTION_CODES = {
  adopt: 1,
  rollback: 2,
  investigate: 3,
  defer: 4,
  monitor: 5,
  escalate: 6
} as const;

export type ActionCode = typeof ACTION_CODES[keyof typeof ACTION_CODES];

export interface OperatorAction {
  code: ActionCode;
  subsystem: string;
  description: string;
  reasoning: string;
}

export interface SubsystemImpact {
  subsystem: string;
  impact_summary: string;
  operator_actions: string[]; // Human prose from LLM
  normalized_actions?: OperatorAction[]; // NEW: Deterministic codes
}
```

**Function:** `normalizeActionToCode()` (new file: `src/action-normalizer.ts`)

```typescript
import { ACTION_CODES, ActionCode } from "./schema.js";

const ACTION_KEYWORDS: Record<string, ActionCode> = {
  // adopt keywords
  "adopt": 1, "apply": 1, "enable": 1, "deploy": 1, "use": 1,
  // rollback keywords
  "rollback": 2, "revert": 2, "undo": 2, "reverse": 2,
  // investigate keywords
  "investigate": 3, "examine": 3, "debug": 3, "analyze": 3, "look into": 3,
  // defer keywords
  "defer": 4, "postpone": 4, "skip": 4, "delay": 4, "later": 4,
  // monitor keywords
  "monitor": 5, "watch": 5, "track": 5, "observe": 5,
  // escalate keywords
  "escalate": 6, "alert": 6, "notify": 6, "inform": 6
};

export function normalizeActionToCode(prose: string): ActionCode | null {
  const lower = prose.toLowerCase();
  for (const [keyword, code] of Object.entries(ACTION_KEYWORDS)) {
    if (lower.includes(keyword)) return code;
  }
  return null; // Unknown action
}

export function normalizeActions(
  operatorProseActions: string[],
  subsystem: string
): OperatorAction[] {
  return operatorProseActions
    .map(prose => {
      const code = normalizeActionToCode(prose);
      return code !== null ? {
        code,
        subsystem,
        description: prose.slice(0, 100), // Truncate
        reasoning: ""
      } : null;
    })
    .filter((a): a is OperatorAction => a !== null);
}
```

### Files Touched

- `src/schema.ts` — Add `ACTION_CODES` enum, `OperatorAction` interface
- `src/action-normalizer.ts` (new) — Add `normalizeActionToCode()`, `normalizeActions()`
- `src/index.ts` — After LLM reasoning, normalize actions (line ~250, in synthesis fallback)

### Tests

**File:** `tests/action-normalizer.test.ts` (new)

```typescript
describe("normalizeActionToCode", () => {
  test("maps adopt keywords to code 1", () => {
    expect(normalizeActionToCode("apply this change")).toBe(1);
    expect(normalizeActionToCode("deploy immediately")).toBe(1);
  });

  test("maps rollback keywords to code 2", () => {
    expect(normalizeActionToCode("revert this")).toBe(2);
  });

  test("returns null for unknown action", () => {
    expect(normalizeActionToCode("do something mysterious")).toBeNull();
  });
});

describe("normalizeActions", () => {
  test("normalizes array of prose actions", () => {
    const prose = ["apply change", "investigate issue", "unknown thing"];
    const normalized = normalizeActions(prose, "api");
    expect(normalized).toHaveLength(2);
    expect(normalized[0].code).toBe(1); // adopt
    expect(normalized[1].code).toBe(3); // investigate
  });
});
```

### Integration Point

In `index.ts`, after LLM synthesis or fallback:

```typescript
// If reasoning produced actions, normalize them
if (synthesis?.subsystem_impacts) {
  for (const impact of synthesis.subsystem_impacts) {
    impact.normalized_actions = normalizeActions(
      impact.operator_actions,
      impact.subsystem
    );
  }
}
```

### Success Criteria

- All 6 action codes have keyword mappings
- `normalizeActionToCode()` correctly maps prose to code
- Weekly aggregator groups actions by subsystem + code, counts frequency
- All unit tests pass
- Manual test: LLM generates prose actions, verify normalized_actions appear in report

---

## Stage 6 — Cross-Repo Impact Severity Model

### Contract

**Files:** `src/schema.ts` + `src/severity-scorer.ts` (new)

```typescript
// In schema.ts
export interface CrossRepoImpact {
  source_category: string;
  affected_categories: string[];
  impact_summary: string;
  recommended_actions: string[];
  severity?: 0 | 1 | 2 | 3; // NEW: 0=none, 1=low, 2=medium, 3=high
  // Only set if source is active AND has dependency on affected
}

export interface DependencyEdge {
  source: string;
  target: string;
  weight: 1 | 2 | 3; // 1=weak, 2=moderate, 3=strong
}

export const DEPENDENCY_GRAPH: DependencyEdge[] = [
  // Examples (these are placeholder; fill based on actual CIC topology)
  { source: "api", target: "ingestion", weight: 3 },
  { source: "ingestion", target: "qdrant-index", weight: 2 },
  { source: "dashboard", target: "api", weight: 2 },
  // ... 10+ more edges defining subsystem relationships
];
```

**Function:** `computeSeverity()` (new file: `src/severity-scorer.ts`)

```typescript
import { DependencyEdge, DEPENDENCY_GRAPH } from "./schema.js";

export function computeSeverity(
  sourceActive: boolean,
  sourceActivityLevel: "low" | "medium" | "high",
  targetActive: boolean,
  edgeWeight: 1 | 2 | 3
): 0 | 1 | 2 | 3 {
  if (!sourceActive) return 0;
  if (!targetActive) return 0;

  // Edge weight + activity level → severity
  const levelScore = sourceActivityLevel === "high" ? 3 : sourceActivityLevel === "medium" ? 2 : 1;
  const combined = edgeWeight + levelScore;

  // 2–3 → low, 4–5 → medium, 6+ → high
  if (combined >= 6) return 3;
  if (combined >= 4) return 2;
  return 1;
}

export function validateGraphIntegrity(
  graph: DependencyEdge[],
  validSubsystems: string[]
): boolean {
  for (const edge of graph) {
    if (!validSubsystems.includes(edge.source)) {
      console.error(`Invalid source in graph: ${edge.source}`);
      return false;
    }
    if (!validSubsystems.includes(edge.target)) {
      console.error(`Invalid target in graph: ${edge.target}`);
      return false;
    }
  }
  return true;
}
```

### Files Touched

- `src/schema.ts` — Add `DEPENDENCY_GRAPH`, update `CrossRepoImpact` with `severity` field
- `src/severity-scorer.ts` (new) — Add `computeSeverity()`, `validateGraphIntegrity()`
- `src/dependency-graph.ts` (existing) — Call `validateGraphIntegrity()` at startup
- `src/index.ts` — Compute severity for each cross-repo impact (line ~183)

### Tests

**File:** `tests/severity-scorer.test.ts` (new)

```typescript
describe("computeSeverity", () => {
  test("returns 0 if source not active", () => {
    expect(computeSeverity(false, "high", true, 3)).toBe(0);
  });

  test("returns high (3) for active source + high activity + strong edge", () => {
    expect(computeSeverity(true, "high", true, 3)).toBe(3);
  });

  test("returns medium (2) for active source + medium activity + strong edge", () => {
    expect(computeSeverity(true, "medium", true, 3)).toBe(2);
  });

  test("attenuates: high source but weak target impact", () => {
    expect(computeSeverity(true, "high", true, 1)).toBeLessThan(3);
  });
});

describe("validateGraphIntegrity", () => {
  test("accepts valid graph", () => {
    const graph = [{ source: "api", target: "db", weight: 2 }];
    const valid = ["api", "db", "cache"];
    expect(validateGraphIntegrity(graph, valid)).toBe(true);
  });

  test("rejects graph with invalid source", () => {
    const graph = [{ source: "unknown", target: "db", weight: 2 }];
    const valid = ["api", "db"];
    expect(validateGraphIntegrity(graph, valid)).toBe(false);
  });
});
```

### Integration Point

In `index.ts`, compute cross-repo impacts with severity:

```typescript
const crossImpacts = getCrossImpact(activeCategories);
const crossImpactsWithSeverity = crossImpacts.map(impact => {
  const edge = DEPENDENCY_GRAPH.find(
    e => e.source === impact.source_category && 
         e.target === impact.affected_categories[0]
  );
  const severity = computeSeverity(
    true, // source is active (we already filtered)
    workByCategory[impact.source_category] > 10 ? "high" : "medium",
    workByCategory[impact.affected_categories[0]] > 0,
    edge?.weight || 1
  );
  return { ...impact, severity };
});
```

### Success Criteria

- `DEPENDENCY_GRAPH` defined with 10+ edges for real subsystems
- `validateGraphIntegrity()` passes at startup
- Severity computed correctly for each cross-repo impact
- Severity attenuates for downstream impacts (A→B high does NOT force B→C high)
- All unit tests pass
- Manual test: seed high-activity subsystem, verify severity computed correctly in report

---

## Stage 7 — Claude Reasoning v2 (Provider-Agnostic)

### Contract

**Files:** `src/schema.ts` + `src/providers/` (existing structure, extend)

```typescript
// In schema.ts
export interface ReasoningProvider {
  synthesize(input: SynthesisInput): Promise<ReasoningOutput>;
  name: string;
}

export interface SynthesisInput {
  period: "daily" | "weekly";
  subsystemContexts: Array<{
    subsystem: string;
    files: string[];
    repos: string[];
    impactLevel: "low" | "medium" | "high";
  }>;
  dependencyGraph: Record<string, string[]>;
  driftSignals: Array<{ signalType: string; count: number; score: number }>;
}

export interface ReasoningOutput {
  subsystem_impacts: SubsystemImpact[];
  cross_repo_impacts: CrossRepoImpact[];
  notable_changes: Array<{ title: string; description: string; risk_level: "low" | "medium" | "high" }>;
  risks_or_followups: Array<{ area: string; risk_summary: string; recommended_next_steps: string[] }>;
  transcript_excerpts: Array<{ source: string; timestamp: string; reasoning_summary: string }>;
  message: string;
}
```

**Stub:** `src/providers/ollama-provider.ts` (new)

```typescript
import { ReasoningProvider, SynthesisInput, ReasoningOutput } from "../schema.js";

export class OllamaProvider implements ReasoningProvider {
  name = "ollama";
  
  constructor(private baseUrl: string = "http://localhost:11434") {}

  async synthesize(input: SynthesisInput): Promise<ReasoningOutput> {
    // MVP: Only implement subsystem_impacts; stub others
    const subsystemImpacts = input.subsystemContexts.map(ctx => ({
      subsystem: ctx.subsystem,
      impact_summary: `Analyzed ${ctx.files.length} files across ${ctx.repos.length} repos`,
      operator_actions: ["investigate"],
      normalized_actions: []
    }));

    return {
      subsystem_impacts: subsystemImpacts,
      cross_repo_impacts: [], // Stubbed for now
      notable_changes: [],
      risks_or_followups: [],
      transcript_excerpts: [],
      message: "Ollama inference (MVP)"
    };
  }
}
```

### Files Touched

- `src/schema.ts` — Confirm `ReasoningProvider` interface (already exists from Stage 2)
- `src/providers/ollama-provider.ts` (new) — Add Ollama stub
- `src/index.ts` — Already has logic to select provider; no changes needed

### Tests

**File:** `tests/providers/ollama-provider.test.ts` (new)

```typescript
describe("OllamaProvider", () => {
  test("implements ReasoningProvider interface", () => {
    const provider = new OllamaProvider();
    expect(provider.name).toBe("ollama");
    expect(typeof provider.synthesize).toBe("function");
  });

  test("returns stub output for MVP (subsystem_impacts only)", async () => {
    const provider = new OllamaProvider();
    const output = await provider.synthesize({
      period: "daily",
      subsystemContexts: [{ subsystem: "api", files: ["a.ts"], repos: ["dev"], impactLevel: "high" }],
      dependencyGraph: {},
      driftSignals: []
    });
    expect(output.subsystem_impacts).toHaveLength(1);
    expect(output.cross_repo_impacts).toHaveLength(0);
  });
});
```

### Success Criteria

- `OllamaProvider` implements `ReasoningProvider` interface
- MVP returns subsystem_impacts; others empty
- Contract matches Claude provider
- All unit tests pass
- Future: replace stub with real Ollama API calls

---

## Stage 8 — Weekly Report v2 (Operator-Grade)

### Contract

**Files:** `src/schema.ts` + `src/weekly-reporter.ts` (new)

```typescript
// In schema.ts
export interface WeeklyReportV4 extends DailyReport {
  schema_version: "4.0.0";
  
  // Trend analysis (new)
  trend_analysis?: {
    action_frequency: Record<ActionCode, number>; // Aggregated action codes over window
    drift_signal_trend: Array<{ week: string; signal_count: number; avg_score: number }>;
    subsystem_activity_trend: Record<string, number[]>; // Activity per subsystem over 4 weeks
  };
  
  // Top actions (new)
  top_operator_actions?: Array<{
    action_code: ActionCode;
    subsystems: string[];
    frequency: number;
    last_applied: string; // ISO date
  }>;
  
  // Rising risk subsystems (new)
  rising_risk_subsystems?: Array<{
    subsystem: string;
    risk_score: number;
    trend: "rising" | "stable" | "declining";
    recent_activity: number;
    baseline_activity: number;
  }>;
  
  // Cross-repo hotspots (new)
  cross_repo_hotspots?: Array<{
    source_category: string;
    affected_categories: string[];
    severity: 0 | 1 | 2 | 3;
    frequency: number; // How many weeks did this impact occur?
    recommended_focus: string;
  }>;
  
  // Operator focus areas (new, synthesized)
  operator_focus_areas?: string[];
}
```

**Function:** `computeWeeklyAnalysis()` (new file: `src/weekly-reporter.ts`)

```typescript
import { DailyReportV3, WeeklyReportV4, ActionCode } from "./schema.js";

export interface TrendWindow {
  current: DailyReportV3;
  previous: DailyReportV3[]; // Last 3 weeks (4 total + current)
}

export function computeRisingRisk(
  subsystem: string,
  currentActivity: number,
  previousActivity: number[]
): { trend: "rising" | "stable" | "declining"; risk_score: number } {
  const baseline = previousActivity.reduce((a, b) => a + b, 0) / previousActivity.length;
  const current = currentActivity;
  const percentChange = baseline > 0 ? (current - baseline) / baseline : 0;

  let trend: "rising" | "stable" | "declining";
  if (percentChange >= 1) {
    trend = "rising";
  } else if (percentChange <= -0.3) {
    trend = "declining";
  } else {
    trend = "stable";
  }

  // Risk = 2× baseline threshold
  const riskScore = current >= 2 * baseline ? 3 : current > baseline ? 2 : 1;

  return { trend, risk_score: riskScore };
}

export function computeWeeklyAnalysis(window: TrendWindow): Partial<WeeklyReportV4> {
  const current = window.current;
  const previous = window.previous;

  // 1. Trend analysis: action frequency
  const actionFrequency: Record<ActionCode, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };
  for (const report of [current, ...previous]) {
    for (const impact of report.subsystem_impacts || []) {
      for (const action of impact.normalized_actions || []) {
        actionFrequency[action.code] += 1;
      }
    }
  }

  // 2. Rising risk subsystems
  const risingRisk = [];
  for (const [subsystem, currentCount] of Object.entries(current.work_by_category)) {
    const previousCounts = previous.map(r => r.work_by_category[subsystem] || 0);
    const { trend, risk_score } = computeRisingRisk(subsystem, currentCount, previousCounts);
    if (trend === "rising" || risk_score >= 2) {
      risingRisk.push({
        subsystem,
        risk_score,
        trend,
        recent_activity: currentCount,
        baseline_activity: previousCounts.reduce((a, b) => a + b, 0) / previousCounts.length
      });
    }
  }

  // 3. Top operator actions (by frequency)
  const topActions = Object.entries(actionFrequency)
    .filter(([_, freq]) => freq > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, freq]) => ({
      action_code: parseInt(code) as ActionCode,
      subsystems: Array.from(new Set(
        [current, ...previous]
          .flatMap(r => (r.subsystem_impacts || [])
            .filter(i => (i.normalized_actions || []).some(a => a.code === parseInt(code)))
            .map(i => i.subsystem))
      )),
      frequency: freq,
      last_applied: current.generated_at
    }));

  return {
    trend_analysis: {
      action_frequency: actionFrequency,
      drift_signal_trend: [],  // TODO: aggregate drift signals from weekly
      subsystem_activity_trend: {}  // TODO: build activity curves
    },
    top_operator_actions: topActions,
    rising_risk_subsystems: risingRisk,
    cross_repo_hotspots: current.cross_repo_impacts?.filter(i => i.severity >= 2),
    operator_focus_areas: risingRisk.map(r => `${r.subsystem} (risk: ${r.trend})`)
  };
}
```

### Files Touched

- `src/schema.ts` — Add `WeeklyReportV4` interface
- `src/weekly-reporter.ts` (new) — Add `computeWeeklyAnalysis()`, `computeRisingRisk()`
- `src/weekly-aggregator.ts` — Call `computeWeeklyAnalysis()` when aggregating multiple daily reports

### Tests

**File:** `tests/weekly-reporter.test.ts` (new)

```typescript
describe("computeRisingRisk", () => {
  test("detects rising trend (2x baseline)", () => {
    const { trend, risk_score } = computeRisingRisk("api", 20, [5, 5, 5]);
    expect(trend).toBe("rising");
    expect(risk_score).toBe(3);
  });

  test("detects declining trend", () => {
    const { trend, risk_score } = computeRisingRisk("api", 2, [10, 10, 10]);
    expect(trend).toBe("declining");
  });

  test("detects stable trend", () => {
    const { trend, risk_score } = computeRisingRisk("api", 5, [5, 5, 5]);
    expect(trend).toBe("stable");
  });
});

describe("computeWeeklyAnalysis", () => {
  test("aggregates action frequency across window", () => {
    const window = { /* ... mock TrendWindow ... */ };
    const analysis = computeWeeklyAnalysis(window);
    expect(analysis.trend_analysis?.action_frequency).toBeDefined();
  });

  test("identifies top 5 operator actions", () => {
    const window = { /* ... */ };
    const analysis = computeWeeklyAnalysis(window);
    expect(analysis.top_operator_actions?.length).toBeLessThanOrEqual(5);
  });

  test("flags rising risk subsystems", () => {
    const window = { /* ... */ };
    const analysis = computeWeeklyAnalysis(window);
    expect(analysis.rising_risk_subsystems?.length).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Point

In `index.ts`, when mode === "weekly":

```typescript
// After aggregateDailyReports() succeeds
const trendWindow: TrendWindow = {
  current: aggregatedReport,
  previous: loadPreviousDailyReports(outputDir, 3) // Last 3 weeks
};

const weeklyAnalysis = computeWeeklyAnalysis(trendWindow);

// Merge into final report
const report: WeeklyReportV4 = {
  ...aggregatedReport,
  schema_version: "4.0.0", // Bump version
  ...weeklyAnalysis
};
```

### Slack Notification Format

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "📊 Weekly Work Summary"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Top Actions*\n• Investigate (3 subsystems, 8 times)\n• Monitor (2 subsystems, 5 times)"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Rising Risk*\n🔴 API: 2.5x baseline (high)"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Recommended Focus*\n→ API subsystem (rising risk)\n→ Ingestion drifts (cross-repo impact)"
      }
    }
  ]
}
```

### Success Criteria

- `WeeklyReportV4` schema includes trend, top actions, rising risk, hotspots, focus areas
- `computeWeeklyAnalysis()` correctly aggregates 4-week window
- Rising risk detected at 2× baseline threshold
- Top 5 actions ranked by frequency
- Slack notification displays summary (not full report)
- Dashboard can render new fields without errors
- All unit tests pass
- Manual test: run weekly mode with 4+ daily reports, verify all new sections populated

---

## Implementation Order & Rollout

**Sequential:**
1. Stage 3 (schema gating) → stable daily runs (few days)
2. Stage 4 (drift terms) → canary
3. Stage 5 (action codes) → canary (depends on Stage 4 + reasoning already wired)
4. Stage 6 (severity model) → canary (independent)
5. Stage 7 (Ollama stub) → canary (independent, non-blocking)
6. Stage 8 (weekly v2) → full (depends on 3–6)

**Gating:** Use existing canary → full promotion per governance playbook.

**Monitoring:**
- Action code coverage (% of LLM actions normalized)
- Severity distribution (are impacts being scored across full range?)
- Weekly report Slack CTR (operator engagement)
- Rising-risk false-positive rate (are alerts actionable?)

