const fs = require('fs');
const os = require('os');
const path = require('path');

describe('logger', () => {
  let dir;
  let log;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-logger-'));
    process.env.RUNNER_LOG_FILE = path.join(dir, 'runner.jsonl');
    jest.resetModules();
    log = require('../lib/logger');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.RUNNER_LOG_FILE;
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('writes JSON lines with ts, level, event, fields', () => {
    log.info('exec', { phase: 'RL-4.0' });
    log.error('fail', { phase: 'RL-4.0', exit: 1 });

    const lines = fs
      .readFileSync(process.env.RUNNER_LOG_FILE, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ level: 'info', event: 'exec', phase: 'RL-4.0' });
    expect(lines[0].ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(lines[1]).toMatchObject({ level: 'error', event: 'fail', exit: 1 });
  });

  test('error level routes to console.error', () => {
    log.error('fail', { phase: 'X' });
    expect(console.error).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
});
