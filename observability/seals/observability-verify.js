/*
  filename: observability-verify.js
  version: 1.0.0
  updated: 2026-06-28
*/

import { hashObservability } from "./observability-hash.js";

export function verifyObservability(path, expected) {
  const actual = hashObservability(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
