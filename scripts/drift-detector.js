#!/usr/bin/env node

/**
 * CIC Visual Drift Detector
 * Detects pixel-level visual regressions across dashboard panels
 * Usage: node drift-detector.js [--baseline|--compare|--report]
 */

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PANELS = [
  "agents",
  "ingestion",
  "memory",
  "drift",
  "settings",
  "dashboard",
];

const BASELINE_DIR = path.join(__dirname, "../snapshots/baseline");
const CURRENT_DIR = path.join(__dirname, "../snapshots/current");
const DIFF_DIR = path.join(__dirname, "../snapshots/diff");
const REPORT_PATH = path.join(__dirname, "../snapshots/drift-report.json");

const DRIFT_THRESHOLD = 50;

function ensureDirectories() {
  [BASELINE_DIR, CURRENT_DIR, DIFF_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function loadSnapshot(panel, dir) {
  const filePath = path.join(dir, `${panel}.png`);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Snapshot not found: ${filePath}`);
    return null;
  }

  try {
    return PNG.sync.read(fs.readFileSync(filePath));
  } catch (err) {
    console.error(`❌ Failed to load ${filePath}:`, err.message);
    return null;
  }
}

function saveSnapshot(data, panel, dir) {
  const filePath = path.join(dir, `${panel}.png`);
  fs.writeFileSync(filePath, PNG.sync.write(data));
  console.log(`✓ Saved: ${filePath}`);
}

function detectDrift(panel) {
  const baseline = loadSnapshot(panel, BASELINE_DIR);
  const current = loadSnapshot(panel, CURRENT_DIR);

  if (!baseline || !current) {
    return {
      panel,
      status: "missing",
      mismatches: 0,
      percentDrift: 0,
      message: "Baseline or current snapshot missing",
    };
  }

  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      panel,
      status: "size-mismatch",
      mismatches: 0,
      percentDrift: 100,
      message: `Size mismatch: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}`,
    };
  }

  const diff = new PNG({ width: baseline.width, height: baseline.height });

  const mismatches = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: 0.1 }
  );

  const totalPixels = baseline.width * baseline.height;
  const percentDrift = (mismatches / totalPixels) * 100;

  if (mismatches > DRIFT_THRESHOLD) {
    saveSnapshot(diff, panel, DIFF_DIR);
    return {
      panel,
      status: "drift-detected",
      mismatches,
      percentDrift: percentDrift.toFixed(2),
      message: `Drift detected: ${mismatches} pixels (${percentDrift.toFixed(2)}%)`,
      diffPath: path.join(DIFF_DIR, `${panel}.png`),
    };
  }

  return {
    panel,
    status: "stable",
    mismatches,
    percentDrift: percentDrift.toFixed(4),
    message: `Stable: ${mismatches} pixels (${percentDrift.toFixed(4)}%)`,
  };
}

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    threshold: DRIFT_THRESHOLD,
    panels: [],
    summary: {
      total: PANELS.length,
      stable: 0,
      drift: 0,
      missing: 0,
      totalMismatches: 0,
    },
  };

  PANELS.forEach((panel) => {
    const result = detectDrift(panel);
    report.panels.push(result);

    if (result.status === "stable") {
      report.summary.stable += 1;
    } else if (result.status === "drift-detected") {
      report.summary.drift += 1;
      report.summary.totalMismatches += result.mismatches;
    } else {
      report.summary.missing += 1;
    }
  });

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  return report;
}

function printReport(report) {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║           CIC VISUAL DRIFT DETECTOR REPORT              ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Drift Threshold: ${DRIFT_THRESHOLD} pixels\n`);

  report.panels.forEach(({ panel, status, mismatches, percentDrift, message }) => {
    const icon =
      status === "stable"
        ? "✓"
        : status === "drift-detected"
          ? "⚠️ "
          : status === "size-mismatch"
            ? "❌"
            : "⚪";

    console.log(`${icon} ${panel.padEnd(15)} ${message}`);
  });

  console.log(`\nSummary:`);
  console.log(`  Stable:  ${report.summary.stable}/${report.summary.total}`);
  console.log(`  Drift:   ${report.summary.drift}/${report.summary.total}`);
  console.log(`  Missing: ${report.summary.missing}/${report.summary.total}`);
  console.log(`  Total Mismatches: ${report.summary.totalMismatches} pixels\n`);

  if (report.summary.drift > 0) {
    console.log("⚠️  DRIFT DETECTED — Review diff files in:");
    console.log(`   ${DIFF_DIR}\n`);
    process.exit(1);
  } else {
    console.log("✓ All panels stable.\n");
    process.exit(0);
  }
}

function printHelp() {
  console.log(`
CIC Visual Drift Detector

Usage:
  node drift-detector.js [command]

Commands:
  --baseline   Save current snapshots as baseline
  --compare    Compare current against baseline
  --report     Generate drift report (default)
  --help       Show this help message

Examples:
  node drift-detector.js --baseline    # Save baseline snapshots
  node drift-detector.js --compare     # Run drift detection
  node drift-detector.js --report      # Generate full report
`);
}

async function main() {
  ensureDirectories();

  const command = process.argv[2] || "--report";

  switch (command) {
    case "--baseline":
      console.log("Baseline mode: Copy current → baseline\n");
      PANELS.forEach((panel) => {
        const current = loadSnapshot(panel, CURRENT_DIR);
        if (current) {
          saveSnapshot(current, panel, BASELINE_DIR);
        }
      });
      break;

    case "--compare":
      console.log("Compare mode: Drift detection\n");
      const report = generateReport();
      printReport(report);
      break;

    case "--report":
      const fullReport = generateReport();
      printReport(fullReport);
      break;

    case "--help":
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(console.error);
