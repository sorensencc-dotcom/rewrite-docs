#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const DOCS = path.join(ROOT, "docs");

const expectedDirs = [
  "systems",
  "integration",
  "reference",
  "cic",
  "rewrite-labs"
];

function main() {
  const missing = [];
  expectedDirs.forEach(d => {
    const full = path.join(DOCS, d);
    if (!fs.existsSync(full)) missing.push(full);
  });

  const rootMd = fs.readdirSync(ROOT)
    .filter(f => f.endsWith(".md") && !["CLAUDE.md", "README.md", "CHANGELOG.md"].includes(f));

  console.log("=== Topology Verification ===");
  if (missing.length) {
    console.log("❌ Missing expected dirs:");
    missing.forEach(d => console.log(" - " + d));
  } else {
    console.log("✔ All expected docs/* dirs present");
  }

  if (rootMd.length) {
    console.log("❌ Root markdown violates RULE-1:");
    rootMd.forEach(f => console.log(" - " + f));
  } else {
    console.log("✔ No root markdown (except CLAUDE.md, README.md, CHANGELOG.md)");
  }

  process.exit(missing.length || rootMd.length ? 1 : 0);
}

main();
