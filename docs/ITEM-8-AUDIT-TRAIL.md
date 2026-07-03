# ITEM 8: AUDIT TRAIL
**Date:** 2026-07-02  
**Purpose:** Track doc changes + correlate with CIC events  
**Status:** Implementation-ready

---

## OBJECTIVE

Build an immutable audit trail that answers:
- **Compliance:** "What changed in Phase 18?"
- **Debugging:** "When did BUILD-SUMMARY last change? What was the diff?"
- **Correlation:** "Did X change before or after Y?"
- **Impact:** "This doc changed → did the system break?"

Integrates vault history + CIC pipeline events + metrics into a queryable audit log.

---

## AUDIT LOG STRUCTURE

```
Audit Event
├── timestamp: ISO 8601
├── actor: "Claude" | "Operator" | "System"
├── action: "doc_modified" | "skill_created" | "phase_started" | "metric_spike"
├── subject: {doc_id | skill_id | phase_id | metric_name}
├── details: {before, after, reason, diff_lines}
├── correlation_id: "phase-18-start-2026-06-20"
├── severity: "info" | "warning" | "critical"
├── source: "vault_sync" | "manual_edit" | "pipeline_event" | "metrics"
└── tags: ["production", "manual-review-required", "cost-impact"]
```

---

## EVENT TYPES

### Type 1: Document Events

**event: doc_modified**
```json
{
  "timestamp": "2026-07-02T10:42:39Z",
  "actor": "vault_sync_daemon",
  "action": "doc_modified",
  "subject": "cic-ref/OBSERVABILITY_PLAN.md",
  "details": {
    "before_hash": "sha256:abc123",
    "after_hash": "sha256:def456",
    "lines_changed": 12,
    "sections_modified": ["PROMETHEUS_CONFIGURATION", "ALERT_RULES"],
    "diff_sample": ["- retention: 5d", "+ retention: 7d"]
  },
  "severity": "info",
  "source": "vault_sync",
  "tags": ["observability", "infra"]
}
```

**event: doc_created**
```json
{
  "timestamp": "2026-07-02T16:45:00Z",
  "actor": "Claude",
  "action": "doc_created",
  "subject": "cic-ref/PHASE-18-SYNTHESIS.md",
  "details": {
    "lines": 245,
    "sections": ["Summary", "Metrics", "Lessons Learned"],
    "reason": "End-of-phase documentation"
  },
  "severity": "info",
  "source": "manual_edit"
}
```

**event: doc_archived**
```json
{
  "timestamp": "2026-07-02T12:00:00Z",
  "actor": "Operator",
  "action": "doc_archived",
  "subject": "cic-ref/OLD-AGENT-SPEC.md",
  "details": {
    "reason": "Superseded by AGENTS.md",
    "moved_to": "_archive/OLD-AGENT-SPEC.md",
    "last_modified": "2026-06-15"
  },
  "severity": "warning",
  "tags": ["deprecation"]
}
```

### Type 2: Skill Events

**event: skill_created**
```json
{
  "timestamp": "2026-07-02T16:50:00Z",
  "actor": "Claude",
  "action": "skill_created",
  "subject": "cic-env-validator",
  "details": {
    "type": "validator",
    "reads_docs": ["cic-ref/CIC_ENV_REFERENCE.md"],
    "triggers": ["env check", "validate environment"],
    "version": "1.0.0",
    "maturity": "alpha"
  },
  "severity": "info",
  "source": "skill_generator",
  "tags": ["automation", "phase-5"]
}
```

**event: skill_tested**
```json
{
  "timestamp": "2026-07-02T17:00:00Z",
  "actor": "test_runner",
  "action": "skill_tested",
  "subject": "cic-env-validator",
  "details": {
    "test_count": 5,
    "passed": 5,
    "failed": 0,
    "coverage": 0.94,
    "duration_ms": 450
  },
  "severity": "info",
  "source": "automation"
}
```

### Type 3: Phase Events

