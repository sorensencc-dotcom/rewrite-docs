/*
  filename: snapshot-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashSnapshot } from "./snapshot-hash.js";

export function verifySnapshot(path, expected) {
  const actual = hashSnapshot(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
