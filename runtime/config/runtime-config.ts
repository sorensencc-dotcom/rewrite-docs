/*
  filename: runtime-config.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadRuntimeConfig() {
  return JSON.parse(
    fs.readFileSync("runtime/config/runtime-config.json", "utf8")
  );
}

export function isLocalFirstEnabled(): boolean {
  try {
    const config = loadRuntimeConfig();
    return Boolean(config.localFirst ?? true);
  } catch {
    return true;
  }
}
