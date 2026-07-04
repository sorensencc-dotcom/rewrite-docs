#!/usr/bin/env node

/**
 * Roadmap Execution Scheduler
 * Loads compiled roadmap graph, determines runnable phases, executes via Docker, validates gates.
 *
 * Usage:
 *   node scheduler.js --once
 *   node scheduler.js --loop --interval 60
 *   node scheduler.js --phase RL-4.0
 */

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');
const { runPhase } = require('./docker-runner');
const { validateSuccessGates } = require('./success-gate-validator');
const log = require('./lib/logger');
const runnerMetrics = require('./lib/runner-metrics');

const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_BACKOFF_SECONDS = 10;

/**
 * Retry policy for a phase: phase.retry.{max_attempts,backoff_seconds},
 * then RUNNER_MAX_ATTEMPTS / RUNNER_BACKOFF_SECONDS, then defaults (2, 10).
 * Backoff is exponential: backoff * 2^(attempt-1).
 */
function resolveRetryPolicy(phaseConfig) {
  const retry = (phaseConfig && phaseConfig.retry) || {};
  const envAttempts = parseInt(process.env.RUNNER_MAX_ATTEMPTS || '', 10);
  const envBackoff = parseInt(process.env.RUNNER_BACKOFF_SECONDS || '', 10);
  return {
    maxAttempts:
      typeof retry.max_attempts === 'number'
        ? retry.max_attempts
        : !Number.isNaN(envAttempts)
          ? envAttempts
          : DEFAULT_MAX_ATTEMPTS,
    backoffSeconds:
      typeof retry.backoff_seconds === 'number'
        ? retry.backoff_seconds
        : !Number.isNaN(envBackoff)
          ? envBackoff
          : DEFAULT_BACKOFF_SECONDS,
  };
}

const GRAPH_PATH =
  process.env.ROADMAP_GRAPH_PATH ||
  path.join(__dirname, '..', 'TheFoundry', 'out', 'roadmap', 'ROADMAP_DEPENDENCY_GRAPH.json');
const STATE_PATH = process.env.RUNNER_STATE_PATH || path.join(__dirname, 'state-store.json');
const PHASES_DIR = process.env.RUNNER_PHASES_DIR || path.join(__dirname, 'phases');
const LOGS_DIR = process.env.RUNNER_LOGS_DIR || path.join(__dirname, 'logs');

function loadGraph() {
  try {
    const content = fs.readFileSync(GRAPH_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`[ERROR] Failed to load ROADMAP_DEPENDENCY_GRAPH.json: ${e.message}`);
    return { nodes: [], edges: [] };
  }
}

function loadState() {
  try {
    const content = fs.readFileSync(STATE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.log(`[INIT] Creating new state-store.json`);
    return { version: 'v3.0', phases: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function loadEnvLocal() {
  const env = {};
  const envPath = path.join(__dirname, '.env.local');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // no .env.local — process.env only
  }
  return { ...env, ...process.env };
}

/**
 * Resolve env placeholders in phase config strings.
 * Handles ${VAR} / ${VAR:-default} anywhere, and the bare REGISTRY/ prefix
 * in container refs (REGISTRY empty → plain local tag).
 */
function substituteEnv(value, env) {
  if (typeof value === 'string') {
    let out = value.replace(/\$\{(\w+)(?::-([^}]*))?\}/g, (_, name, def) =>
      env[name] !== undefined && env[name] !== '' ? env[name] : (def || '')
    );
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituteEnv(v, env));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = substituteEnv(v, env);
    }
    return out;
  }
  return value;
}

function loadPhaseConfig(id) {
  const yaml = require('js-yaml');
  const filePath = path.join(PHASES_DIR, `${id}.yaml`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = loadEnvLocal();
    const config = substituteEnv(yaml.load(content), env);
    if (config && typeof config.container === 'string' && config.container.startsWith('REGISTRY/')) {
      const registry = env.REGISTRY;
      config.container = registry
        ? `${registry}/${config.container.slice('REGISTRY/'.length)}`
        : config.container.slice('REGISTRY/'.length);
    }
    return config;
  } catch (e) {
    console.error(`[ERROR] Failed to load phase config ${id}: ${e.message}`);
    return null;
  }
}

function getRunnablePhases(graph, state) {
  const runnable = [];

  for (const node of graph.nodes || []) {
    const phaseId = node.id;
    const phaseState = state.phases[phaseId] || { status: 'pending', runs: [] };

    // Already succeeded or running
    if (phaseState.status === 'succeeded' || phaseState.status === 'running') {
      continue;
    }

    // Blocked by failed dependency
    if (phaseState.status === 'blocked') {
      continue;
    }

    // Check if all dependencies are satisfied
    const dependencies = (graph.edges || [])
      .filter((e) => e.to === phaseId)
      .map((e) => e.from);

    let allDepsSucceeded = true;
    for (const dep of dependencies) {
      const depState = state.phases[dep];
      if (!depState || depState.status !== 'succeeded') {
        allDepsSucceeded = false;
        break;
      }
    }

    if (allDepsSucceeded) {
      runnable.push(phaseId);
    }
  }

  return runnable;
}

