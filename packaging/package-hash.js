/*
  filename: package-hash.js
  version: 1.0.0
  updated: 2026-06-28
*/

import crypto from "crypto";
import fs from "fs";

export function hashPackage(path) {
  const data = fs.readFileSync(path);
  return crypto.createHash("sha256").update(data).digest("hex");
}
