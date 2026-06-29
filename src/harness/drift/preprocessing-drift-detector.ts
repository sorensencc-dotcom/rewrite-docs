/*
  filename: preprocessing-drift-detector.ts
  version: 1.0.0
  updated: 2026-06-28
*/

import { preprocess } from "../../sandbox/preprocessing";

export async function detectPreprocessingDrift() {
  const a = preprocess("Hello world");
  const b = preprocess("Hello world");

  const drift = JSON.stringify(a) === JSON.stringify(b);

  return {
    passed: drift,
  };
}
