/*
  filename: deterministic-security.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashSecurity } from "./security-hash.js";
import { verifySecurity } from "./security-verify.js";

export async function runDeterministicSecuritySeal() {
  const manifest = JSON.parse(fs.readFileSync("security/seals/security-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashSecurity(path);
    const verify = verifySecurity(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("security-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
