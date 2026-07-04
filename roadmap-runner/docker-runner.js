/**
 * Docker Phase Executor
 * Spawns Docker containers for phases, captures output, extracts metrics.
 * Enforces a per-phase timeout by killing the named container.
 */

const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_SECONDS = 1800;

/**
 * Effective timeout for a phase: phase.timeout_seconds, then
 * RUNNER_PHASE_TIMEOUT_SECONDS, then 1800. A value of 0 disables the timeout.
 */
function resolveTimeoutSeconds(phase) {
  if (typeof phase.timeout_seconds === 'number') return phase.timeout_seconds;
  const envValue = parseInt(process.env.RUNNER_PHASE_TIMEOUT_SECONDS || '', 10);
  if (!Number.isNaN(envValue)) return envValue;
  return DEFAULT_TIMEOUT_SECONDS;
}

/**
 * Build the `docker run` argument list for a phase.
 * The container is named so a timeout can kill it reliably.
 */
function buildDockerArgs(phase, containerName) {
  const args = ['run', '--rm', '--name', containerName];

  if (phase.env) {
    Object.entries(phase.env).forEach(([key, value]) => {
      args.push('-e', `${key}=${value}`);
    });
  }

  // Add --env-file if .env.local exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    args.push('--env-file', envPath);
  }

  // Attach to a Docker network (phase config or DOCKER_NETWORK env)
  const network = phase.network || process.env.DOCKER_NETWORK;
  if (network) {
    args.push('--network', network);
  }

  args.push(phase.container);
  if (phase.command && Array.isArray(phase.command)) {
    args.push(...phase.command);
  }

  return args;
}

function containerNameFor(phase) {
  const safeId = String(phase.id || 'phase').replace(/[^a-zA-Z0-9_.-]/g, '-');
  return `roadmap-runner-${safeId}-${Date.now()}`;
}

/**
 * Run a phase in Docker.
 * @param {Object} phase - Phase configuration from phase.yaml
 * @returns {Promise<Object>} { exitCode, stdout, stderr, metrics, timedOut }
 */
async function runPhase(phase) {
  return new Promise((resolve) => {
    if (!phase.container) {
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: 'No container specified in phase config',
        metrics: {},
        timedOut: false,
      });
      return;
    }

    const containerName = containerNameFor(phase);
    const args = buildDockerArgs(phase, containerName);
    const timeoutSeconds = resolveTimeoutSeconds(phase);

    console.log(`[DOCKER] ${phase.id}: docker ${args.join(' ')} (timeout=${timeoutSeconds}s)`);

    const proc = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let timer = null;

    if (timeoutSeconds > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        console.error(`[TIMEOUT] ${phase.id}: exceeded ${timeoutSeconds}s, killing ${containerName}`);
        // Kill the container itself — killing the docker CLI would leave it running.
        spawn('docker', ['kill', containerName], { stdio: 'ignore' });
      }, timeoutSeconds * 1000);
      timer.unref();
    }

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      process.stdout.write(chunk); // real-time output
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      process.stderr.write(chunk);
    });

    proc.on('close', (exitCode) => {
      if (timer) clearTimeout(timer);
      const metrics = extractMetrics(stdout);
      resolve({
        exitCode,
        stdout,
        stderr,
        metrics,
        timedOut,
      });
    });

    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout,
        stderr: `Docker error: ${err.message}`,
        metrics: {},
        timedOut,
      });
    });
  });
}

/**
 * Extract metrics from stdout (JSON lines format).
 * Looks for lines like: {"metric":"tokens_extracted","value":10}
 */
function extractMetrics(stdout) {
  const metrics = {};
  const lines = stdout.split('\n');

  for (const line of lines) {
    try {
      // Try parsing as JSON
      const obj = JSON.parse(line);
      if (obj.metric && obj.value !== undefined) {
        metrics[obj.metric] = obj.value;
      }
    } catch {
      // Not JSON, skip
    }
  }

  return metrics;
}

module.exports = { runPhase, extractMetrics, buildDockerArgs, resolveTimeoutSeconds };
