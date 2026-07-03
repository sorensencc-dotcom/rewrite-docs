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

const GRAPH_PATH = path.join(__dirname, '..', 'docs', 'roadmap', 'ROADMAP_DEPENDENCY_GRAPH.json');
const STATE_PATH = path.join(__dirname, 'state-store.json');
const PHASES_DIR = path.join(__dirname, 'phases');

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

function loadPhaseConfig(id) {
  const yaml = require('js-yaml');
  const filePath = path.join(PHASES_DIR, `${id}.yaml`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
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
  console.log(`\n[EXEC] Starting phase: ${phaseId}`);

  const phaseConfig = loadPhaseConfig(phaseId);
  if (!phaseConfig) {
    console.error(`[FAIL] No phase config found for ${phaseId}`);
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

  const startTime = Date.now();
  const startedAt = new Date().toISOString();

  let result;
  try {
    state.phases[phaseId] = state.phases[phaseId] || { status: 'pending', runs: [] };
    state.phases[phaseId].status = 'running';
    saveState(state);

    result = await runPhase(phaseConfig);
  } catch (e) {
    console.error(`[ERROR] Phase execution error: ${e.message}`);
    result = { exitCode: 1, stdout: '', stderr: e.message, metrics: {} };
  }

  const finishedAt = new Date().toISOString();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  const success = await validateSuccessGates(phaseConfig, result);

  console.log(
    `[${success ? 'OK' : 'FAIL'}] Phase ${phaseId} | exit=${result.exitCode} | duration=${duration}s | gates=${success}`
  );

  if (success) {
    state.phases[phaseId].status = 'succeeded';
    state.phases[phaseId].lastRunAt = finishedAt;
  } else {
    state.phases[phaseId].status = 'failed';
    markDependentsBlocked(phaseId, graph, state);
  }

  state.phases[phaseId].runs = state.phases[phaseId].runs || [];
  state.phases[phaseId].runs.push({
    startedAt,
    finishedAt,
    exitCode: result.exitCode,
    success,
    duration: parseFloat(duration),
    metrics: result.metrics,
  });

  saveState(state);
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

main().catch((e) => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});

module.exports = { main };
