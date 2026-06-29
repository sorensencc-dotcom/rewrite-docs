/*
  filename: routing-policy.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

const policy = JSON.parse(
  fs.readFileSync("policy/routing/routing-policy.json", "utf8")
);

export function getRoutingTier(task: string) {
  const rule = policy.rules.find((r) => r.task === task);
  return rule ? policy.tiers[rule.tier] : policy.tiers.small;
}
