/*
  filename: mesh.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadMeshConfig() {
  return JSON.parse(
    fs.readFileSync("network/mesh/mesh-config.json", "utf8")
  );
}

export function loadMeshRoutes() {
  return JSON.parse(
    fs.readFileSync("network/mesh/mesh-routes.json", "utf8")
  );
}

export function resolveRoute(service: string) {
  const routes = loadMeshRoutes().routes;
  return routes[service] || [];
}
