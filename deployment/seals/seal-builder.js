/*
  filename: seal-builder.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import crypto from "crypto";

export function buildSeal(path) {
  const data = fs.readFileSync(path);
  return crypto.createHash("sha256").update(data).digest("hex");
}
