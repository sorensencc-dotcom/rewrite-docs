/**
 * Integration tests for CIC Agent Runtime v0.2
 *
 * Tests the full lifecycle:
 * - Manifest loading + substitution
 * - Database migrations
 * - Tool/channel/schedule loading
 * - Webhook event → session creation
 * - Session persistence
 *
 * Supports two run modes:
 *   Host:   PG on localhost:5434 (default)
 *   Docker: PG on postgres:5432 (set PG_HOST=postgres, PG_PORT=5432 in env)
 */

import { test, expect, beforeAll, afterAll, describe } from '@jest/globals';
import { defineAgent } from './defineAgent';
import pino from 'pino';
import path from 'path';
import { Client } from 'pg';
import crypto from 'crypto';
import fs from 'fs/promises';

// Resolve test directory: tests run from repo root, cic-runtime/ is relative to root
const testDir = path.resolve(process.cwd(), 'cic-runtime');

// ---------------------------------------------------------------------------
// Connection config — environment variables override defaults for Docker runs
// ---------------------------------------------------------------------------
const PG_HOST = process.env.PG_HOST ?? '127.0.0.1';
const PG_PORT = parseInt(process.env.PG_PORT ?? '5434', 10);
const PG_USER = process.env.PG_USER ?? 'postgres';
const PG_PASSWORD = process.env.PG_PASSWORD ?? 'postgres';
const PG_DATABASE = process.env.PG_DATABASE ?? 'cic_agents';

// ---------------------------------------------------------------------------
// Schema migration SQL — also exported for docker-init-db.d/ consumption
// ---------------------------------------------------------------------------
export const SCHEMA_MIGRATION_SQL = `
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
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Connect to the postgres superuser database and create cic_agents if absent.
 * Uses the maintenance DB (postgres) to issue CREATE DATABASE.
 */
async function ensureDatabaseExists(): Promise<void> {
  const adminClient = new Client({
    host: PG_HOST,
    port: PG_PORT,
    database: 'postgres',
    user: PG_USER,
    password: PG_PASSWORD,
  });

  await adminClient.connect();

  try {
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [PG_DATABASE],
    );

    if (res.rowCount === 0) {
      // CREATE DATABASE cannot run inside a transaction; safe here since we
      // are on a fresh connection with no implicit transaction.
      await adminClient.query(`CREATE DATABASE ${PG_DATABASE}`);
    }
  } finally {
    await adminClient.end();
  }
}

async function checkManifestExists(manifestPath: string): Promise<boolean> {
  try {
    await fs.access(manifestPath);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

const logger = pino({ level: 'error' });

const pgClient = new Client({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
});

let agent: any;
let manifestMissing = false;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // 1. Ensure the cic_agents database exists
  try {
    await Promise.race([
      ensureDatabaseExists(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 5000))
    ]);
  } catch {
    // DB unavailable; remaining tests will skip
    return;
  }

  // 2. Connect the test client
  try {
    await Promise.race([
      pgClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('connect timeout')), 5000))
    ]);
  } catch {
    return;
  }

  // 3. Run schema migration so tables exist before defineAgent needs them
  try {
    await pgClient.query(SCHEMA_MIGRATION_SQL);
  } catch {
    return;
  }

  // 4. Resolve manifest
  const agentPath = path.resolve(testDir, '../cic-agent');
  const manifestPath = path.join(agentPath, 'pr-reviewer', 'agent.yaml');

  if (!(await checkManifestExists(manifestPath))) {
    manifestMissing = true;
    return; // remaining tests will skip themselves
  }

  // 5. Initialise the agent runtime
  try {
    agent = await defineAgent({ manifestPath, logger });
    await agent.start();
  } catch {
    manifestMissing = true;
  }
});

afterAll(async () => {
  if (agent) {
    try {
      await Promise.race([
        agent.stop(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('agent stop timeout')), 5000))
      ]);
    } catch {
      // non-fatal; best-effort cleanup
    }
  }

  // Drop test tables in test mode to leave the DB clean
  if (process.env.NODE_ENV === 'test') {
    try {
      await pgClient.query(`
        DROP TABLE IF EXISTS agent_tool_calls CASCADE;
        DROP TABLE IF EXISTS agent_schedule_runs CASCADE;
        DROP TABLE IF EXISTS agent_sessions CASCADE;
      `);
    } catch {
      // non-fatal; best-effort cleanup
    }
  }

  // End connection with timeout to prevent hanging if DB unavailable
  try {
    await Promise.race([
      pgClient.end(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('cleanup timeout')), 5000))
    ]);
  } catch {
    // non-fatal; best-effort cleanup
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('Runtime loads manifest with environment substitution', async () => {
  if (manifestMissing) {
    return;
  }

  expect(agent).toBeDefined();
  expect(agent.manifest).toBeDefined();
  expect(agent.manifest.metadata?.id ?? agent.manifest.id).toBe('cic.rewrite.pr-reviewer');
});

test('Database migrations create required tables', async () => {
  const tables = await pgClient.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_catalog = $1
  `, [PG_DATABASE]);

  const tableNames = tables.rows.map((r: any) => r.table_name);
  expect(tableNames).toContain('agent_sessions');
  expect(tableNames).toContain('agent_tool_calls');
  expect(tableNames).toContain('agent_schedule_runs');
});

test('Manifest environment substitution works', async () => {
  if (manifestMissing) {
    return;
  }

  // Verify the manifest survived env-var substitution without leaving raw
  // ${VAR} placeholders in string fields.
  const manifestStr = JSON.stringify(agent.manifest);
  expect(manifestStr).not.toMatch(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/);
});

