/*
  filename: deterministic-seal.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { buildSeal } from "./seal-builder.js";
import { verifySeal } from "./seal-verify.js";

export async function runDeterministicSeal() {
  const manifest = JSON.parse(fs.readFileSync("deployment/seals/seal-manifest.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.manifests)) {
    const seal = buildSeal(path);
    const verify = verifySeal(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
