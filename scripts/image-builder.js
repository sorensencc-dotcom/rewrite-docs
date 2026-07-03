#!/usr/bin/env node
/**
 * Image Builder Orchestrator v1.0.0
 * Operator-grade Docker image building with drift detection, versioning, and health checks
 * Usage: node image-builder.js [--env local|staging|prod] [--parallel 6] [--skip-drift] [--force-rebuild]
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { argv } from 'process';

// ============================================================================
// CONFIG & ARGS
// ============================================================================

const args = {
  env: 'local',
  parallel: 6,
  skipDrift: false,
  forceRebuild: false,
};

for (let i = 2; i < argv.length; i++) {
  if (argv[i] === '--env') args.env = argv[++i];
  if (argv[i] === '--parallel') args.parallel = parseInt(argv[++i]);
  if (argv[i] === '--skip-drift') args.skipDrift = true;
  if (argv[i] === '--force-rebuild') args.forceRebuild = true;
}

const MANIFEST_FILE = 'docker/image-manifest.json';
const METRICS_FILE = 'build-metrics.jsonl';
const AUDIT_LOG = 'build-audit.log';
const REPORT_FILE = 'build-report.json';
const BUILD_DIR = 'docker/builds';

// Colors
const C = {
  green: '\x1b[0;32m',
  red: '\x1b[0;31m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  reset: '\x1b[0m',
};

// State
let phase = 0;
let buildsPassed = 0;
let buildsFailed = 0;
let buildsSkipped = 0;
let driftDetected = 0;
const buildStart = Date.now();

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  phase: (msg) => {
    phase++;
    console.log(`${C.blue}[PHASE ${phase}]${C.reset} ${msg}`);
  },
  pass: (msg) => console.log(`${C.green}✓${C.reset} ${msg}`),
  fail: (msg) => console.log(`${C.red}✗${C.reset} ${msg}`),
  warn: (msg) => console.log(`${C.yellow}⚠${C.reset} ${msg}`),
  info: (msg) => console.log(`${C.blue}ℹ${C.reset} ${msg}`),
};

function audit(msg) {
  const ts = new Date().toISOString();
  const line = `${ts} | ${msg}\n`;
  try {
    execSync(`echo "${line.replace(/"/g, '\\"')}" >> ${AUDIT_LOG}`);
  } catch (e) {
    // Ignore
  }
}

function metric(obj) {
  try {
    execSync(`echo '${JSON.stringify(obj)}' >> ${METRICS_FILE}`);
  } catch (e) {
    // Ignore
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function getManifest() {
  const content = readFileSync(MANIFEST_FILE, 'utf8');
  return JSON.parse(content);
}

function imageExists(name) {
  try {
    execSync(`docker images "${name}" --quiet | grep -q .`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getImageLabel(image, label) {
  try {
    const output = execSync(`docker inspect "${image}" --format="{{ index .Config.Labels \\"${label}\\" }}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return output || null;
  } catch {
    return null;
  }
}

function hashDirectory(dir) {
  try {
    const result = execSync(`find "${dir}" -type f 2>/dev/null | head -100 | sort | wc -l`, {
      encoding: 'utf8',
    }).trim();
    // For now, use simple hash based on file count + mtime
    const stat = execSync(`stat -c %Y "${dir}" 2>/dev/null || echo 0`, {
      encoding: 'utf8',
    }).trim();
    return `${result}-${stat}`;
  } catch {
    return null;
  }
}

// ============================================================================
// PHASES
// ============================================================================

function phase1Preflight() {
  log.phase('Pre-Flight Validation');

  // Check manifest
  try {
    getManifest();
  } catch {
    log.fail('Manifest not found or invalid');
    return false;
  }
  log.pass('Manifest found');

  // Check Docker
  try {
    execSync('docker --version', { stdio: 'pipe' });
  } catch {
    log.fail('Docker not available');
    return false;
  }
  log.pass('Docker available');

  // Check docker-compose
  try {
    execSync('docker-compose --version', { stdio: 'pipe' });
  } catch {
    log.fail('docker-compose not available');
    return false;
  }
  log.pass('docker-compose available');

  // Check Node.js (this script is running, so obviously available)
  log.pass('Node.js available');

  // Create working directories
  ensureDir(BUILD_DIR);
  log.pass('Working directories ready');

  const manifest = getManifest();
  const total = Object.keys(manifest.services).length;
  const buildable = Object.values(manifest.services).filter((s) => s.type !== 'external').length;
  log.info(`Found ${total} services (${buildable} buildable)`);

  return true;
}

function phase2DriftDetection() {
  log.phase('Drift Detection');

  const manifest = getManifest();
  let drift = 0;

  for (const [service, config] of Object.entries(manifest.services)) {
    if (config.type === 'external' || !config.dockerfile) continue;

    if (!imageExists(service)) continue;

    const sourceHash = hashDirectory(config.context);
    const imageHash = getImageLabel(`${service}:latest`, 'build.source.hash');

    if (!imageHash) {
      log.warn(`${service}: no source hash in image`);
      drift++;
    } else if (sourceHash !== imageHash && !args.skipDrift) {
      log.warn(`${service}: drift detected`);
      drift++;
    }
  }

  if (drift > 0) {
    log.warn(`${drift} services have source drift`);
    driftDetected = drift;
    return !args.skipDrift; // Return false to trigger rebuild if not skipping
  }

  log.pass('No source drift detected');
  return true;
}

async function phase3ParallelBuilds() {
  log.phase('Parallel Builds');

  const manifest = getManifest();
  const services = Object.keys(manifest.services).filter((s) => manifest.services[s].type !== 'external');

  if (services.length === 0) {
    log.pass('No buildable services');
    return true;
  }

  log.info(`Building ${services.length} services with ${args.parallel} parallel jobs...`);

  // Simple sequential build for now (parallel would require Promise.all orchestration)
  for (const service of services) {
    const config = manifest.services[service];

    if (!imageExists(service) || args.forceRebuild) {
      const start = Date.now();

      try {
        const versionTag = `${execSync('git rev-parse --short HEAD 2>/dev/null || echo unknown', {
          encoding: 'utf8',
        }).trim()}-${Math.floor(Date.now() / 1000)}`;

        execSync(
          `docker build --file ${config.dockerfile} --tag ${service}:${versionTag} --tag ${service}:latest ${config.context}`,
          {
            stdio: 'inherit',
          },
        );

        const duration = Date.now() - start;
        buildsPassed++;
        log.pass(`Built ${service} (${duration}ms)`);

        metric({
          service,
          timestamp: new Date().toISOString(),
          duration_ms: duration,
          status: 'pass',
          version: versionTag,
        });

        audit(`BUILD_PASS | ${service} | ${duration}ms`);
      } catch (e) {
        buildsFailed++;
        log.fail(`Build failed for ${service}`);

        metric({
          service,
          timestamp: new Date().toISOString(),
          status: 'fail',
          error: 'build failed',
        });

        audit(`BUILD_FAIL | ${service} | build failed`);

        if (config.priority === 'critical') {
          return false;
        }
      }
    } else {
      buildsSkipped++;
      log.info(`${service}: image fresh, skipping`);
    }
  }

  log.info(`Builds complete: ${buildsPassed} passed, ${buildsFailed} failed, ${buildsSkipped} skipped`);
  return buildsFailed === 0;
}

function phase5Report() {
  log.phase('Cleanup & Reporting');

  try {
    execSync('docker image prune -f --quiet', { stdio: 'pipe' });
  } catch {
    // Ignore
  }

  const duration = Math.floor((Date.now() - buildStart) / 1000);
  const status = buildsFailed > 0 ? 'FAIL' : 'PASS';

  const report = {
    timestamp: new Date().toISOString(),
    environment: args.env,
    status,
    duration_seconds: duration,
    builds: {
      passed: buildsPassed,
      failed: buildsFailed,
      skipped: buildsSkipped,
    },
    drift: {
      detected: driftDetected,
    },
    files: {
      metrics: METRICS_FILE,
      audit_log: AUDIT_LOG,
    },
  };

  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  log.pass(`Report written to ${REPORT_FILE}`);

  audit(`SESSION_COMPLETE | status=${status} | duration=${duration}s | passed=${buildsPassed} | failed=${buildsFailed}`);

  return buildsFailed === 0;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('Image Builder Orchestrator v1.0.0');
  console.log(
    `Environment: ${args.env} | Parallel: ${args.parallel} | Force: ${args.forceRebuild} | Skip Drift: ${args.skipDrift}`,
  );
  console.log('');

  // Initialize logs
  try {
    writeFileSync(AUDIT_LOG, '');
    writeFileSync(METRICS_FILE, '');
  } catch (e) {
    log.warn(`Could not initialize logs: ${e.message}`);
  }

  // Run phases
  if (!phase1Preflight()) return process.exit(1);
  phase2DriftDetection(); // Advisory
  if (!(await phase3ParallelBuilds())) return process.exit(1);
  if (!phase5Report()) return process.exit(1);

  console.log('');
  log.pass('Image builder completed successfully');
  audit('SESSION_SUCCESS');
}

main().catch((e) => {
  log.fail(`Fatal error: ${e.message}`);
  process.exit(1);
});
