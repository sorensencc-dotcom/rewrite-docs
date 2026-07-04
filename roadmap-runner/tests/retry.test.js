const fs = require('fs');
const os = require('os');
const path = require('path');

const PHASE_YAML = [
  'id: TEST-1',
  'container: test/img',
  'retry:',
  '  max_attempts: 3',
  '  backoff_seconds: 0',
  'success_gates:',
  '  - type: exit_code',
  '    value: 0',
  '',
].join('\n');

function failResult() {
  return { exitCode: 1, stdout: '', stderr: 'boom', metrics: {}, timedOut: false };
}

function okResult() {
  return { exitCode: 0, stdout: '', stderr: '', metrics: {}, timedOut: false };
}

describe('executePhase retry', () => {
  let tmp;
  let scheduler;
  let runPhaseMock;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-retry-'));
    fs.mkdirSync(path.join(tmp, 'phases'));
    fs.writeFileSync(path.join(tmp, 'phases', 'TEST-1.yaml'), PHASE_YAML, 'utf8');

    process.env.RUNNER_STATE_PATH = path.join(tmp, 'state.json');
    process.env.RUNNER_PHASES_DIR = path.join(tmp, 'phases');
    process.env.RUNNER_LOGS_DIR = path.join(tmp, 'logs');
    process.env.RUNNER_METRICS_DIR = path.join(tmp, 'metrics');
    process.env.RUNNER_LOG_FILE = path.join(tmp, 'runner.jsonl');

    jest.resetModules();
    jest.doMock('../docker-runner', () => ({ runPhase: jest.fn() }));
    scheduler = require('../scheduler');
    runPhaseMock = require('../docker-runner').runPhase;

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    for (const key of [
      'RUNNER_STATE_PATH',
      'RUNNER_PHASES_DIR',
      'RUNNER_LOGS_DIR',
      'RUNNER_METRICS_DIR',
      'RUNNER_LOG_FILE',
    ]) {
      delete process.env[key];
    }
    jest.restoreAllMocks();
    jest.dontMock('../docker-runner');
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('retries until success within max_attempts', async () => {
    runPhaseMock
      .mockResolvedValueOnce(failResult())
      .mockResolvedValueOnce(failResult())
      .mockResolvedValueOnce(okResult());

    const state = { version: 'v3.0', phases: {} };
    await scheduler.executePhase('TEST-1', { nodes: [], edges: [] }, state);

    expect(runPhaseMock).toHaveBeenCalledTimes(3);
    expect(state.phases['TEST-1'].status).toBe('succeeded');
    expect(state.phases['TEST-1'].runs).toHaveLength(3);
    expect(state.phases['TEST-1'].runs.map((r) => r.attempt)).toEqual([1, 2, 3]);

    const summary = JSON.parse(
      fs.readFileSync(path.join(tmp, 'metrics', 'summary.json'), 'utf8')
    );
    expect(summary.phases['TEST-1'].runs).toBe(3);
    expect(summary.phases['TEST-1'].retries).toBe(2);
  });

  test('fails and blocks dependents after exhausting attempts', async () => {
    runPhaseMock.mockResolvedValue(failResult());

    const graph = {
      nodes: [{ id: 'TEST-1' }, { id: 'TEST-2' }],
      edges: [{ from: 'TEST-1', to: 'TEST-2' }],
    };
    const state = {
      version: 'v3.0',
      phases: { 'TEST-2': { status: 'pending', runs: [] } },
    };
    await scheduler.executePhase('TEST-1', graph, state);

    expect(runPhaseMock).toHaveBeenCalledTimes(3);
    expect(state.phases['TEST-1'].status).toBe('failed');
    expect(state.phases['TEST-2'].status).toBe('blocked');
  });

  test('resolveRetryPolicy: config > env > defaults', () => {
    expect(scheduler.resolveRetryPolicy({ retry: { max_attempts: 5, backoff_seconds: 1 } }))
      .toEqual({ maxAttempts: 5, backoffSeconds: 1 });

    process.env.RUNNER_MAX_ATTEMPTS = '4';
    process.env.RUNNER_BACKOFF_SECONDS = '2';
    expect(scheduler.resolveRetryPolicy({})).toEqual({ maxAttempts: 4, backoffSeconds: 2 });
    delete process.env.RUNNER_MAX_ATTEMPTS;
    delete process.env.RUNNER_BACKOFF_SECONDS;

    expect(scheduler.resolveRetryPolicy({})).toEqual({ maxAttempts: 2, backoffSeconds: 10 });
  });
});
