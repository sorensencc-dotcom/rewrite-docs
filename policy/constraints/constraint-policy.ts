/*
  filename: constraint-policy.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

const policy = JSON.parse(
  fs.readFileSync("policy/constraints/constraint-policy.json", "utf8")
);

export function getConstraintPolicy() {
  return policy;
}
