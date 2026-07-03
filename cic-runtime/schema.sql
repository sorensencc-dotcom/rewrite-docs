-- CIC Agent Runtime schema for cic_agents database
-- Used by: docker-init-db.d/ initialization and integration.test.ts (via SCHEMA_MIGRATION_SQL export)
--
-- Run once against the cic_agents database:
--   psql -h localhost -p 5434 -U postgres -d cic_agents -f schema.sql

CREATE TABLE IF NOT EXISTS agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  metadata jsonb,
  last_checkpoint jsonb,
  last_message text,
  locked_until timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_status
  ON agent_sessions(agent_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_created
  ON agent_sessions(created_at);

CREATE TABLE IF NOT EXISTS agent_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES agent_sessions(id),
  tool_name text NOT NULL,
  input jsonb NOT NULL,
  output jsonb,
  success boolean NOT NULL,
  duration_ms integer NOT NULL,
  error_message text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_session
  ON agent_tool_calls(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_tool
  ON agent_tool_calls(tool_name);

CREATE TABLE IF NOT EXISTS agent_schedule_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  schedule_name text NOT NULL,
  cron text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  result jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_schedule_runs_agent
  ON agent_schedule_runs(agent_id, created_at);