**event: phase_started**
```json
{
  "timestamp": "2026-06-20T00:00:00Z",
  "actor": "Operator",
  "action": "phase_started",
  "subject": "phase-18",
  "details": {
    "name": "Parallel Observability Track",
    "duration_hours": 3,
    "goals": ["Prometheus metrics", "Grafana dashboards", "Alert rules"],
    "docs_touched": ["OBSERVABILITY_PLAN", "BUILD-SUMMARY"]
  },
  "severity": "info",
  "source": "manual_event",
  "tags": ["phase-change", "production-impact"]
}
```

**event: phase_completed**
```json
{
  "timestamp": "2026-07-02T16:45:00Z",
  "actor": "Operator",
  "action": "phase_completed",
  "subject": "phase-18",
  "details": {
    "duration_actual_hours": 2.75,
    "status": "complete",
    "issues": 0,
    "blockers_resolved": ["Qdrant cluster sizing"],
    "deliverables": [
      "ITEM-2-OBSERVABILITY-DASHBOARD-SPEC",
      "ITEM-3-VAULT-EXTRACTION-SYSTEM-MAP",
      "ITEM-7-MEMORY-GOVERNANCE-FRAMEWORK"
    ]
  },
  "severity": "info",
  "source": "manual_event"
}
```

### Type 4: Metric Events

**event: metric_spike_detected**
```json
{
  "timestamp": "2026-07-02T14:30:00Z",
  "actor": "alerting_system",
  "action": "metric_spike_detected",
  "subject": "cic_adapter_duration_ms",
  "details": {
    "metric": "cic_adapter_duration_ms",
    "p95_value": 1250,
    "threshold": 500,
    "duration_minutes": 2,
    "affected_adapters": ["BrowserNavigate"],
    "root_cause": "Unknown (requires investigation)"
  },
  "severity": "warning",
  "source": "metrics",
  "tags": ["performance", "requires-investigation"]
}
```

**event: error_rate_spike**
```json
{
  "timestamp": "2026-07-01T08:15:00Z",
  "actor": "alerting_system",
  "action": "error_rate_spike",
  "subject": "cic_adapter_errors_total",
  "details": {
    "adapter": "PuppeteerEngine",
    "error_rate": 0.15,
    "threshold": 0.10,
    "duration_minutes": 5,
    "error_code": "PUPPETEER_CRASHED",
    "correlated_change": "cic-ref/BUILD-SUMMARY modified 30m earlier"
  },
  "severity": "critical",
  "source": "metrics",
  "tags": ["incident", "automated-response"]
}
```

### Type 5: Correlation Events

**event: change_correlation**
```json
{
  "timestamp": "2026-07-02T14:35:00Z",
  "actor": "correlation_engine",
  "action": "change_correlation",
  "subject": "phase-18",
  "details": {
    "doc_change": "OBSERVABILITY_PLAN modified",
    "metric_change": "Adapter latency spiked p95 > 1s",
    "time_delta_minutes": 5,
    "confidence": 0.72,
    "likely_impact": "Prometheus scrape config change → sampling overhead"
  },
  "severity": "warning",
  "source": "correlation_engine",
  "tags": ["causal-analysis", "feedback-loop"]
}
```

---

## AUDIT LOG STORAGE

### Option 1: Immutable Event Log (Recommended)

**File:** `C:\dev\audit-log.jsonl` (append-only)

```jsonl
{"timestamp":"2026-06-20T00:00:00Z","action":"phase_started",...}
{"timestamp":"2026-06-20T02:30:00Z","action":"doc_modified",...}
{"timestamp":"2026-06-20T05:00:00Z","action":"metric_spike",...}
...
```

**Properties:**
- Append-only (immutable after write)
- Queryable via jq or SQLite import
- Line-oriented (easy to stream)
- Archivable (roll to `audit-log-2026-06.jsonl`)

### Option 2: SQL Database

**Tables:**
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP,
  actor VARCHAR(255),
  action VARCHAR(50),
  subject VARCHAR(255),
  details JSONB,
  correlation_id VARCHAR(255),
  severity ENUM('info', 'warning', 'critical'),
  source VARCHAR(50),
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_subject ON audit_events(subject);
CREATE INDEX idx_action ON audit_events(action);
```

### Option 3: Elasticsearch

- Full-text search on details
- Time-series aggregations
- Built-in retention + rollover
- Real-time dashboards

---

## QUERY EXAMPLES

### Query 1: What Changed in Phase 18?
```sql
SELECT 
  timestamp,
  action,
  subject,
  details->>'sections_modified' as changes,
  severity
