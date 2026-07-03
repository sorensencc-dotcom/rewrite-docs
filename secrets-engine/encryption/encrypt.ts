/*
  filename: encrypt.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { encryptWithKey } from "../kms/kms-client";

export function encryptFile(path: string) {
  const key = fs.readFileSync("secrets-engine/current-key.bin");
  const data = fs.readFileSync(path);
  const { iv, encrypted, tag } = encryptWithKey(key, data);

  return { iv, encrypted, tag };
}
