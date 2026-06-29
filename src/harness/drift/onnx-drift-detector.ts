/*
  filename: onnx-drift-detector.ts
  version: 1.0.0
  updated: 2026-06-28
*/

import { runInference } from "../../sandbox/onnx";

export async function detectOnnxDrift() {
  const out1 = await runInference([1, 2, 3]);
  const out2 = await runInference([1, 2, 3]);

  let drift = 0;
  for (let i = 0; i < out1.length; i++) {
    drift += Math.abs(out1[i] - out2[i]);
  }

  return {
    drift,
    passed: drift < 1e-6,
  };
}
