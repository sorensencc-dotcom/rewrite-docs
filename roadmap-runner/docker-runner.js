/**
 * Docker Phase Executor
 * Spawns Docker containers for phases, captures output, extracts metrics.
 */

const { spawn } = require('child_process');

/**
 * Run a phase in Docker.
 * @param {Object} phase - Phase configuration from phase.yaml
 * @returns {Promise<Object>} { exitCode, stdout, stderr, metrics }
 */
async function runPhase(phase) {
  return new Promise((resolve) => {
    if (!phase.container) {
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: 'No container specified in phase config',
        metrics: {},
      });
      return;
    }

    // Build docker run arguments
    const args = ['run', '--rm'];

    // Add environment variables
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

    // Container and command
    args.push(phase.container);
    if (phase.command && Array.isArray(phase.command)) {
      args.push(...phase.command);
    }

    console.log(`[DOCKER] ${phase.id}: docker ${args.join(' ')}`);

    const proc = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

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
      const metrics = extractMetrics(stdout);
      resolve({
        exitCode,
        stdout,
        stderr,
        metrics,
      });
    });

    proc.on('error', (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: `Docker error: ${err.message}`,
        metrics: {},
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

module.exports = { runPhase, extractMetrics };
