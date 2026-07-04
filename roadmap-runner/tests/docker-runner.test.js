const { buildDockerArgs, resolveTimeoutSeconds, extractMetrics } = require('../docker-runner');

describe('buildDockerArgs', () => {
  test('names the container and passes env + command', () => {
    const args = buildDockerArgs(
      {
        id: 'RL-4.0',
        container: 'cic/phase:latest',
        env: { FOO: 'bar' },
        command: ['node', 'run.js'],
      },
      'roadmap-runner-RL-4.0-123'
    );

    expect(args.slice(0, 4)).toEqual(['run', '--rm', '--name', 'roadmap-runner-RL-4.0-123']);
    expect(args).toContain('-e');
    expect(args).toContain('FOO=bar');
    const idx = args.indexOf('cic/phase:latest');
    expect(args.slice(idx + 1)).toEqual(['node', 'run.js']);
  });

  test('attaches network from phase config', () => {
    const args = buildDockerArgs(
      { id: 'X', container: 'img', network: 'cic-net' },
      'name'
    );
    const idx = args.indexOf('--network');
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe('cic-net');
  });
});

describe('resolveTimeoutSeconds', () => {
  afterEach(() => {
    delete process.env.RUNNER_PHASE_TIMEOUT_SECONDS;
  });

  test('phase config wins', () => {
    process.env.RUNNER_PHASE_TIMEOUT_SECONDS = '600';
    expect(resolveTimeoutSeconds({ timeout_seconds: 120 })).toBe(120);
  });

  test('env fallback', () => {
    process.env.RUNNER_PHASE_TIMEOUT_SECONDS = '600';
    expect(resolveTimeoutSeconds({})).toBe(600);
  });

  test('default 1800', () => {
    expect(resolveTimeoutSeconds({})).toBe(1800);
  });

  test('0 disables', () => {
    expect(resolveTimeoutSeconds({ timeout_seconds: 0 })).toBe(0);
  });
});

describe('extractMetrics', () => {
  test('parses JSON metric lines, skips noise', () => {
    const stdout = [
      'plain log line',
      '{"metric":"tokens_extracted","value":10}',
      '{"other":"json"}',
      '{"metric":"accuracy","value":0.95}',
    ].join('\n');

    expect(extractMetrics(stdout)).toEqual({ tokens_extracted: 10, accuracy: 0.95 });
  });
});