async function executePhase(phaseId, graph, state) {
  log.info('exec', { phase: phaseId });

  const phaseConfig = loadPhaseConfig(phaseId);
  if (!phaseConfig) {
    log.error('fail', { phase: phaseId, reason: 'No phase config' });
    state.phases[phaseId] = {
      status: 'failed',
      lastRunAt: new Date().toISOString(),
      runs: [
        {
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          exitCode: 1,
          success: false,
          reason: 'No phase config',
        },
      ],
    };
    markDependentsBlocked(phaseId, graph, state);
    saveState(state);
    return;
  }

  const { maxAttempts, backoffSeconds } = resolveRetryPolicy(phaseConfig);
  state.phases[phaseId] = state.phases[phaseId] || { status: 'pending', runs: [] };
  state.phases[phaseId].runs = state.phases[phaseId].runs || [];

  let success = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const delaySeconds = backoffSeconds * Math.pow(2, attempt - 2);
      log.warn('retry', { phase: phaseId, attempt, of: maxAttempts, backoffSeconds: delaySeconds });
      await new Promise((r) => setTimeout(r, delaySeconds * 1000));
    }

    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    let result;
    try {
      state.phases[phaseId].status = 'running';
      saveState(state);

      result = await runPhase(phaseConfig);
    } catch (e) {
      log.error('exec_error', { phase: phaseId, attempt, error: e.message });
      result = { exitCode: 1, stdout: '', stderr: e.message, metrics: {}, timedOut: false };
    }

    const finishedAt = new Date().toISOString();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    const { passed, gates } = await validateSuccessGates(phaseConfig, result);
    success = passed;

    log.info(success ? 'ok' : 'fail', {
      phase: phaseId,
      attempt,
      exit: result.exitCode,
      durationSeconds: parseFloat(duration),
      timedOut: !!result.timedOut,
      gates: success,
    });

    // Persist run artifacts: logs/<phaseId>/<timestamp>/{stdout.log,stderr.log,metrics.json,gates.json}
    let logDir = null;
    try {
      const ts = startedAt.replace(/[:.]/g, '-');
      logDir = path.join(LOGS_DIR, phaseId, ts);
      fs.mkdirSync(logDir, { recursive: true });
      fs.writeFileSync(path.join(logDir, 'stdout.log'), result.stdout, 'utf8');
      fs.writeFileSync(path.join(logDir, 'stderr.log'), result.stderr, 'utf8');
      fs.writeFileSync(path.join(logDir, 'metrics.json'), JSON.stringify(result.metrics, null, 2), 'utf8');
      fs.writeFileSync(path.join(logDir, 'gates.json'), JSON.stringify({ success, gates }, null, 2), 'utf8');
    } catch (e) {
      log.warn('log_persist_failed', { phase: phaseId, error: e.message });
      logDir = null;
    }

    state.phases[phaseId].runs.push({
      startedAt,
      finishedAt,
      exitCode: result.exitCode,
      success,
      attempt,
      timedOut: !!result.timedOut,
      duration: parseFloat(duration),
      metrics: result.metrics,
      logDir: logDir ? path.relative(__dirname, logDir) : null,
    });

    try {
      runnerMetrics.recordRun({
        phaseId,
        attempt,
        success,
        exitCode: result.exitCode,
        durationSeconds: parseFloat(duration),
        timedOut: !!result.timedOut,
        startedAt,
        finishedAt,
      });
    } catch (e) {
      log.warn('metrics_record_failed', { phase: phaseId, error: e.message });
    }

    if (success) {
      state.phases[phaseId].status = 'succeeded';
      state.phases[phaseId].lastRunAt = finishedAt;
      saveState(state);
      break;
    }
  }

  if (!success) {
    state.phases[phaseId].status = 'failed';
    markDependentsBlocked(phaseId, graph, state);
    saveState(state);
  }
}

function markDependentsBlocked(failedPhaseId, graph, state) {
  const dependents = (graph.edges || [])
    .filter((e) => e.from === failedPhaseId)
    .map((e) => e.to);

  for (const depId of dependents) {
    if (state.phases[depId] && state.phases[depId].status === 'pending') {
      state.phases[depId].status = 'blocked';
      markDependentsBlocked(depId, graph, state);
    }
  }
}

async function main() {
  const options = {
    once: { type: 'boolean', default: true },
    loop: { type: 'boolean', default: false },
    interval: { type: 'string', default: '60' },
    phase: { type: 'string' },
  };

  const { values } = parseArgs({ options, allowPositionals: false });

  const graph = loadGraph();
  let state = loadState();

  console.log(`[START] Roadmap Scheduler v3.0 | ${new Date().toISOString()}`);
  console.log(`[GRAPH] Loaded ${graph.nodes?.length || 0} phases, ${graph.edges?.length || 0} dependencies`);

  let iteration = 0;
  while (true) {
    iteration++;
    console.log(`\n[LOOP ${iteration}] Checking runnable phases...`);

    state = loadState(); // reload state
    const runnable = values.phase ? [values.phase] : getRunnablePhases(graph, state);

    if (runnable.length === 0) {
      console.log('[IDLE] No runnable phases. Waiting...');
      if (!values.loop) break;
      await new Promise((r) => setTimeout(r, parseInt(values.interval) * 1000));
      continue;
    }

    for (const phaseId of runnable) {
      await executePhase(phaseId, graph, state);
      state = loadState(); // reload after each execution
    }

    if (!values.loop) break;
    await new Promise((r) => setTimeout(r, parseInt(values.interval) * 1000));
  }

  console.log(`\n[END] Scheduler completed at ${new Date().toISOString()}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`[FATAL] ${e.message}`);
    process.exit(1);
  });
}

module.exports = { main, loadPhaseConfig, loadGraph, substituteEnv, executePhase, resolveRetryPolicy };