FROM audit_events
WHERE correlation_id = 'phase-18-start-2026-06-20'
  AND action IN ('doc_modified', 'skill_created')
ORDER BY timestamp ASC;
```

**Output:**
```
timestamp            | action       | subject              | changes                   | severity
---------------------|--------------|----------------------|---------------------------|----------
2026-06-20T00:00:00Z | phase_started| phase-18             | -                         | info
2026-06-20T02:00:00Z | doc_modified | BUILD-SUMMARY        | ["Deployment"]           | info
2026-06-20T03:30:00Z | skill_created| cic-env-validator    | -                         | info
2026-07-02T16:45:00Z | phase_completed| phase-18           | -                         | info
```

### Query 2: Timeline of a Specific Doc
```sql
SELECT 
  timestamp,
  action,
  details->>'lines_changed' as lines_changed,
  details->>'sections_modified' as sections,
  actor
FROM audit_events
WHERE subject = 'cic-ref/OBSERVABILITY_PLAN.md'
ORDER BY timestamp DESC
LIMIT 10;
```

### Query 3: Incident Root Cause
```sql
-- Find: What changed 30min before error spike?
WITH error_event AS (
  SELECT timestamp FROM audit_events
  WHERE action = 'error_rate_spike'
    AND subject = 'cic_adapter_errors_total'
    AND timestamp > '2026-07-01T08:00:00Z'
)
SELECT 
  e.timestamp,
  e.action,
  e.subject,
  e.details,
  EXTRACT(EPOCH FROM (error_event.timestamp - e.timestamp))/60 as minutes_before_error
FROM audit_events e, error_event
WHERE e.timestamp BETWEEN 
  (error_event.timestamp - INTERVAL '60 minutes') 
  AND error_event.timestamp
  AND e.action IN ('doc_modified', 'skill_created', 'config_changed')
ORDER BY minutes_before_error ASC;
```

### Query 4: Change Velocity (Docs/Phase)
```sql
SELECT 
  details->>'phase' as phase,
  COUNT(*) as total_events,
  SUM(CASE WHEN action = 'doc_modified' THEN 1 ELSE 0 END) as docs_changed,
  SUM(CASE WHEN action = 'skill_created' THEN 1 ELSE 0 END) as skills_created,
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_issues
FROM audit_events
WHERE action IN ('phase_started', 'doc_modified', 'skill_created', 'error_rate_spike')
GROUP BY details->>'phase'
ORDER BY phase DESC;
```

### Query 5: Correlation Analysis (Did X cause Y?)
```sql
SELECT 
  ce.timestamp,
  ce.details->>'doc_change' as triggering_change,
  ce.details->>'metric_change' as resulting_metric,
  ce.details->>'confidence' as confidence_score,
  ce.details->>'likely_impact' as explanation
FROM audit_events ce
WHERE ce.action = 'change_correlation'
  AND ce.details->>'confidence'::float > 0.7
ORDER BY ce.timestamp DESC;
```

---

## IMPLEMENTATION STEPS

### Step 1: Initialize Audit Log (10 min)
```bash
# Create audit log file
touch C:\dev\audit-log.jsonl