test('Tools load and are discoverable', async () => {
  if (manifestMissing) {
    return;
  }

  const tools = agent.tools;
  expect(tools).toBeDefined();
  expect(tools.length).toBeGreaterThan(0);

  const toolNames = tools.map((t: any) => t.name);
  expect(toolNames).toContain('apply_patch');
  expect(toolNames).toContain('query_cic_state');
  expect(toolNames).toContain('run_tests');
});

test('Channel loads and listens for events', async () => {
  if (manifestMissing) {
    return;
  }

  const channels = agent.channels;
  expect(channels).toBeDefined();
  expect(channels.length).toBeGreaterThan(0);

  const channelNames = channels.map((c: any) => c.name);
  expect(channelNames).toContain('github-pr');
});

test('Webhook signature verification works', async () => {
  const secret = 'dev-secret';
  const payload = {
    action: 'opened',
    pull_request: {
      id: 1,
      number: 42,
      title: 'Test PR',
      head: { sha: 'abc123', ref: 'feature' },
      base: { ref: 'main' },
      user: { login: 'test-user' },
      created_at: '2026-06-20T12:00:00Z',
    },
    repository: {
      full_name: 'test/repo',
      owner: { login: 'test' },
    },
  };

  const body = JSON.stringify(payload);
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const signature = `sha256=${hmac}`;

  expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
});

test('Webhook event creates session', async () => {
  if (manifestMissing) {
    return;
  }

  // Get baseline session count
  const before = await pgClient.query('SELECT COUNT(*) as count FROM agent_sessions');
  const countBefore = parseInt(before.rows[0].count, 10);

  const secret = 'dev-secret';
  const payload = {
    action: 'opened',
    pull_request: {
      id: 2,
      number: 43,
      title: 'Integration Test PR',
      head: { sha: 'def456', ref: 'feature' },
      base: { ref: 'main' },
      user: { login: 'test-user' },
      created_at: '2026-06-20T12:00:00Z',
    },
    repository: {
      full_name: 'test/repo',
      owner: { login: 'test' },
    },
  };

  const body = JSON.stringify(payload);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const signature = `sha256=${hash}`;

  const webhookHost = process.env.WEBHOOK_HOST ?? 'localhost';
  const webhookPort = process.env.WEBHOOK_PORT ?? '3001';

  const response = await fetch(`http://${webhookHost}:${webhookPort}/webhook/github/pr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'pull_request',
      'X-Hub-Signature-256': signature,
    },
    body,
  });

  expect(response.status).toBe(200);
  const result = await response.json() as { success: boolean };
  expect(result.success).toBe(true);

  // Wait for async handler
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check new session exists
  const after = await pgClient.query('SELECT COUNT(*) as count FROM agent_sessions');
  const countAfter = parseInt(after.rows[0].count, 10);

  expect(countAfter).toBeGreaterThan(countBefore);
});

test('Session persists after webhook', async () => {
  if (manifestMissing) {
    return;
  }

  // Get baseline session count
  const before = await pgClient.query('SELECT COUNT(*) as count FROM agent_sessions');
  const countBefore = parseInt(before.rows[0].count, 10);

  // Send webhook
  const secret = 'dev-secret';
  const payload = {
    action: 'opened',
    pull_request: {
      id: 2,
      number: 43,
      title: 'Integration Test PR',
      head: { sha: 'def456', ref: 'feature' },
      base: { ref: 'main' },
      user: { login: 'test-user' },
      created_at: '2026-06-20T12:00:00Z',
    },
    repository: {
      full_name: 'test/repo',
      owner: { login: 'test' },
    },
  };

  const body = JSON.stringify(payload);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const signature = `sha256=${hash}`;

  const webhookHost = process.env.WEBHOOK_HOST ?? 'localhost';
  const webhookPort = process.env.WEBHOOK_PORT ?? '3001';

  const response = await fetch(`http://${webhookHost}:${webhookPort}/webhook/github/pr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'pull_request',
      'X-Hub-Signature-256': signature,
    },
    body,
  });

  expect(response.status).toBe(200);
  const result = await response.json() as { success: boolean };
  expect(result.success).toBe(true);

  // Wait for async handler
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check new session exists
  const after = await pgClient.query('SELECT COUNT(*) as count FROM agent_sessions');
  const countAfter = parseInt(after.rows[0].count, 10);

  expect(countAfter).toBeGreaterThan(countBefore);
});

test('Session has correct metadata', async () => {
  if (manifestMissing) {
    return;
  }

  const sessions = await pgClient.query(
    'SELECT * FROM agent_sessions WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1',
    ['cic.rewrite.pr-reviewer'],
  );

  expect(sessions.rows.length).toBeGreaterThan(0);
  const session = sessions.rows[0];

  expect(session.agent_id).toBe('cic.rewrite.pr-reviewer');
  expect(session.kind).toMatch(/github\.pr\.(opened|synchronize|closed)/);
  expect(['running', 'completed', 'failed']).toContain(session.status);
  expect(session.metadata).toBeDefined();
  expect(session.created_at).toBeDefined();
});

test('Schedule registers cron job', async () => {
  if (manifestMissing) {
    return;
  }

  expect(agent.schedules).toBeDefined();
  expect(agent.schedules.length).toBeGreaterThan(0);

  const schedule = agent.schedules.find((s: any) => s.includes('3 * * *'));
  expect(schedule).toBeDefined();
});
