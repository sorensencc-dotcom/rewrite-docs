/*
  filename: runtime-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashRuntime } from "./runtime-hash.js";

export function verifyRuntime(path, expected) {
  const actual = hashRuntime(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
