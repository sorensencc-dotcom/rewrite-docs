/**
 * Structured logger for roadmap-runner.
 * Emits human-readable lines to the console and JSON lines to logs/runner.jsonl.
 * Override the log file with RUNNER_LOG_FILE.
 */

const fs = require('fs');
const path = require('path');

function logFilePath() {
  return process.env.RUNNER_LOG_FILE || path.join(__dirname, '..', 'logs', 'runner.jsonl');
}

function write(level, event, fields = {}) {
  const entry = { ts: new Date().toISOString(), level, event, ...fields };

  try {
    const file = logFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // console output below still happens
  }

  const extra = Object.entries(fields)
    .map(([k, v]) => `${k}=${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}`)
    .join(' ');
  const line = `[${event.toUpperCase()}]${extra ? ' ' + extra : ''}`;
  (level === 'error' ? console.error : console.log)(line);

  return entry;
}

module.exports = {
  info: (event, fields) => write('info', event, fields),
  warn: (event, fields) => write('warn', event, fields),
  error: (event, fields) => write('error', event, fields),
  logFilePath,
};
