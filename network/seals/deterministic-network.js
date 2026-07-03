/*
  filename: deterministic-network.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { hashNetwork } from "./network-hash.js";
import { verifyNetwork } from "./network-verify.js";

export async function runDeterministicNetworkSeal() {
  const manifest = JSON.parse(fs.readFileSync("network/seals/network-seal.json", "utf8"));
  const results = {};

  for (const [name, path] of Object.entries(manifest.paths)) {
    const seal = hashNetwork(path);
    const verify = verifyNetwork(path, seal);
    results[name] = { seal, verify: verify.passed };
  }

  fs.writeFileSync("network-seal-report.json", JSON.stringify(results, null, 2));
  return results;
}
