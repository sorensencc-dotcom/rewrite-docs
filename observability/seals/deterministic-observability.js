/*
  filename: deterministic-observability.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { hashObservability } from "./observability-hash.js";
import { verifyObservability } from "./observability-verify.js";

export async function runDeterministicObservabilitySeal() {
  const manifest = JSON.parse(fs.readFileSync("observability/seals/observability-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashObservability(path);
    const verify = verifyObservability(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("observability-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
