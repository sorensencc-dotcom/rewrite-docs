/*
  filename: network-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashNetwork } from "./network-hash.js";

export function verifyNetwork(path, expected) {
  const actual = hashNetwork(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
