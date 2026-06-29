/*
  filename: handoff.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadHandoffPolicy() {
  return JSON.parse(
    fs.readFileSync("federation/handoff/handoff-policy.json", "utf8")
  );
}

export function getHandoffTargets(entity: string) {
  const policy = loadHandoffPolicy();
  return policy.handoffRules[entity] || [];
}
