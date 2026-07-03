/*
  filename: decrypt.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { decryptWithKey } from "../kms/kms-client";

export function decryptFile(path: string, iv: Buffer, tag: Buffer) {
  const key = fs.readFileSync("secrets-engine/current-key.bin");
  const data = fs.readFileSync(path);
  return decryptWithKey(key, iv, tag, data);
}
