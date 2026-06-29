/*
  filename: deterministic-audit.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashAudit } from "./audit-hash.js";
import { verifyAudit } from "./audit-verify.js";

export async function runDeterministicAuditSeal() {
  const manifest = JSON.parse(fs.readFileSync("audit/seals/audit-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashAudit(path);
    const verify = verifyAudit(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("audit-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
