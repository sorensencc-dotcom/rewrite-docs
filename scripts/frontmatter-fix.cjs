#!/usr/bin/env node
/**
 * Frontmatter Fixer
 * - Adds missing keys to existing frontmatter
 * - Inserts full frontmatter if missing entirely
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

function hasFrontmatter(text) {
  return text.startsWith("---");
}

function parseFrontmatterBlock(text) {
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  return { block: text.slice(0, end + 4), rest: text.slice(end + 4) };
}

function main() {
  const files = walk(DOCS_ROOT);
  let fixed = 0;

  files.forEach(file => {
    const raw = fs.readFileSync(file, "utf8");
    if (!hasFrontmatter(raw)) return; // injector handles missing entirely

    const parsed = parseFrontmatterBlock(raw);
    if (!parsed) return;

    const lines = parsed.block.split("\n");
    const keys = new Set();
    lines.forEach(line => {
      const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (m) keys.add(m[1]);
    });

    const required = ["title", "summary", "created", "updated", "tags"];
    const missing = required.filter(k => !keys.has(k));
    if (!missing.length) return;

    const extra = missing.map(k => {
      if (k === "tags") return "tags:\n  - cic\n  - rewrite-labs\n  - roadmap";
      if (k === "created" || k === "updated")
        return `${k}: "${new Date().toISOString()}"`;
      return `${k}: ""`;
    });

    const updatedBlock = parsed.block.replace(
      "\n---",
      "\n" + extra.join("\n") + "\n---"
    );
    const updated = updatedBlock + parsed.rest;
    fs.writeFileSync(file, updated);
    console.log(`FIXED frontmatter → ${file}`);
    fixed++;
  });

  console.log(`✔ Frontmatter fix pass complete. ${fixed} files fixed.`);
}

main();
