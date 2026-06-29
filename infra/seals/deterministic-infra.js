/*
  filename: deterministic-infra.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { hashInfra } from "./infra-hash.js";
import { verifyInfra } from "./infra-verify.js";

export async function runDeterministicInfraSeal() {
  const manifest = JSON.parse(fs.readFileSync("infra/seals/infra-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.modules)) {
    const seal = hashInfra(path);
    const verify = verifyInfra(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("infra-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
