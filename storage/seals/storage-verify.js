/*
  filename: storage-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashStorage } from "./storage-hash.js";

export function verifyStorage(path, expected) {
  const actual = hashStorage(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
