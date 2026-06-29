/*
  filename: deterministic-storage.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashStorage } from "./storage-hash.js";
import { verifyStorage } from "./storage-verify.js";

export async function runDeterministicStorageSeal() {
  const manifest = JSON.parse(fs.readFileSync("storage/seals/storage-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashStorage(path);
    const verify = verifyStorage(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("storage-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
