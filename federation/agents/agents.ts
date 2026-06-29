/*
  filename: agents.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadAgents() {
  return JSON.parse(
    fs.readFileSync("federation/agents/agents.json", "utf8")
  ).agents;
}

export function getAgent(name: string) {
  return loadAgents()[name];
}
