# PR Reviewer Agent

Autonomous agent for reviewing CIC pull requests, enforcing architecture invariants, and fixing test failures.

## Quick Start

### 1. Setup environment

```bash
cp ../.env.example .env
# Edit .env with your values:
# - DATABASE_URL: Postgres connection string
# - GITHUB_TOKEN: Personal access token
# - GITHUB_WEBHOOK_SECRET: Webhook secret from GitHub
```

### 2. Start agent runtime

```bash
node cic-runtime/example-entrypoint.ts
```

Expected output:

```
[INFO] Loaded agent manifest
[INFO] Loaded tool: run_tests
[INFO] Loaded tool: apply_patch
[INFO] Loaded tool: query_cic_state
[INFO] Loaded channel: github-pr
[INFO] Registered schedule: 0 3 * * *
[INFO] Agent runtime started
```

### 3. Test webhook

```bash
curl -X POST http://localhost:3001/webhook/github/pr \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{
    "action": "opened",
    "pull_request": {
      "number": 42,
      "title": "feat: add new feature",
      "user": {"login": "alice"},
      "head": {"ref": "feature/new"},
      "base": {"ref": "main"},
      "html_url": "https://github.com/...",
      "additions": 45,
      "deletions": 12,
      "changed_files": 3
    },
    "repository": {
      "id": 12345,
      "full_name": "rewrite/cic"
    }
  }'
```

### 4. Check sessions

```sql
SELECT id, kind, status, created_at FROM agent_sessions ORDER BY created_at DESC;
SELECT * FROM agent_tool_calls WHERE session_id = '...';
```

---

## Architecture

### Tools

- **`run_tests`** — Execute test suite, optionally with coverage
- **`apply_patch`** — Apply Git patches to the repository
- **`query_cic_state`** — Query repository state, architecture, governance, builds

### Channels

- **`github-pr`** — Listen for GitHub PR webhook events
- **`slack-notifications`** (stub) — Send notifications to Slack

### Schedules

- **`nightly-build-health`** — 3 AM UTC daily, check build health on main

### Skills

- **`pr-review`** — Review PR for violations
- **`cic-architecture`** — Validate architecture invariants
- **`build-fixer`** — Fix failing tests

---

## Standing Rules

### Architecture Invariants

1. **No direct database writes outside migrations**  
   All state changes go through versioned migrations.

2. **No escape from sandbox**  
   Tools cannot execute arbitrary OS commands outside Docker.

3. **No API keys in code**  
   All credentials from environment variables.

4. **No circular imports in CIC core**  
   Dependencies must form a DAG.

5. **Determinism required**  
   No timestamps, random IDs, or ordering assumptions in governance decisions.

### Test Coverage

- All changed files must have tests
- Coverage must not decrease
- No mocked database (hit real Postgres)

### Patch Strategy

- If rule violated, propose minimal patch (don't reject)
- Use `apply_patch` to fix it
- Re-run tests
- If still fails, escalate to human

---

## Database Schema

### agent_sessions

```sql
CREATE TABLE agent_sessions (
  id uuid PRIMARY KEY,
  agent_id text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  metadata jsonb,
  last_checkpoint jsonb,
  last_message text,
  locked_until timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

### agent_tool_calls

```sql
CREATE TABLE agent_tool_calls (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES agent_sessions(id),
  tool_name text NOT NULL,
  input jsonb NOT NULL,
  output jsonb,
  success boolean NOT NULL,
  duration_ms integer,
  error_message text,
  created_at timestamp
);
```

### agent_schedule_runs

```sql
CREATE TABLE agent_schedule_runs (
  id uuid PRIMARY KEY,
  agent_id text NOT NULL,
  schedule_name text NOT NULL,
  cron text NOT NULL,
  status text NOT NULL,
  result jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamp
);
```

---

## Configuration

See `agent.yaml` for:

- Model provider and settings (Claude API)
- Runtime sandbox and persistence (Docker, Postgres)
- Tool/channel/schedule wiring
- Policies (code change permissions, forbidden paths)
- Observability (logging, tracing, metrics)

---

## Testing

### Unit Tests

```bash
npm test tools/
npm test channels/
npm test schedules/
```

### Integration Tests

```bash
npm test --integration
```

### Manual Testing

See "Test webhook" section above.

---

## Logs

Structured logs go to stdout (JSON format by default).

```bash
# Pretty print
node cic-runtime/example-entrypoint.ts | jq '.'

# Filter by level
node cic-runtime/example-entrypoint.ts | jq 'select(.level >= 40)'

# Filter by component
node cic-runtime/example-entrypoint.ts | jq 'select(.tool == "run_tests")'
```

---

## Troubleshooting

### "Unknown tool: run_tests"
Tool not loaded. Check `agent.yaml` wiring and tool file names.

### "Postgres connection refused"
Check `DATABASE_URL` in `.env`. Ensure Postgres is running.

### "GitHub signature invalid"
Check `GITHUB_WEBHOOK_SECRET` matches GitHub settings.

### "Docker socket not found"
On Windows with Docker Desktop, ensure socket is mounted: `-v /var/run/docker.sock:/var/run/docker.sock`

---

## Next Steps

- [ ] Implement workflow DAG (multi-step sessions)
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Implement subagent invocation (build-fixer, roadmap-harvester)
- [ ] Wire Connections (GitHub API client, CIC Core client)
- [ ] Add skill loader + DSL parser
- [ ] Add policy validation in tool execution
- [ ] Implement recovery from crashed sessions
- [ ] Add agent-to-agent messaging
