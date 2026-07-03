#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);

const files = [
  "docs/systems/index.md",
  "docs/integration/index.md",
  "docs/reference/cic-rl-cross-reference.md",
  "docs/cic/index.md",
  "docs/rewrite-labs/index.md"
].map(f => path.join(ROOT, f));

function mustContain(file, patterns) {
  if (!fs.existsSync(file)) {
    return { file, misses: ["FILE MISSING"] };
  }
  const text = fs.readFileSync(file, "utf8");
  const misses = patterns.filter(p => !new RegExp(p, "i").test(text));
  return { file, misses };
}

function mustNotContain(file, patterns) {
  if (!fs.existsSync(file)) {
    return { file, hits: [] };
  }
  const text = fs.readFileSync(file, "utf8");
  const hits = patterns.filter(p => new RegExp(p, "i").test(text));
  return { file, hits };
}

function main() {
  const checks = [];

  // systems/index.md checks
  checks.push(mustContain(files[0], ["MAAL", "Governance", "Routing", "Ingestion", "Knowledge"]));
  checks.push(mustNotContain(files[0], ["fictional", "bundle"]));

  // integration/index.md checks
  checks.push(mustContain(files[1], ["Governance Integration", "Ingestion Pipeline", "Routing Integration", "Knowledge Graph"]));
  checks.push(mustNotContain(files[1], ["fictional"]));

  // cic-rl-cross-reference.md checks
  checks.push(mustContain(files[2], ["CIC", "RL", "mapping", "dependencies"]));
  checks.push(mustNotContain(files[2], ["fictional"]));

  // cic/index.md checks
  checks.push(mustContain(files[3], ["Phase", "Governance", "Observability"]));
  checks.push(mustNotContain(files[3], ["fictional"]));

  // rewrite-labs/index.md checks
  checks.push(mustContain(files[4], ["Vault", "RL", "Integration"]));
  checks.push(mustNotContain(files[4], ["fictional"]));

  console.log("=== Semantic Verification ===");
  let fail = false;

  checks.forEach(c => {
    if (c.misses && c.misses.length) {
      fail = true;
      console.log(`❌ Missing expected patterns in ${c.file}:`);
      c.misses.forEach(m => console.log(`   - ${m}`));
    }
    if (c.hits && c.hits.length) {
      fail = true;
      console.log(`❌ Found forbidden patterns in ${c.file}:`);
      c.hits.forEach(h => console.log(`   - ${h}`));
    }
  });

  if (!fail) console.log("✔ All semantic checks passed");
  process.exit(fail ? 1 : 0);
}

main();
