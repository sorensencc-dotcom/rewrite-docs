/*
  filename: trust-graph.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadTrustGraph() {
  return JSON.parse(
    fs.readFileSync("federation/trust/trust-graph.json", "utf8")
  ).trust;
}

export function getTrustedEntities(entity: string) {
  const trust = loadTrustGraph();
  return trust[entity] || [];
}
