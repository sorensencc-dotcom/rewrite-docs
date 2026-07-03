import { materializeMetricsForUserWorkspace } from '../src/agentic/jobs/materializeMetrics';
import { query } from '../src/db';
import fetch from 'node-fetch';

const BASE = 'http://localhost:3000';
const userId = 'test-user';
const workspace = 'test/workspace';

test('CIC → TorqueQuery → CIC agentic round-trip', async () => {
  // 1. Run CIC harness (requires server to be running)
  // For the sake of this test, we assume the server is running on port 3000
  // and we'll invoke the script dynamically if needed, or just let it run.
  // We'll mock the fetch if needed in a real suite, or run integration fully.

  // Assuming `scripts/agentic-smoke.ts` was executed manually or as a pre-test step.
  // In a real jest integration test, we might start the server here and execute the fetches directly.

  // 2. Verify ingestion
  const sessions = await query(
    'SELECT * FROM agentic_sessions WHERE user_id = $1 AND workspace = $2',
    [userId, workspace]
  );
  expect(sessions.rowCount).toBe(1);

  const requests = await query(
    'SELECT * FROM agentic_session_requests WHERE session_id = $1',
    [sessions.rows[0].id]
  );
  expect(requests.rowCount).toBe(2);

  // 3. Materialize metrics
  await materializeMetricsForUserWorkspace(userId, workspace);

  const metrics = await query(
    'SELECT * FROM agentic_metrics_latest WHERE user_id = $1 AND workspace = $2',
    [userId, workspace]
  );
  expect(metrics.rowCount).toBe(1);

  // 4. Query MCP endpoints
  const readinessRes = await fetch(
    `${BASE}/metrics/agentic-readiness?userId=${userId}&workspace=${workspace}`
  );
  const readiness = await readinessRes.json();
  expect(readiness.readinessIndex).toBeGreaterThanOrEqual(0);

  const driftRes = await fetch(
    `${BASE}/metrics/drift?userId=${userId}&workspace=${workspace}`
  );
  const drift = await driftRes.json();
  expect(drift.driftIndex).toBeGreaterThanOrEqual(0);

  const findingsRes = await fetch(
    `${BASE}/rules/findings?userId=${userId}&workspace=${workspace}`
  );
  const findings = await findingsRes.json();
  expect(findings.count).toBeGreaterThanOrEqual(1);
});
