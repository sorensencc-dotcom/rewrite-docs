/*
  filename: deterministic-package.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { buildPackage } from "./package-builder.js";
import { hashPackage } from "./package-hash.js";
import { verifyPackage } from "./package-verify.js";

export async function runDeterministicPackaging() {
  const manifest = JSON.parse(fs.readFileSync("packaging/package-manifest.json", "utf8"));
  const results = {};

  for (const [name, cfg] of Object.entries(manifest.bundles)) {
    const bundle = buildPackage(cfg.input, cfg.output);
    const hash = hashPackage(bundle);
    const verify = verifyPackage(bundle, hash);

    results[name] = {
      bundle,
      hash,
      verify: verify.passed
    };
  }

  fs.writeFileSync("package-report.json", JSON.stringify(results, null, 2));
  return results;
}
