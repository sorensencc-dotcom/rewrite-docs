/*
  filename: secrets-engine-hash.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import crypto from "crypto";

export function hashSecretsEngine(path) {
  const files = fs.readdirSync(path);
  const hash = crypto.createHash("sha256");

  for (const f of files) {
    const data = fs.readFileSync(`${path}/${f}`);
    hash.update(data);
  }

  return hash.digest("hex");
}
