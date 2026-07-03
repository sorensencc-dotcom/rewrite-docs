/*
  filename: secrets-engine-verify.js
  version: 1.0.0
  updated: 2026-06-29
*/

import { hashSecretsEngine } from "./secrets-engine-hash.js";

export function verifySecretsEngine(path, expected) {
  const actual = hashSecretsEngine(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
