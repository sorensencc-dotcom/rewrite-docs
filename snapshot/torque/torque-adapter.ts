/*
  filename: torque-adapter.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadTorqueManifest() {
  return JSON.parse(
    fs.readFileSync("snapshot/torque/torque-manifest.json", "utf8")
  );
}

export function getTorqueInputs() {
  const manifest = loadTorqueManifest();
  return {
    ingest: fs.readFileSync(manifest.ingest, "utf8"),
    world: fs.readFileSync(manifest.world, "utf8")
  };
}
