/*
  filename: release-gate.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";

const report = JSON.parse(fs.readFileSync("regression-report.json", "utf8"));

if (!report.passed) {
  console.error("Release blocked: deterministic regression failed.");
  process.exit(1);
}

console.log("Release gate passed.");
