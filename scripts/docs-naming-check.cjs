#!/usr/bin/env node
/**
 * docs-naming-check.cjs
 * Reports naming violations in docs/.
 * Compliance rule: lowercase-with-hyphens.md (allows leading digits)
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");

function walk(dir, fn) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full, fn);
      } else {
        fn(full, e.name);
      }
    }
  } catch (e) {
    console.error(`Error reading ${dir}: ${e.message}`);
  }
}

function isCompliant(name) {
  if (!name.endsWith(".md")) return true;
  const base = name.replace(/\.md$/, "");
  // Allow: lowercase letters, digits, hyphens
  // Must start with digit or letter (not hyphen)
  return /^[a-z0-9][a-z0-9\-]*$/.test(base);
}

console.log("\n=== docs naming compliance check ===\n");

const violations = [];
walk(DOCS, (full, name) => {
  if (!name.endsWith(".md")) return;
  if (!isCompliant(name)) {
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    violations.push(rel);
  }
});

if (violations.length === 0) {
  console.log("✓ All docs files follow lowercase-with-hyphens.md naming.");
} else {
  console.log(`❌ Found ${violations.length} naming violation(s):\n`);
  violations.forEach(v => console.log(`  - ${v}`));
}

console.log();
process.exit(violations.length > 0 ? 1 : 0);
