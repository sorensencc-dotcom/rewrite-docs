/*
  filename: seal-verify.js
  version: 1.0.0
  updated: 2026-06-28
*/

import fs from "fs";
import { buildSeal } from "./seal-builder.js";

export function verifySeal(path, expected) {
  const actual = buildSeal(path);
  return {
    expected,
    actual,
    passed: actual === expected
  };
}
