/*
  filename: policy-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashPolicy } from "./policy-hash.js";

export function verifyPolicy(path, expected) {
  const actual = hashPolicy(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
