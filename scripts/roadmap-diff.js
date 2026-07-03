#!/usr/bin/env node
/**
 * Roadmap Diff Generator
 * Compares two roadmap markdown files line-by-line.
 * Usage:
 *   node scripts/roadmap-diff.js docs/cic/PHASE_23.md docs/cic/PHASE_23_v2.md
 */

const fs = require("fs");

function diff(a, b) {
  const aLines = a.split("\n");
  const bLines = b.split("\n");

  const out = [];
  let i = 0, j = 0;

  while (i < aLines.length || j < bLines.length) {
    const A = aLines[i] || "";
    const B = bLines[j] || "";

    if (A === B) {
      i++; j++;
      continue;
    }

    if (!bLines.includes(A)) {
      out.push(`- ${A}`);
      i++;
      continue;
    }

    if (!aLines.includes(B)) {
      out.push(`+ ${B}`);
      j++;
      continue;
    }

    i++; j++;
  }

  return out.join("\n");
}

function main() {
  const [oldFile, newFile] = process.argv.slice(2);

  if (!oldFile || !newFile) {
    console.error("Usage: node scripts/roadmap-diff.js <old.md> <new.md>");
    process.exit(1);
  }

  const oldText = fs.readFileSync(oldFile, "utf8");
  const newText = fs.readFileSync(newFile, "utf8");

  const output = diff(oldText, newText);

  console.log("=== ROADMAP DIFF ===");
  console.log(output || "No differences.");
}

main();
