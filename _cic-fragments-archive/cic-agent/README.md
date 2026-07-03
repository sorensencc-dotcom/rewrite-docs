# CIC Agent System

Autonomous agent framework for CIC governance, PR review, build health, and roadmap management.

## Structure

```
cic-agent/
  pr-reviewer/              # Flagship agent: PR review + test running
    agent.yaml              # Manifest: identity, runtime, wiring
    instructions.md         # Standing rules + skills
    tools/                  # Executable capabilities
      run_tests.ts
      apply_patch.ts
      query_cic_state.ts
    channels/               # Event adapters
      github-pr.ts
    schedules/              # Time-based triggers
      nightly-build-health.ts
    README.md               # Agent documentation

  .env.example              # Configuration template
```

---

## What is Here

### Agent Manifest (`agent.yaml`)

Declarative specification of:
- **Identity**: `cic.rewrite.pr-reviewer`
- **Runtime**: Docker sandbox, Postgres persistence, concurrency limits
- **Tools**: `run_tests`, `apply_patch`, `query_cic_state`
- **Channels**: GitHub webhooks, Slack notifications
- **Schedules**: Daily build health checks
- **Policies**: Code change permissions, forbidden paths

### Instructions (`instructions.md`)

Executable rules and context for the agent:
- Architecture invariants (5 core rules)
- Test coverage requirements
- Patch strategy (propose fixes, don't reject)
- Skill definitions and failure handling
- Tone and escalation paths

### Tools

**Deterministic, sandboxed capabilities:**

- **`run_tests`** — Run CIC test suite with optional coverage reporting
- **`apply_patch`** — Apply Git patches, validate safety (dry-run first)
- **`query_cic_state`** — Query architecture, dependencies, builds, governance, commits

Each tool:
- Has typed input/output schema (Zod)
- Runs in Docker sandbox with resource limits
- Logs all calls to Postgres with duration, success/failure, output
- Supports checkpointing for session recovery

### Channels

**Event adapters that trigger agent sessions:**

- **`github-pr`** — Webhook listener for PR opened/updated/closed events
- **`slack-notifications`** (stub) — Send summaries and escalations to Slack

Each channel:
- Subscribes to external events
- Maps events to agent sessions
- Includes signature verification (GitHub HMAC)

### Schedules

**Time-based triggers (cron):**

- **`nightly-build-health`** — 3 AM UTC daily
  - Queries last 5 builds on `main`
  - Reports health status (healthy/degraded/critical)
  - Runs full test suite

---

## Runtime Architecture

**Built on CIC Agent Runtime v0.2** (in `cic-runtime/`):

```
defineAgent()
  ├── Load + validate agent.yaml
  ├── Load + validate tools (Zod schemas)
  ├── Load + validate channels
  ├── Load schedules
  ├── Initialize Postgres session store
  ├── Run database migrations
  ├── Recover abandoned sessions
  ├── Start channel listeners
  ├── Register cron schedules
  └── Expose session + tool APIs
```

**Key features:**
- Durable sessions in Postgres (with checkpointing)
- Multi-instance safety (atomic row-level locking)
- Sandbox execution (Docker with resource limits)
- Automatic recovery on restart
- Structured logging (JSON, pino)

---

## Getting Started

### 1. Setup environment

```bash
cd cic-agent
cp .env.example .env
# Edit .env with your GitHub token, Postgres URL, etc.
```

### 2. Start runtime

```bash
node cic-runtime/example-entrypoint.ts
```

### 3. Trigger a PR review

Send a webhook:

```bash
curl -X POST http://localhost:3001/webhook/github/pr \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{"action":"opened","pull_request":{...}}'
```

### 4. Query sessions

```sql
SELECT * FROM agent_sessions ORDER BY created_at DESC;
SELECT * FROM agent_tool_calls WHERE session_id = '...' ORDER BY created_at;
```

See [pr-reviewer/README.md](pr-reviewer/README.md) for full details.

---

## Design Decisions

### Single agent per directory

Each `cic-agent/<name>/` is a complete, self-contained agent:
- Own manifest, tools, channels, schedules
- Own Postgres tables (agent namespaced)
- Own logging and observability

This enables:
- Independent scaling (start/stop per agent)
- Clean responsibility boundaries
- Easy testing (mock sandbox + Postgres)

### Deterministic tools

All tools:
- Have explicit input/output schemas (validation at call time)
- Run in Docker (reproducible environment)
- Log all executions (audit trail)
- Support checkpointing (for recovery)

No magic, no hidden side effects.

### Declarative configuration

`agent.yaml` is the source of truth:
- Runtime knows what tools, channels, schedules exist
- No manual registration code
- Easy to audit agent capabilities
- Easy to disable/enable features

### Postgres as session store

Sessions are durable, queryable, auditable:
- Survive agent restarts
- Can be resumed from checkpoints
- Multi-instance safe (via locking)
- Full history in `agent_tool_calls` table

---

## Architecture Invariants

The agent enforces these rules on every PR:

1. **No direct database writes outside migrations**  
   All state mutations go through versioned migrations.

2. **No escape from sandbox**  
   Tools cannot execute arbitrary commands outside Docker.

3. **No API keys in code**  
   All secrets from environment variables.

4. **No circular imports in CIC core**  
   Dependencies form a DAG.

5. **Determinism required**  
   No timestamps, random IDs, or ordering assumptions in governance decisions.

Violations → agent proposes minimal patch → re-run tests → if still fails, escalate.

---

## Next Steps

### Immediate (to validate the spec)

1. [ ] **Build example agent** ← You are here
2. [ ] **Integration tests** — Validate startup, session creation, tool execution
3. [ ] **End-to-end test** — Trigger real PR, watch it flow through tools
4. [ ] **Fix any failures** — Iterate on runtime/agent design

### Short-term (unlock workflow engine)

5. [ ] **Workflow DAG** — Multi-step sessions (tool A → tool B → tool C)
6. [ ] **Subagent invocation** — PR reviewer can delegate to build-fixer
7. [ ] **Connections factory** — GitHub API client, CIC Core client injection

### Medium-term (full integration)

8. [ ] **Distributed tracing** — OpenTelemetry spans for observability
9. [ ] **Skill loader** — Load DSL-style skill definitions
10. [ ] **Policy enforcement** — Validate against declared policies
11. [ ] **Agent-to-agent messaging** — Cross-agent communication

### Dashboard integration

12. [ ] **Agent session viewer** — Real-time session list, tool call logs
13. [ ] **Build health dashboard** — Display nightly health check results
14. [ ] **PR review status** — Show which PRs are under review, results

---

## Testing

See [pr-reviewer/README.md](pr-reviewer/README.md) for:
- Unit test structure
- Integration test patterns
- Manual webhook testing
- Troubleshooting guide

---

## Files

- [`cic-runtime/defineAgent.ts`](../cic-runtime/defineAgent.ts) — Main runtime (500+ lines)
- [`cic-runtime/toolDefinition.ts`](../cic-runtime/toolDefinition.ts) — Tool type helpers
- [`cic-runtime/channelAdapter.ts`](../cic-runtime/channelAdapter.ts) — Channel type helpers
- [`cic-runtime/scheduleModule.ts`](../cic-runtime/scheduleModule.ts) — Schedule type helpers
- [`cic-runtime/example-entrypoint.ts`](../cic-runtime/example-entrypoint.ts) — How to start an agent
- [`cic-runtime/FIXES.md`](../cic-runtime/FIXES.md) — What was fixed in v0.2

---

## Dependencies

```json
{
  "pg": "^8.11.0",
  "dockerode": "^4.0.0",
  "node-cron": "^3.0.0",
  "js-yaml": "^4.1.0",
  "zod": "^3.22.0",
  "pino": "^8.16.0",
  "express": "^4.18.0"
}
```

---

## Status

**v0.2 complete:**
- ✅ Runtime (defineAgent, validation, Postgres, Docker, multi-instance safety)
- ✅ Example agent (PR reviewer with 3 tools, 1 channel, 1 schedule)
- ✅ Documentation (manifest, instructions, README)

**Ready for:**
- Integration tests
- End-to-end testing
- Workflow DAG implementation
- Dashboard integration

---
