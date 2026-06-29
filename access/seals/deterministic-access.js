/*
  filename: deterministic-access.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashAccess } from "./access-hash.js";
import { verifyAccess } from "./access-verify.js";

export async function runDeterministicAccessSeal() {
  const manifest = JSON.parse(
    fs.readFileSync("access/seals/access-seal.json", "utf8")
  );

  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashAccess(path);
    const verify = verifyAccess(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync(
    "access-seal-report.json",
    JSON.stringify(results, null, 2)
  );

  return results;
}
