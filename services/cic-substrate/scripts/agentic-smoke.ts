import fetch from 'node-fetch';

const BASE = 'http://localhost:3000'; // TorqueQuery dev port

async function main() {
  const userId = 'test-user';
  const workspace = 'test/workspace';
  const sessionId = 'sess-001';

  // 1. Session
  await fetch(`${BASE}/agentic/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: sessionId,
      userId,
      harness: 'cic',
      workspace,
      startTime: new Date().toISOString(),
      endTime: null,
      tags: ['integration-test'],
    }),
  });

  // 2. Requests
  const reqIds = ['req-1', 'req-2'];
  for (const id of reqIds) {
    await fetch(`${BASE}/agentic/session-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        sessionId,
        timestamp: new Date().toISOString(),
        model: 'gemini-2.0-pro',
        surface: 'tool',
        promptHash: `hash-${id}`,
        promptSummary: `Test request ${id}`,
        tokensIn: 500,
        tokensOut: id === 'req-2' ? 2000 : 800,
        latencyMs: 1200,
        status: 'ok',
      }),
    });
  }

  // 3. Context slices
  await fetch(`${BASE}/agentic/context-slices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'ctx-1',
      sessionRequestId: 'req-2',
      source: 'instructions',
      sizeBytes: 10240,
      coverageScore: 0.7,
      freshnessScore: 0.9,
    }),
  });

  // 4. Review event (only for one request)
  await fetch(`${BASE}/agentic/review-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'rev-1',
      sessionRequestId: 'req-2',
      reviewer: 'claude',
      result: 'edited',
      diffSizeLines: 20,
      commentsCount: 3,
    }),
  });

}

main().catch(() => {});
