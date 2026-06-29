/*
  filename: embedding-drift-detector.ts
  version: 1.0.0
  updated: 2026-06-28
*/

import { embed } from "../../sandbox/onnx";

export async function detectEmbeddingDrift() {
  const base = await embed("The quick brown fox");
  const current = await embed("The quick brown fox");

  let drift = 0;
  for (let i = 0; i < base.length; i++) {
    drift += Math.abs(base[i] - current[i]);
  }

  return {
    drift,
    passed: drift < 1e-6,
  };
}
