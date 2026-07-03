#!/usr/bin/env node
/**
 * MkDocs Metadata Index
 * - Extracts frontmatter from all docs
 * - Writes docs-metadata.json
 */

const fs = require("fs");
const path = require("path");

const DOCS_ROOT = path.join("docs");
const OUT = path.join("docs-metadata.json");

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
  const index = [];

  files.forEach(file => {
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(raw);
    if (!fm) return;
    index.push({
      path: file.replace(/\\/g, "/"),
      ...fm
    });
  });

  fs.writeFileSync(OUT, JSON.stringify(index, null, 2));
  console.log(`✔ Metadata index written to ${OUT} (${index.length} files)`);
}

main();
