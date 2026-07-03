#!/usr/bin/env node
/**
 * Docker Image Drift Detector v1.0.0
 * Detects when Docker images are stale relative to source code
 *
 * Compares:
 * - Source directory hash (files + timestamps)
 * - Image label hash (built at image creation time)
 *
 * Usage:
 *   node docker-drift-detector.js [--manifest docker/image-manifest.json] [--watch] [--json]
 */

import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { argv } from 'process';

const args = {
  manifest: 'docker/image-manifest.json',
  watch: false,
  json: false,
};

// Parse CLI args
for (let i = 2; i < argv.length; i++) {
  if (argv[i] === '--manifest') args.manifest = argv[++i];
  if (argv[i] === '--watch') args.watch = true;
  if (argv[i] === '--json') args.json = true;
}

// ============================================================================
// UTILITIES
// ============================================================================

const log = {
  info: (msg) => console.log(`ℹ ${msg}`),
  pass: (msg) => console.log(`✓ ${msg}`),
  fail: (msg) => console.log(`✗ ${msg}`),
  warn: (msg) => console.log(`⚠ ${msg}`),
};

function hashDirectory(dirPath) {
  try {
    const files = execSync(`find "${dirPath}" -type f 2>/dev/null | sort`, {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter((f) => f);

    if (files.length === 0) return null;

    const hash = createHash('sha256');

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const stat = statSync(file);
        hash.update(`${file}:${content}:${stat.mtime.toISOString()}`);
      } catch (e) {
        // Skip unreadable files
      }
    }

    return hash.digest('hex');
  } catch (e) {
    return null;
  }
}

function getImageLabel(imageName, label) {
  try {
    const output = execSync(
      `docker inspect "${imageName}" --format='{{ index .Config.Labels "${label}" }}'`,
      { encoding: 'utf8' },
    ).trim();
    return output || null;
  } catch (e) {
    return null;
  }
}

function imageExists(imageName) {
  try {
    execSync(`docker images "${imageName}" --quiet | grep -q .`, {
      stdio: 'pipe',
    });
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// DRIFT CHECK
// ============================================================================

function checkDrift(manifest) {
  const results = {
    timestamp: new Date().toISOString(),
    total_services: 0,
    checked_services: 0,
    drift_detected: 0,
    services: [],
  };

  for (const [service, config] of Object.entries(manifest.services)) {
    results.total_services++;

    // Skip external services
    if (config.type === 'external') {
      continue;
    }

    results.checked_services++;

    // Skip if no build config
    if (!config.dockerfile || !config.context) {
      continue;
    }

    // Check if image exists
    if (!imageExists(service)) {
      results.services.push({
        service,
        status: 'missing',
        message: 'Image does not exist',
      });
      continue;
    }

    // Get source hash
    const sourceHash = hashDirectory(config.context);
    if (!sourceHash) {
      results.services.push({
        service,
        status: 'error',
        message: 'Could not hash source directory',
      });
      continue;
    }

    // Get image hash
    const imageHash = getImageLabel(`${service}:latest`, 'build.source.hash');
    if (!imageHash) {
      results.services.push({
        service,
        status: 'unknown',
        message: 'Image has no source hash label (old build?)',
        source_hash: sourceHash,
      });
      results.drift_detected++;
      continue;
    }

    // Compare
    if (sourceHash === imageHash) {
      results.services.push({
        service,
        status: 'ok',
        message: 'Source and image hashes match',
      });
    } else {
      results.services.push({
        service,
        status: 'drift',
        message: 'Source code changed since image built',
        source_hash: sourceHash,
        image_hash: imageHash,
      });
      results.drift_detected++;
    }
  }

  return results;
}

// ============================================================================
// WATCH MODE
// ============================================================================

function watchMode(manifestPath) {
  log.info(`Watching for drift (press Ctrl+C to stop)...`);

  let lastResults = null;

  setInterval(() => {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const results = checkDrift(manifest);

      if (lastResults && results.drift_detected !== lastResults.drift_detected) {
        if (results.drift_detected > lastResults.drift_detected) {
          log.warn(
            `Drift increased: ${lastResults.drift_detected} -> ${results.drift_detected}`,
          );
        } else {
          log.pass(
            `Drift resolved: ${lastResults.drift_detected} -> ${results.drift_detected}`,
          );
        }

        for (const svc of results.services) {
          if (!lastResults.services.find((s) => s.service === svc.service)) {
            continue;
          }
          const oldStatus = lastResults.services.find(
            (s) => s.service === svc.service,
          ).status;
          if (oldStatus !== svc.status) {
            log.info(`  ${svc.service}: ${oldStatus} -> ${svc.status}`);
          }
        }
      }

      lastResults = results;
    } catch (e) {
      log.fail(`Watch error: ${e.message}`);
    }
  }, 5000);
}

// ============================================================================
// MAIN
// ============================================================================

try {
  const manifestContent = readFileSync(args.manifest, 'utf8');
  const manifest = JSON.parse(manifestContent);

  if (args.watch) {
    watchMode(args.manifest);
  } else {
    const results = checkDrift(manifest);

    if (args.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      log.info(`Drift detection: ${results.checked_services} services checked`);

      for (const svc of results.services) {
        if (svc.status === 'ok') {
          log.pass(`${svc.service}: ${svc.message}`);
        } else if (svc.status === 'drift') {
          log.warn(`${svc.service}: ${svc.message}`);
        } else if (svc.status === 'missing') {
          log.warn(`${svc.service}: ${svc.message}`);
        } else {
          log.info(`${svc.service}: ${svc.message}`);
        }
      }

      if (results.drift_detected > 0) {
        log.warn(
          `${results.drift_detected} service(s) have source drift. Run: ./scripts/image-builder.sh --force-rebuild`,
        );
        process.exit(1);
      } else {
        log.pass('No drift detected');
        process.exit(0);
      }
    }
  }
} catch (e) {
  log.fail(`Error: ${e.message}`);
  process.exit(1);
}
