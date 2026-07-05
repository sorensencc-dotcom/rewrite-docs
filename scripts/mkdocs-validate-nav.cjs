#!/usr/bin/env node
/**
 * mkdocs-validate-nav.cjs
 * Validates mkdocs.yml navigation against docs/ filesystem.
 * Reports files in nav but missing from disk, and vice versa.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const MKDOCS = path.join(ROOT, "mkdocs.yml");

// --- load mkdocs.yml ---
if (!fs.existsSync(MKDOCS)) {
  console.error("mkdocs.yml not found.");
  process.exit(1);
}

let mk;
try {
  mk = yaml.load(fs.readFileSync(MKDOCS, "utf8"));
} catch (e) {
  console.error(`Failed to parse mkdocs.yml: ${e.message}`);
  process.exit(1);
}

// --- extract all nav paths ---
function extractPaths(nav, paths = []) {
  if (Array.isArray(nav)) {
    nav.forEach(n => extractPaths(n, paths));
  } else if (typeof nav === "object" && nav !== null) {
    for (const k in nav) {
      const v = nav[k];
      if (typeof v === "string") {
        // v is a file path
        paths.push(v.replace(/\\/g, "/"));
      } else {
        // v is nested structure
        extractPaths(v, paths);
      }
    }
  }
  return paths;
}

const navPaths = extractPaths(mk.nav || []);

// --- collect actual docs files ---
const docsFiles = [];
function walkDocs(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walkDocs(full);
      } else if (e.name.endsWith(".md")) {
        docsFiles.push(path.relative(ROOT, full).replace(/\\/g, "/"));
      }
    }
  } catch (e) {
    console.error(`Error reading ${dir}: ${e.message}`);
  }
}
walkDocs(DOCS);

// --- validation ---
const missingInFS = navPaths.filter(p => !docsFiles.includes(p));
const missingInNav = docsFiles.filter(p => !navPaths.includes(p));

console.log("\n=== mkdocs navigation validator ===\n");

if (missingInFS.length > 0) {
  console.log("❌ Missing in filesystem (broken nav references):");
  missingInFS.forEach(p => console.log(`  - ${p}`));
} else {
  console.log("✓ All nav references exist in filesystem.");
}

console.log();

if (missingInNav.length > 0) {
  console.log("⚠️  Missing in mkdocs.yml (orphaned docs):");
  missingInNav.forEach(p => console.log(`  - ${p}`));
} else {
  console.log("✓ All docs files referenced in mkdocs.yml.");
}

console.log();

const exitCode = missingInFS.length > 0 || missingInNav.length > 0 ? 1 : 0;
process.exit(exitCode);
