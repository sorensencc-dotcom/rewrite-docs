/*
  filename: onnx-runtime-policy.ts
  version: 1.0.0
  updated: 2026-06-29
*/

import fs from "fs";

export function loadOnnxRuntimePolicy() {
  return JSON.parse(
    fs.readFileSync("runtime/onnx/onnx-runtime-policy.json", "utf8")
  );
}
