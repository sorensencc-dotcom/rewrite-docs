#!/usr/bin/env node
/**
 * mkdocs-auto-sort.cjs
 * Alphabetically sorts mkdocs.yml nav entries while preserving hierarchy.
 * Use after renaming docs (to keep nav organized).
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const MKDOCS = path.join(ROOT, "mkdocs.yml");

if (!fs.existsSync(MKDOCS)) {
  console.error("mkdocs.yml not found.");
  process.exit(1);
}

// --- load ---
let mk;
try {
  mk = yaml.load(fs.readFileSync(MKDOCS, "utf8"));
} catch (e) {
  console.error(`Failed to parse mkdocs.yml: ${e.message}`);
  process.exit(1);
}

// --- sort recursively ---
function sortNav(nav) {
  if (Array.isArray(nav)) {
    // Sort array of entries by their key (first key if object, or value if string)
    return nav
      .map(sortNav) // Recursively sort each entry's children
      .sort((a, b) => {
        const aKey = typeof a === "object" ? Object.keys(a)[0] : a;
        const bKey = typeof b === "object" ? Object.keys(b)[0] : b;
        return String(aKey).localeCompare(String(bKey));
      });
  }

  if (typeof nav === "object" && nav !== null) {
    // Sort object keys alphabetically
    const out = {};
    const keys = Object.keys(nav).sort();
    for (const k of keys) {
      const v = nav[k];
      out[k] = typeof v === "string" ? v : sortNav(v);
    }
    return out;
  }

  return nav;
}

if (mk.nav) {
  mk.nav = sortNav(mk.nav);
}

// --- write back ---
try {
  fs.writeFileSync(MKDOCS, yaml.dump(mk, { lineWidth: -1 }), "utf8");
  console.log("\n✓ mkdocs.yml sorted alphabetically.\n");
} catch (e) {
  console.error(`Failed to write mkdocs.yml: ${e.message}`);
  process.exit(1);
}
