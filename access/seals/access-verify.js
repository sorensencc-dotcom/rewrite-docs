/*
  filename: access-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashAccess } from "./access-hash.js";

export function verifyAccess(path, expected) {
  const actual = hashAccess(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
