/*
  filename: audit-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashAudit } from "./audit-hash.js";

export function verifyAudit(path, expected) {
  const actual = hashAudit(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
