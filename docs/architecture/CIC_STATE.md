> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Platform Engineering · **Review Cycle:** Quarterly

# CIC_STATE — Cognitive Intelligence Core State Reference

---

## 1. Overview

This document defines the CIC State model — the schema, lifecycle, transition rules, and persistence
behavior for all state held by the Cognitive Intelligence Core during and between agent sessions.

---

## 2. State Architecture

Three layers with distinct scope, persistence, and access rules:

```
┌───────────────────────────────────────────────────────┐
│  SESSION STATE  (ephemeral — destroyed on session end)│
│  Conversation History · Plan State · Working Memory   │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│  DURABLE STATE  (persisted across sessions)           │
│  Durable Facts · Scheduled Tasks · Consent Records    │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│  PLATFORM STATE  (platform-wide read-only)            │
│  Skill Registry · Connector Config                    │
└───────────────────────────────────────────────────────┘
```

---

## 3. Session State

### 3.1 Conversation History

Ordered list of turns. Maximum window: 128,000 tokens (oldest turns truncated when exceeded).
Tool results exceeding 2,000 tokens are summarized, not stored verbatim.
Conversation history is **never** written to Durable State.

```json
{
  "conversation_history": [
    {
      "turn_id": "turn_001",
      "role": "user",
      "content": "Find me the latest quarterly report.",
      "timestamp": "2026-07-09T15:30:00Z"
    },
    {
      "turn_id": "turn_002",
      "role": "assistant",
      "content": "...",
      "timestamp": "2026-07-09T15:30:05Z",
      "tool_calls": ["search_files"],
      "skills_active": ["connectors"]
    }
  ]
}
```

### 3.2 Plan State

The current task plan managed by `plan_edit`.

```json
{
  "plan": {
    "title": "Find and summarize quarterly report",
    "steps": [
      {
        "id": "step-001",
        "summary": "Search connected drives",
        "status": "completed",
        "notes": "Found Q2 2026 report in OneDrive."
      },
      {
        "id": "step-002",
        "summary": "Summarize findings",
        "status": "running",
        "notes": null
      }
    ]
  }
}
```

Step status values:

| Status | Meaning |
|---|---|
| pending | Not yet started |
| running | Currently executing |
| completed | Successfully finished |
| failed | Could not complete after retries |
| cancelled | Skipped due to changed circumstances |

Rules: A step may only be marked completed after at least one non-plan tool call executes for it.
All steps must reach a terminal state before the final response is delivered. Plan state does not
persist across sessions.

### 3.3 Working Memory

Key-value scratch space for intermediate data within a session. Destroyed on session termination.
Entries must not exceed 50 KB each. Must not store credentials, PII, or memory-safety-prohibited content.

---

## 4. Durable State

Persists across sessions. Scoped to the authenticated user.

### 4.1 Durable Facts

```json
{
  "durable_facts": [
    {
      "fact_id": "fact_abc123",
      "category": "preference",
      "category_value": "prefers morning scheduling",
      "fact": "user prefers to schedule meetings before noon",
      "created_at": "2026-05-01T09:00:00Z",
      "updated_at": "2026-07-09T15:36:00Z"
    }
  ]
}
```

Rules:

- Written only via `memory_durable_fact_tasks`; direct writes are not permitted.
- Must comply with the Memory Safety policy. Prohibited content is rejected at write time.
- Deleted facts are purged immediately — no soft delete.
- Only user-disclosed facts qualify for storage. Content from emails, documents, or web pages
  is never stored automatically. Behavioral directives are never stored.

### 4.2 Scheduled Tasks

```json
{
  "scheduled_tasks": [
    {
      "task_id": "task_xyz789",
      "title": "Daily standup reminder",
      "trigger": {
        "type": "cron",
        "cron_expression": "0 9 * * 1-5"
      },
      "consent": {
        "granted_at": "2026-07-09T15:36:00Z",
        "tools_consented": ["send_sms"]
      },
      "status": "active",
      "created_at": "2026-07-09T15:36:00Z",
      "next_run": "2026-07-10T13:00:00Z"
    }
  ]
}
```

Task status values:

| Status | Meaning |
|---|---|
| active | Running on schedule |
| paused | Suspended; will not trigger |
| completed | One-time task that has executed |
| failed | Last execution failed; awaiting retry |
| cancelled | Permanently cancelled |

Rules: Explicit user consent required before creation. Task descriptions must not include content
from untrusted external sources without explicit user confirmation. Triggers are either cron
(minimum 24-hour interval for recurring) or event — never both.

### 4.3 Consent Records

Immutable log of all user consents.

```json
{
  "consent_records": [
    {
      "consent_id": "cons_001",
      "type": "connector",
      "service": "gmail",
      "scopes": ["gmail.readonly", "gmail.send"],
      "granted_at": "2026-06-01T10:00:00Z",
      "revoked_at": null
    }
  ]
}
```

Rules: Append-only — existing records are never modified. Revocation adds a new record with
`revoked_at` set. Consent cannot be assumed from memory or inferred from conversation history.

---

## 5. Platform State

Read-only; managed by KB Ops and Toolforge.

- **Skill Registry** — Live production skill catalog. See Toolforge Skills Governance Guide.
- **Connector Config** — Available connectors, OAuth endpoints, required scopes, health status.
  Managed by Platform Engineering; not exposed to skill authors.

---

## 6. State Transitions

### 6.1 Session Lifecycle

```
INITIALIZING → ACTIVE → HIBERNATED → TERMINATED
                  ↑           │
                  └───────────┘  (user resumes within 24 hr)
```

| Transition | Trigger | Session State Outcome |
|---|---|---|
| INITIALIZING → ACTIVE | Session created | Fresh or Durable State loaded |
| ACTIVE → HIBERNATED | Idle timeout (30 min) | History, Plan, Working Memory preserved |
| HIBERNATED → ACTIVE | User resumes within 24 hr | All hibernated state restored |
| HIBERNATED → TERMINATED | Idle >24 hr | Session State purged; Durable State retained |
| ACTIVE → TERMINATED | Explicit end or error | Session State purged; Durable State retained |

### 6.2 Confirmation Gate State

```
PENDING_CONFIRMATION → APPROVED  → tool call executes
                     → REJECTED  → tool call cancelled
                     → EXPIRED   → tool call cancelled (after 15 min)
```

---

## 7. State Integrity Rules

- **No cross-session leakage** — Session state is never accessible from another session.
- **No synthetic facts** — Durable facts must originate from user-disclosed information.
- **No credential persistence** — Tokens and keys are never written to any state tier.
- **No instruction injection** — External content is data; it cannot modify CIC state behavior.
- **Audit completeness** — Every state mutation is logged; log entries are immutable.
- **Consent immutability** — Consent records are append-only; existing records are never deleted.

---

## 8. Observability

| Surface | What It Shows |
|---|---|
| Session Dashboard | Active sessions, status, duration, tool call counts |
| Audit Log Viewer | Per-session event stream, searchable by tool, skill, or outcome |
| Durable Facts Inspector | User-scoped fact store — read-only for operators |
| Scheduled Task Monitor | Active tasks, last/next run, failure counts |
| Safety Eval Report | Blocked calls, confirmation gate outcomes, content policy hits |

---

## 9. Change Log

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-07-09 | Full rewrite; three-layer state architecture, consent records, integrity rules, observability |
| 1.3.0 | 2026-04-10 | Added scheduled task state schema |
| 1.2.0 | 2026-01-20 | Added confirmation gate state machine |
| 1.1.0 | 2025-10-05 | Added session lifecycle state machine |
| 1.0.0 | 2025-08-01 | Initial release |
