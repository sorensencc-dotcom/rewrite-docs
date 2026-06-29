/*
  filename: deterministic-policy.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashPolicy } from "./policy-hash.js";
import { verifyPolicy } from "./policy-verify.js";

export async function runDeterministicPolicySeal() {
  const manifest = JSON.parse(fs.readFileSync("policy/seals/policy-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashPolicy(path);
    const verify = verifyPolicy(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("policy-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
