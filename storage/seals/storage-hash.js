/*
  filename: storage-hash.js
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import crypto from "crypto";

export function hashStorage(path) {
  const data = fs.readFileSync(path);
  return crypto.createHash("sha256").update(data).digest("hex");
}
