/*
  filename: identity-graph.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadIdentityGraph() {
  return JSON.parse(
    fs.readFileSync("identity/graph/identity-graph.json", "utf8")
  );
}

export function getEntity(name: string) {
  const graph = loadIdentityGraph();
  return graph.entities[name];
}

export function getPermissions(from: string, to: string) {
  const graph = loadIdentityGraph();
  return graph.edges.filter((e) => e.from === from && e.to === to);
}
