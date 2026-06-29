/*
  filename: fallback-policy.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

const policy = JSON.parse(
  fs.readFileSync("policy/fallback/fallback-policy.json", "utf8")
);

export function getFallback(model: string) {
  return policy.fallbacks[model] || model;
}
