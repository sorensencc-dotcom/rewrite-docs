#!/usr/bin/env node
/**
 * Frontmatter Auto‑Injector (Rewrite Labs + CIC)
 * - Scans docs/ recursively
 * - Detects missing YAML frontmatter
 * - Infers title from filename
 * - Infers summary from first paragraph
 * - Inserts frontmatter safely and idempotently
 */

const fs = require("fs");
const path = require("path");

const DOCS_ROOT = path.join("docs");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walk(full));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      files.push(full);
    }
  }

  return files;
}

function hasFrontmatter(text) {
  return text.startsWith("---");
}

function inferTitle(filePath) {
  const base = path.basename(filePath, ".md");
  return base
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function inferSummary(text) {
  const lines = text.split("\n").map(l => l.trim());
  const firstParagraph = [];

  for (const line of lines) {
    if (line.length === 0 && firstParagraph.length > 0) break;
    if (line.length > 0) firstParagraph.push(line);
  }

  return firstParagraph.join(" ").slice(0, 300).replace(/"/g, '\\"');
}

function injectFrontmatter(file) {
  const raw = fs.readFileSync(file, "utf8");

  if (hasFrontmatter(raw)) {
    console.log(`SKIP (already has frontmatter): ${file}`);
    return false;
  }

  const title = inferTitle(file).replace(/"/g, '\\"');
  const summary = inferSummary(raw);

  const fm = [
    "---",
    `title: "${title}"`,
    `summary: "${summary}"`,
    `created: "${new Date().toISOString()}"`,
    `updated: "${new Date().toISOString()}"`,
    "tags:",
    "  - cic",
    "  - rewrite-labs",
    "  - roadmap",
    "---",
    ""
  ].join("\n");

  const updated = fm + raw;
  fs.writeFileSync(file, updated);

  console.log(`ADDED frontmatter → ${file}`);
  return true;
}

function main() {
  const files = walk(DOCS_ROOT);
  console.log(`Scanning ${files.length} markdown files…`);

  let count = 0;
  files.forEach(f => {
    if (injectFrontmatter(f)) count++;
  });

  console.log(`✔ Frontmatter injection complete. ${count} files updated.`);
}

main();
