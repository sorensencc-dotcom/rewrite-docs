/*
  filename: onnx-collector.js
  version: 1.0.0
  updated: 2026-06-28
*/

import client from "prom-client";
import { runInference } from "../../../src/sandbox/onnx";

const gauge = new client.Gauge({
  name: "sandbox3_onnx_inference_ms",
  help: "ONNX inference latency"
});

export async function collectOnnx() {
  const start = performance.now();
  await runInference([1, 2, 3]);
  const end = performance.now();
  gauge.set(end - start);
}
