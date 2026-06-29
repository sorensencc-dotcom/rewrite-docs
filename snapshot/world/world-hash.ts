/*
  filename: world-hash.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import crypto from "crypto";

export function computeWorldHash() {
  const data = fs.readFileSync("snapshot/world/world-state.json");
  return crypto.createHash("sha256").update(data).digest("hex");
}
