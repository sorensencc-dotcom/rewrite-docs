/*
  filename: federation-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashFederation } from "./federation-hash.js";

export function verifyFederation(path, expected) {
  const actual = hashFederation(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
