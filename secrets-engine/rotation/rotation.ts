/*
  filename: rotation.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";
import { generateKey } from "../kms/kms-client";

export function rotateKey() {
  const policy = JSON.parse(
    fs.readFileSync("secrets-engine/rotation/rotation-policy.json", "utf8")
  );

  const newKey = generateKey();
  fs.writeFileSync("secrets-engine/current-key.bin", newKey);

  if (policy.retainOldKeys) {
    fs.writeFileSync(
      `secrets-engine/archive/key-${Date.now()}.bin`,
      newKey
    );
  }

  return newKey;
}
