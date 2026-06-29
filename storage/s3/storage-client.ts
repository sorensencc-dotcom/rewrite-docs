/*
  filename: storage-client.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import crypto from "crypto";

export function hashObject(path: string) {
  const data = fs.readFileSync(path);
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function listFiles(dir: string) {
  return fs.readdirSync(dir).map((f) => `${dir}/${f}`);
}
