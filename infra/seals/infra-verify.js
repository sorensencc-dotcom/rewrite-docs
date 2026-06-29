/*
  filename: infra-verify.js
  version: 1.0.0
  updated: 2026-06-28
*/

import { hashInfra } from "./infra-hash.js";

export function verifyInfra(path, expected) {
  const actual = hashInfra(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
