#!/usr/bin/env node
/**
 * Frontmatter Validator
 * - Ensures all docs have YAML frontmatter
 * - Validates required keys: title, summary, created, updated, tags
 */

const fs = require("fs");
const path = require("path");

const DOCS_ROOT = path.join("docs");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = text.slice(3, end).trim();
  const lines = block.split("\n");
  const fm = {};
  for (const line of lines) {
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2];
  }
  return fm;
}

function main() {
  const files = walk(DOCS_ROOT);
  const missing = [];
  const invalid = [];

  files.forEach(file => {
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(raw);
    if (!fm) {
      missing.push(file);
      return;
    }
    const required = ["title", "summary", "created", "updated", "tags"];
    const missingKeys = required.filter(k => !(k in fm));
    if (missingKeys.length) {
      invalid.push({ file, missingKeys });
    }
  });

  console.log("=== Frontmatter Validation Report ===");

  if (!missing.length && !invalid.length) {
    console.log("✔ All docs have valid frontmatter.");
    process.exit(0);
  }

  if (missing.length) {
    console.log("❌ Missing frontmatter:");
    missing.forEach(f => console.log(" - " + f));
  }

  if (invalid.length) {
    console.log("❌ Invalid frontmatter (missing keys):");
    invalid.forEach(e =>
      console.log(` - ${e.file} (missing: ${e.missingKeys.join(", ")})`)
    );
  }

  process.exit(1);
}

main();
