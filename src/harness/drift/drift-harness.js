/*
  filename: drift-harness.ts
  version: 1.0.0
  updated: 2026-06-28
*/
import { detectEmbeddingDrift } from "./embedding-drift-detector";
import { detectPreprocessingDrift } from "./preprocessing-drift-detector";
import { detectOnnxDrift } from "./onnx-drift-detector";
import { detectRoutingDrift } from "./routing-drift-detector";
import { detectSnapshotDrift } from "./snapshot-drift-detector";
export async function runDriftHarness() {
    const embedding = await detectEmbeddingDrift();
    const preprocessing = await detectPreprocessingDrift();
    const onnx = await detectOnnxDrift();
    const routing = await detectRoutingDrift();
    const snapshot = await detectSnapshotDrift();
    return {
        embedding,
        preprocessing,
        onnx,
        routing,
        snapshot,
        passed: embedding.passed &&
            preprocessing.passed &&
            onnx.passed &&
            routing.passed &&
            snapshot.passed,
    };
}
//# sourceMappingURL=drift-harness.js.map