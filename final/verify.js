/*
  filename: verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { sealLayer } from "./seal.js";

export function verifyLayer(path, expected) {
  const actual = sealLayer(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
