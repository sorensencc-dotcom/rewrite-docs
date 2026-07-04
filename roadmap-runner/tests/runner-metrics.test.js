const fs = require('fs');
const os = require('os');
const path = require('path');

describe('runner-metrics', () => {
  let dir;
  let metrics;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-metrics-'));
    process.env.RUNNER_METRICS_DIR = dir;
    jest.resetModules();
    metrics = require('../lib/runner-metrics');
  });

  afterEach(() => {
    delete process.env.RUNNER_METRICS_DIR;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('recordRun appends to runs.jsonl and aggregates summary', () => {
    metrics.recordRun({
      phaseId: 'RL-4.0',
      attempt: 1,
      success: false,
      exitCode: 1,
      durationSeconds: 10,
      timedOut: false,
      startedAt: '2026-07-04T00:00:00.000Z',
      finishedAt: '2026-07-04T00:00:10.000Z',
    });
    metrics.recordRun({
      phaseId: 'RL-4.0',
      attempt: 2,
      success: true,
      exitCode: 0,
      durationSeconds: 20,
      timedOut: false,
      startedAt: '2026-07-04T00:00:20.000Z',
      finishedAt: '2026-07-04T00:00:40.000Z',
    });

    const lines = fs
      .readFileSync(path.join(dir, 'runs.jsonl'), 'utf8')
      .trim()
      .split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]).attempt).toBe(2);

    const summary = metrics.loadSummary();
    const p = summary.phases['RL-4.0'];
    expect(p.runs).toBe(2);
    expect(p.successes).toBe(1);
    expect(p.failures).toBe(1);
    expect(p.retries).toBe(1);
    expect(p.timeouts).toBe(0);
    expect(p.avgDurationSeconds).toBe(15);
    expect(p.lastSuccess).toBe(true);
  });

  test('timeouts counted', () => {
    metrics.recordRun({
      phaseId: 'PHASE-26',
      attempt: 1,
      success: false,
      exitCode: 137,
      durationSeconds: 1800,
      timedOut: true,
      startedAt: '2026-07-04T00:00:00.000Z',
      finishedAt: '2026-07-04T00:30:00.000Z',
    });

    const p = metrics.loadSummary().phases['PHASE-26'];
    expect(p.timeouts).toBe(1);
    expect(p.failures).toBe(1);
  });
});
