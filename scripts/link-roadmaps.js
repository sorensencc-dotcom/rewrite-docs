#!/usr/bin/env node
/**
 * Rewrite Labs → CIC Roadmap Linker
 * Generates a cross-system dependency map based on shared tokens.
 *
 * Usage:
 *   node scripts/link-roadmaps.js
 */

const fs = require("fs");
const path = require("path");

const RL_DIR = path.join("docs", "meta");
const CIC_DIR = path.join("docs", "cic");

function loadFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return [];
  }
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md"))
    .map(f => path.join(dir, f));
}

function extractTokens(text) {
  const tokens = new Set();
  const regex = /\b[A-Z][A-Z0-9_]+\b/g;
  let m;
  while ((m = regex.exec(text)) !== null) tokens.add(m[0]);
  return tokens;
}

function main() {
  const rlFiles = loadFiles(RL_DIR);
  const cicFiles = loadFiles(CIC_DIR);

  if (rlFiles.length === 0 && cicFiles.length === 0) {
    console.log("No roadmap files found in docs/meta/ or docs/cic/");
    process.exit(0);
  }

  const rlTokens = new Map();
  const cicTokens = new Map();

  rlFiles.forEach(f => {
    const text = fs.readFileSync(f, "utf8");
    rlTokens.set(f, extractTokens(text));
  });

  cicFiles.forEach(f => {
    const text = fs.readFileSync(f, "utf8");
    cicTokens.set(f, extractTokens(text));
  });

  console.log("=== RL → CIC ROADMAP LINKS ===\n");

  let linkCount = 0;
  rlTokens.forEach((rlSet, rlFile) => {
    cicTokens.forEach((cicSet, cicFile) => {
      const intersection = [...rlSet].filter(t => cicSet.has(t));
      if (intersection.length > 0) {
        console.log(`RL: ${path.basename(rlFile)} → CIC: ${path.basename(cicFile)}`);
        console.log(`  Shared tokens: ${intersection.slice(0, 5).join(", ")}${intersection.length > 5 ? "..." : ""}`);
        console.log();
        linkCount++;
      }
    });
  });

  if (linkCount === 0) {
    console.log("No shared tokens found between RL and CIC roadmaps.");
  }
}

main();
