/**
 * Runner metrics recorder.
 * Appends one event per phase attempt to runner-metrics/runs.jsonl and
 * maintains per-phase aggregates in runner-metrics/summary.json.
 * Override the directory with RUNNER_METRICS_DIR.
 */

const fs = require('fs');
const path = require('path');

function metricsDir() {
  return process.env.RUNNER_METRICS_DIR || path.join(__dirname, '..', 'runner-metrics');
}

/**
 * @param {Object} run
 *   { phaseId, attempt, success, exitCode, durationSeconds, timedOut, startedAt, finishedAt }
 */
function recordRun(run) {
  const dir = metricsDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'runs.jsonl'), JSON.stringify(run) + '\n', 'utf8');
  updateSummary(run);
}

function loadSummary() {
  try {
    return JSON.parse(fs.readFileSync(path.join(metricsDir(), 'summary.json'), 'utf8'));
  } catch {
    return { version: 1, phases: {} };
  }
}

function updateSummary(run) {
  const summary = loadSummary();
  const p = summary.phases[run.phaseId] || {
    runs: 0,
    successes: 0,
    failures: 0,
    timeouts: 0,
    retries: 0,
    totalDurationSeconds: 0,
  };

  p.runs += 1;
  if (run.success) p.successes += 1;
  else p.failures += 1;
  if (run.timedOut) p.timeouts += 1;
  if (run.attempt > 1) p.retries += 1;
  p.totalDurationSeconds = +(p.totalDurationSeconds + (run.durationSeconds || 0)).toFixed(1);
  p.avgDurationSeconds = +(p.totalDurationSeconds / p.runs).toFixed(1);
  p.lastRunAt = run.finishedAt;
  p.lastSuccess = run.success;

  summary.phases[run.phaseId] = p;
  summary.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(metricsDir(), 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}

module.exports = { recordRun, loadSummary, metricsDir };
