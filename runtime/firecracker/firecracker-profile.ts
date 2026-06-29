/*
  filename: firecracker-profile.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadFirecrackerProfile() {
  return JSON.parse(
    fs.readFileSync("runtime/firecracker/firecracker-profile.json", "utf8")
  );
}
