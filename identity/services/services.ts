/*
  filename: services.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadServices() {
  return JSON.parse(fs.readFileSync("identity/services/services.json", "utf8"));
}

export function getService(name: string) {
  return loadServices()[name];
}
