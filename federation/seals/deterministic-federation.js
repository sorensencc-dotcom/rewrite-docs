/*
  filename: deterministic-federation.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashFederation } from "./federation-hash.js";
import { verifyFederation } from "./federation-verify.js";

export async function runDeterministicFederationSeal() {
  const manifest = JSON.parse(
    fs.readFileSync("federation/seals/federation-seal.json", "utf8")
  );

  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashFederation(path);
    const verify = verifyFederation(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync(
    "federation-seal-report.json",
    JSON.stringify(results, null, 2)
  );

  return results;
}
