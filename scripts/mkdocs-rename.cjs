#!/usr/bin/env node
/**
 * mkdocs-rename.cjs
 * Deterministic rename + mkdocs.yml reference updater
 * - Scans docs/ recursively
 * - Renames UPPERCASE_UNDERSCORE.md → lowercase-with-hyphens.md
 * - Updates mkdocs.yml references via proper YAML parsing (not string replacement)
 * - Preserves directory structure
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const MKDOCS = path.join(ROOT, "mkdocs.yml");

// --- helpers ---
function walk(dir, fn) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, fn);
    } else {
      fn(full, e.name);
    }
  }
}

function toKebab(name) {
  if (!name.endsWith(".md")) return name;
  const base = name.replace(/\.md$/, "");
  const lower = base.toLowerCase().replace(/_/g, "-");
  return lower + ".md";
}

// --- 1. rename docs/ files ---
const renameMap = {}; // old → new (relative paths, POSIX)

walk(DOCS, (full, name) => {
  if (!name.endsWith(".md")) return;

  const next = toKebab(name);
  if (next !== name) {
    const newPath = path.join(path.dirname(full), next);
    const oldRel = path.relative(ROOT, full).replace(/\\/g, "/");
    const newRel = path.relative(ROOT, newPath).replace(/\\/g, "/");

    console.log(`rename: ${oldRel} → ${newRel}`);
    fs.renameSync(full, newPath);
    renameMap[oldRel] = newRel;
  }
});

if (Object.keys(renameMap).length === 0) {
  console.log("No files needed renaming.");
  process.exit(0);
}

// --- 2. update mkdocs.yml references via YAML parsing ---
if (!fs.existsSync(MKDOCS)) {
  console.log("mkdocs.yml not found — skipped reference update.");
  process.exit(0);
}

let mk;
try {
  mk = yaml.load(fs.readFileSync(MKDOCS, "utf8"));
} catch (e) {
  console.error(`Failed to parse mkdocs.yml: ${e.message}`);
  process.exit(1);
}

// Update nav recursively
function updateNav(nav) {
  if (Array.isArray(nav)) {
    return nav.map(updateNav);
  }
  if (typeof nav === "object" && nav !== null) {
    const out = {};
    for (const k in nav) {
      const v = nav[k];
      if (typeof v === "string") {
        out[k] = renameMap[v] || v;
      } else {
        out[k] = updateNav(v);
      }
    }
    return out;
  }
  return nav;
}

if (mk.nav) {
  mk.nav = updateNav(mk.nav);
}

// Write back
try {
  fs.writeFileSync(MKDOCS, yaml.dump(mk, { lineWidth: -1 }), "utf8");
  console.log("\n✓ mkdocs.yml updated via YAML parsing.");
} catch (e) {
  console.error(`Failed to write mkdocs.yml: ${e.message}`);
  process.exit(1);
}

console.log("Done.\n");
