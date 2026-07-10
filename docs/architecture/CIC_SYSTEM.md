> **Status:** STABLE · **Version:** 2.0.0 · **Updated:** 2026-07-09
> **Owner:** Rewrite Labs Platform Engineering · **Review Cycle:** Quarterly

# CIC_SYSTEM — Cognitive Intelligence Core System Reference

---

## 1. Overview

The **Cognitive Intelligence Core (CIC)** is the stateful orchestration engine that powers all
AI-augmented workflows in the Rewrite Labs platform. It manages agent sessions end-to-end — from
receiving a user request through reasoning, tool invocation, skill loading, and response delivery —
while enforcing safety policies, maintaining state, and producing a complete audit log of every action.

---

## 2. Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        CIC RUNTIME                              │
│                                                                 │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐   │
│  │  Session     │   │  Orchestrator │   │  Tool Dispatcher │   │
│  │  Manager     │◄─►│  (Reasoning)  │◄─►│  (Execution)     │   │
│  └──────────────┘   └───────────────┘   └──────────────────┘   │
│         │                  │                      │             │
│  ┌──────▼──────┐   ┌───────▼──────┐   ┌──────────▼──────┐     │
│  │  Memory     │   │  Skill       │   │  Safety          │     │
│  │  Manager    │   │  Registry    │   │  Evaluator       │     │
│  └─────────────┘   └──────────────┘   └─────────────────┘     │
│         │                                         │             │
│  ┌──────▼──────────────────────────────────────────▼──────┐    │
│  │                    Audit Logger                         │    │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Session Manager

- **Session creation:** Allocates a unique session ID, initializes state, loads user context.
- **Session hydration:** Restores prior durable state for returning sessions.
- **Session termination:** Persists final state, flushes audit log, releases resources.
- **Timeout enforcement:** Sessions idle for >30 min are hibernated. Sessions hibernated for >24 hr
  are terminated.

### 2.2 Orchestrator (Reasoning Engine)

The core reasoning loop:

1. Receives the user's message and current session state.
2. Selects and loads relevant skills from the Skill Registry.
3. Produces a structured plan.
4. Issues tool calls through the Tool Dispatcher.
5. Synthesizes results and produces the next response or action.
6. Repeats until the task is complete or blocked.

The Orchestrator is stateless per iteration — all state lives in CIC_STATE.

### 2.3 Tool Dispatcher

Routes tool calls to the appropriate backend:

- **Platform tools:** Natively implemented.
- **Connector tools:** Proxied to external services via authenticated connectors.
- **Skill-declared tools:** Loaded from the active skill set.
- **Browser tools:** Routed to the isolated browser automation service.

Enforces: parameter schema validation, per-category rate limits, and confirmation gate interception.

### 2.4 Memory Manager

Three memory tiers:

| Tier | Scope | Persistence | Examples |
|---|---|---|---|
| **Working Memory** | Current session | Ephemeral | Tool results, plan steps, intermediate reasoning |
| **Durable Facts** | Cross-session | Permanent until deleted | User preferences, contact details |
| **KB Reference** | Platform-wide | Read-only | Architecture docs, skill guides |

Working memory is never persisted after session termination. KB Reference is read-only at runtime.

### 2.5 Skill Registry

Runtime interface to the Toolforge catalog. Validates skill status before loading (blocks REMOVED
skills), returns structured migration errors for deprecated skills, and logs every skill load event.

### 2.6 Safety Evaluator

All tool calls and responses pass through the Safety Evaluator before execution or delivery:

- **Confirmation gates:** Consequential actions are paused until the user explicitly approves.
- **Content policy:** Responses are checked before delivery.
- **PII handling:** Outbound content is scanned for credential leakage and PII exposure.
- **Injection detection:** External content is evaluated for prompt injection before action.
- **Memory safety:** All durable fact writes are validated against the memory safety policy.

### 2.7 Audit Logger

Every session event is written to an immutable audit log:

```json
{
  "session_id": "ses_abc123",
  "event_type": "tool_call",
  "timestamp": "2026-07-09T15:36:00Z",
  "tool_name": "search_web",
  "result_summary": "5 results returned",
  "skill_context": "researcher",
  "safety_outcome": "PASS",
  "duration_ms": 342
}
```

Logs are retained for 90 days (configurable) and are exportable by authorized operators only.

---

## 3. Request Lifecycle

```
User Message
     │
     ▼
Session Manager (hydrate state)
     │
     ▼
Orchestrator (reason + plan)
     │
     ▼
Skill Registry (load relevant skills)
     │
     ▼
Tool Dispatcher → Safety Evaluator
     │                   │
     │          BLOCKED → Confirmation elicitation → User approves → Resume
     │
     └── PASS → Result returned to Orchestrator
                      │
                      ▼
              Orchestrator (synthesize + respond)
                      │
                      ▼
              Safety Evaluator (response content check)
                      │
                      ▼
              Response delivered → Audit logged → Memory persisted
```

---

## 4. Connector Architecture

Each connector is an independently authorized OAuth proxy. Key rules:

- Connector status is validated via `get_connector_status` before any connector tool is called.
- Credentials are held in an isolated vault — never stored in CIC state or logged.
- Each connector has a discrete scope set granted explicitly by the user.

---

## 5. Isolation and Security

| Boundary | Mechanism |
|---|---|
| Session isolation | No cross-session data access, even for the same user |
| Browser sandbox | Isolated container; no shared filesystem or network with agent sandbox |
| Credential isolation | OAuth tokens never exposed to Orchestrator or Audit Logger |
| KB isolation | Skills cannot write to the KB at runtime |
| External content | Treated as untrusted data, never as instructions |

---

## 6. Configuration Reference

| Parameter | Default | Description |
|---|---|---|
| SESSION_IDLE_TIMEOUT_MIN | 30 | Minutes before idle session hibernates |
| SESSION_MAX_DURATION_HR | 24 | Hours before hibernated session terminates |
| AUDIT_LOG_RETENTION_DAYS | 90 | Days audit logs are retained |
| MAX_TOOL_CALLS_PER_SESSION | 200 | Hard cap on tool calls per session |
| CONFIRMATION_GATE_TIMEOUT_MIN | 15 | Minutes before a pending gate expires |
| SAFETY_EVAL_MODE | enforcing | enforcing (blocks) or monitoring (dev only) |

---

## 7. Known Limitations

- No multi-user concurrent sessions within a single session context.
- Browser service cannot access localhost, loopback addresses, or file:// URLs.
- Skill loading is synchronous per session.
- Audit log export is operator-only.
- SAFETY_EVAL_MODE: monitoring must never be enabled in production deployments.

---

## 8. Change Log

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-07-09 | Full rewrite; added Safety Evaluator, Audit Logger, Connector Architecture |
| 1.4.0 | 2026-03-20 | Added memory tier table |
| 1.3.0 | 2026-01-05 | Added request lifecycle diagram |
| 1.0.0 | 2025-08-01 | Initial release |
