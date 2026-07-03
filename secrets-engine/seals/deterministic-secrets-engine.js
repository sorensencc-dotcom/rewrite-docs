/*
  filename: deterministic-secrets-engine.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashSecretsEngine } from "./secrets-engine-hash.js";
import { verifySecretsEngine } from "./secrets-engine-verify.js";

export async function runDeterministicSecretsEngineSeal() {
  const manifest = JSON.parse(
    fs.readFileSync("secrets-engine/seals/secrets-engine-seal.json", "utf8")
  );

  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashSecretsEngine(path);
    const verify = verifySecretsEngine(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync(
    "secrets-engine-seal-report.json",
    JSON.stringify(results, null, 2)
  );

  return results;
}
