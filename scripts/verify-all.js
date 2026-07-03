#!/usr/bin/env node
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
    return true;
  } catch (e) {
    return false;
  }
}

console.log("=== Full Verification Suite ===\n");

let pass = true;

console.log("\n1️⃣ Topology & Structure");
if (!run("node scripts/verify-topology-docs.js")) pass = false;

console.log("\n2️⃣ Semantic Content");
if (!run("node scripts/verify-docs-content.js")) pass = false;

console.log("\n3️⃣ MkDocs Build");
if (!run("mkdocs build")) pass = false;

console.log("\n4️⃣ Cross-System Token Alignment");
if (!run("node scripts/link-roadmaps.js > nul 2>&1")) pass = false;
else console.log("✔ Cross-system linker ran");

if (pass) {
  console.log("\n✔✔✔ FULL VERIFICATION PASSED ✔✔✔");
  process.exit(0);
} else {
  console.log("\n❌ VERIFICATION FAILED");
  process.exit(1);
}
