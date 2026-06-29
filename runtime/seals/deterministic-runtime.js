/*
  filename: deterministic-runtime.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashRuntime } from "./runtime-hash.js";
import { verifyRuntime } from "./runtime-verify.js";

export async function runDeterministicRuntimeSeal() {
  const manifest = JSON.parse(fs.readFileSync("runtime/seals/runtime-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashRuntime(path);
    const verify = verifyRuntime(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("runtime-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
