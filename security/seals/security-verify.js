/*
  filename: security-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashSecurity } from "./security-hash.js";

export function verifySecurity(path, expected) {
  const actual = hashSecurity(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
