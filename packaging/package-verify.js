/*
  filename: package-verify.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { hashPackage } from "./package-hash.js";

export function verifyPackage(path, expectedHash) {
  const actual = hashPackage(path);
  return {
    expected: expectedHash,
    actual,
    passed: actual === expectedHash
  };
}
