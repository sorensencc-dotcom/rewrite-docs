/*
  filename: deterministic-snapshot.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashSnapshot } from "./snapshot-hash.js";
import { verifySnapshot } from "./snapshot-verify.js";

export async function runDeterministicSnapshotSeal() {
  const manifest = JSON.parse(
    fs.readFileSync("snapshot/seals/snapshot-seal.json", "utf8")
  );

  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashSnapshot(path);
    const verify = verifySnapshot(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync(
    "snapshot-seal-report.json",
    JSON.stringify(results, null, 2)
  );

  return results;
}
