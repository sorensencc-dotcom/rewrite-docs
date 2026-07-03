/*
  filename: identity-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashIdentity } from "./identity-hash.js";

export function verifyIdentity(path, expected) {
  const actual = hashIdentity(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
