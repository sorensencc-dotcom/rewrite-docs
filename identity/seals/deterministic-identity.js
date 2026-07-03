/*
  filename: deterministic-identity.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashIdentity } from "./identity-hash.js";
import { verifyIdentity } from "./identity-verify.js";

export async function runDeterministicIdentitySeal() {
  const manifest = JSON.parse(
    fs.readFileSync("identity/seals/identity-seal.json", "utf8")
  );

  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashIdentity(path);
    const verify = verifyIdentity(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync(
    "identity-seal-report.json",
    JSON.stringify(results, null, 2)
  );

  return results;
}
