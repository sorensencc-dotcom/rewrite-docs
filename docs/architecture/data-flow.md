> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Platform Engineering · **Review Cycle:** Quarterly

# Data Flow

End-to-end request and response paths through the CIC platform, including ingestion, runtime
execution, error handling, and audit emission.

---

## 1. Inbound Request Lifecycle

Every user message follows this deterministic path:

```
User Message
     │
     ▼
Session Manager          ← hydrates durable state; allocates session ID
     │
     ▼
Orchestrator             ← loads relevant skills from Skill Registry
     │                      produces a structured execution plan
     ▼
Tool Dispatcher ─────────► Safety Evaluator
     │                            │
     │                   BLOCKED  │  requires user confirmation gate
     │                            │  (expires after 15 min if no response)
     │                   PASS     │
     │◄────────────────────────────┘
     │
     ▼
External Backend / Skill Execution
     │
     ▼
Orchestrator             ← synthesizes results, forms response
     │
     ▼
Safety Evaluator         ← content policy check, PII scan
     │
     ▼
Response Delivered       → Audit Logger (event written)
                         → Memory Manager (durable facts persisted if any)
```

---

## 2. Ingestion Data Flow

The knowledge graph is populated via the ingestion pipeline, which runs independently of the
runtime request path:

```
Source Vault (Obsidian / OneDrive)
     │
     ▼
CodeFlow Harvester       ← crawl, scrape, deduplicate
     │
     ▼
IR Packet Mapper         ← normalize to unified IRPacket schema
     │                      { source, type, id, name, metadata, content, dependencies, tags }
     ▼
Knowledge Graph Indexer  ← extract [[wiki-links]], build nodes + edges
     │                      output: graph.json (280+ nodes, 600+ edges)
     ▼
Drift Detection          ← compare new graph snapshot vs stored baseline
     │
     ├── drift < 0.2  → no action (standard decay continues)
     ├── drift 0.2–0.6 → penalty applied to provider drift score
     └── drift > 0.6  → critical: drift spike playbook triggered
```

---

## 3. Provider Routing Flow

After the orchestrator selects a backend, the router applies drift-aware scoring:

```
Orchestrator requests backend
     │
     ▼
Local-First Router
     │
     ├── localFirst: true  → filter to local providers only
     │                        (ollama, llamafile, mock)
     │
     └── localFirst: false → allow cloud providers
          │
          ▼
     Drift Score Lookup (governance/cicState.json)
          │
          ├── score < 0.5  → route to preferred backend
          ├── score 0.5–0.8 → de-prioritize; try next provider
          └── score > 0.8  → routing frozen; use lowest-drift fallback
               │
               ▼
          SLA Failover if all local providers degrade:
          → Backend Recovery Playbook
          → Routing Stability Playbook (freeze to known-stable)
```

See [Routing Engine](routing.md) for implementation details.

---

## 4. Sealing Flow

The MAAL deterministic stack produces a cryptographic seal on demand:

```
cic-cli seal --phase=N
     │
     ▼
Layer scan (lexicographic file order)
     │
     ├── Level 1: hash individual files (SHA-256)
     ├── Level 2: hash directories (aggregate of file hashes)
     ├── Level 3: hash recursively (nested directories)
     └── Level 4: system-wide seal (all 25 layers combined)
          │
          ▼
     seal-report.json written
          │
          ▼
     Autonomy API locks sealed records (no further modification)
          │
          ▼
     cic-cli verify --phase=N  → compare expected vs actual hash
```

See [Deterministic Stack](deterministic-stack.md) and [Sealing & Verification](../operations/sealing.md).

---

## 5. Error Paths

| Error Type | Where It Occurs | Outcome |
|---|---|---|
| Safety block | Safety Evaluator (pre-execution) | Tool call cancelled; user prompted for confirmation |
| Confirmation timeout | Confirmation Gate | Gate expires after 15 min; tool call cancelled |
| Provider failure | Tool Dispatcher | Circuit breaker opens; fallback chain engaged |
| Critical drift | Drift Engine | Routing frozen; drift spike playbook activated |
| Seal mismatch | Verification step | Deployment halted; operator alert sent |
| Skill not found | Skill Registry | Structured error returned; migration hint provided if deprecated |
| Session timeout | Session Manager | Session hibernates at 30 min idle; terminates at 24 hr hibernated |

---

## 6. Audit Emission Points

Every step in the flows above emits a structured audit event:

```json
{
  "session_id": "ses_abc123",
  "event_type": "tool_call | safety_block | gate_approved | seal_complete | routing_decision",
  "timestamp": "2026-07-09T15:36:00Z",
  "tool_name": "search_web",
  "result_summary": "5 results returned",
  "skill_context": "researcher",
  "safety_outcome": "PASS",
  "duration_ms": 342
}
```

Audit logs are retained for 90 days and are immutable. See [CIC System §2.7](CIC_SYSTEM.md) for
the full audit schema.
