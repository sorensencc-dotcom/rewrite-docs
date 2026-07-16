#!/usr/bin/env node
/**
 * CIC/Rewrite Labs Topology Validator
 * Validates RULE-1 compliance:
 * - No deliverable markdown in root (except CLAUDE.md, README.md)
 * - All docs under docs/
 * - No mangled path-artifact directories
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");

// Blessed root files (exceptions to markdown rule)
const BLESSED_ROOT_FILES = ["CLAUDE.md", "README.md", ".gitignore"];

// Directories that must NOT exist (mangled path artifacts)
const FORBIDDEN_DIRS = [
  "c:devapiopenapi",
  "C:devgovernance",
  "c:devcicadaptersgateway",
  "c:devcicbudget_ledgerapi",
  "c:devconfig"
];

function validateForbiddenDirs() {
  const violations = [];
  FORBIDDEN_DIRS.forEach(d => {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) {
      violations.push(`Forbidden directory exists: ${full}`);
    }
  });
  return violations;
}

function validateRootMarkdown() {
  const files = fs.readdirSync(ROOT);
  const violations = [];

  files.forEach(f => {
    if (f.endsWith(".md") && !BLESSED_ROOT_FILES.includes(f)) {
      violations.push(`Root markdown violates RULE-1: ${f}`);
    }
  });

  return violations;
}

function validateDocsExists() {
  return fs.existsSync(DOCS) ? [] : ["docs/ directory missing"];
}

function main() {
  const violations = [
    ...validateForbiddenDirs(),
    ...validateRootMarkdown(),
    ...validateDocsExists()
  ];

  if (violations.length === 0) {
    console.log("✔ Topology valid");
    process.exit(0);
  }

  console.log("❌ Topology violations:");
  violations.forEach(v => console.log(" - " + v));
  process.exit(1);
}

main();