# Emit bootstrap event
echo '{
  "timestamp": "2026-07-02T16:45:00Z",
  "actor": "system",
  "action": "audit_trail_initialized",
  "subject": "audit-trail",
  "severity": "info",
  "source": "system"
}' >> C:\dev\audit-log.jsonl
```

### Step 2: Wire Document Events (20 min)
- Hook vault sync script: on sync, emit `doc_modified` events
- Parse diff: extract changed sections
- Emit event for each doc

**In sync-vault.ps1:**
```powershell
# After each doc sync:
$event = @{
  timestamp = [DateTime]::UtcNow.ToString('o')
  actor = "vault_sync_daemon"
  action = "doc_modified"
  subject = $filePath
  details = @{
    before_hash = $beforeHash
    after_hash = $afterHash
    lines_changed = $diffLines.Count
  }
}
$event | ConvertTo-Json | Add-Content C:\dev\audit-log.jsonl
```

### Step 3: Wire Phase Events (15 min)
- Operator triggers: `phase_started`, `phase_completed`
- Compute: duration, issues, deliverables
- Emit with `correlation_id`

### Step 4: Wire Metric Events (25 min)
- Alert rules emit: `metric_spike_detected`, `error_rate_spike`
- Prometheus → alert webhook → emit event
- Include: metric value, threshold, affected component

### Step 5: Correlation Engine (30 min)
- Poll events every 5 minutes
- Find recent (doc changed, metric changed)
- Compute: time delta, confidence score
- Emit: `change_correlation` event if confidence > 0.7

**Algorithm:**
```
For each metric_event in last 60 minutes:
  For each doc_event in last 60 minutes:
    time_delta = metric_event.timestamp - doc_event.timestamp
    If time_delta between -5min and +30min:
      Compute semantic similarity (doc touched → metric name)
      If similarity > 0.7:
        confidence = similarity * (1 - time_delta_weight)
        If confidence > 0.7:
          Emit change_correlation event
```

### Step 6: Query API (20 min)
- Create REST API over audit log
- Endpoints:
  - `GET /audit/events?phase=18` → events in phase
  - `GET /audit/timeline/{doc}` → doc history
  - `GET /audit/correlations?metric=latency` → causal links
  - `GET /audit/export?start=2026-06-20&end=2026-07-02` → CSV export

### Step 7: Visualizations (30 min)
- Timeline chart (events over time)
- Sankey diagram (change flows → impact)
- Table (searchable event log)
- Heatmap (change velocity by component)

---

## OUTPUTS

- [ ] `audit-log.jsonl` — Immutable event log
- [ ] `audit-queries.sql` — Runnable SQL queries
- [ ] `audit-api.ts` — REST API for audit trail
- [ ] `audit-visualizations.html` — Timeline + charts
- [ ] `AUDIT-TRAIL-GUIDE.md` — How to interpret events

---

## INTEGRATION WITH OTHER ITEMS

### With Item 2 (Dashboard)
- Panel: "Recent Events" (latest 20 audit events)
- Panel: "Change Timeline" (what changed this week)
- Alert integration: audit → alert → event

### With Item 3 (System Map)
- Audit events show: "Who modified this node?"
- Timeline view: "System map evolution"

### With Item 5 (Skill Generator)
- Track: When skill was created, by whom, which doc
- Correlate: Skill creation → error spike (30min after)

### With Item 6 (Knowledge Graph)
- Audit events feed: "Node X was modified at T"
- Graph queries: "Show nodes modified in Phase 18"

### With Item 7 (Memory Governance)
- Audit trail itself is immutable vault asset
- Queries stored in memory are transient
- State (last event processed) in living docs

---

## COMPLIANCE & REGULATORY

**Immutability:**
- Append-only log (no edits, no deletes)
- Crypto hashing optional (SHA256(event + previous_hash))
- Enables: Proof of change, tamper detection

**Retention:**
- Keep: All events (forever, or per policy)
- Archive: Monthly snapshots to cold storage
- Purge: Only with explicit operator approval + audit trail

**Auditability:**
- Export: Full timeline as CSV/JSON
- Compliance: GDPR (right to erasure?), SOC 2 (change log)

---

## SUCCESS CRITERIA

✅ All 5 event types emit correctly  
✅ Audit log entries immutable (append-only)  
✅ Queries execute <500ms on full 6-month log  
✅ Correlation engine finds 80%+ of real causalities  
✅ Phase events linked to deliverables  
✅ No information loss from doc → log  
✅ Timeline visualization works for 1 month of data  

---

## NEXT STEPS

1. **Initialize audit log** — Create audit-log.jsonl
2. **Wire doc events** — Sync script → emit on change
3. **Wire phase events** — Operator workflow → emit phase start/end
4. **Wire metrics** — Prometheus alerts → emit events
5. **Implement correlation** — Find causal links
6. **Deploy query API** — Make audit trail queryable
7. **Add visualizations** — Timeline + charts

