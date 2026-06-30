/*
  Manual verification script for Phase 2: Multi-Pipeline Ingestion
  Tests: unified adapter, orchestrator, seal, delta updates
*/

import fs from "fs";
import path from "path";
import { unifiedIngestionAdapter, NormalizedAsset } from "../ingestion/unified-ingestion-adapter.js";
import { orchestrateMultiPipeline } from "../ingestion/multi-pipeline-orchestrator.js";

console.log("=== Phase 2 Multi-Pipeline Verification Tests ===\n");

// Setup: Create temp test files
const testDir = "C:\\tmp\\phase2-test";
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

const docPath1 = path.join(testDir, "test-doc-1.txt");
const docPath2 = path.join(testDir, "test-doc-2.txt");
fs.writeFileSync(docPath1, "Test document content 1");
fs.writeFileSync(docPath2, "Test document content 2");

console.log("Test 1: Unified Adapter — document normalization");
const adapter1 = unifiedIngestionAdapter({
  docs: [docPath1, docPath2],
  images: []
});

console.log(`  Assets created: ${adapter1.length}`);
console.log(`  Asset[0] type: ${adapter1[0].type}`);
console.log(`  Asset[0] embedding length: ${adapter1[0].embedding.length}`);
console.log(`  All assets have valid IDs: ${adapter1.every(a => a.id.length === 64)}`);

if (
  adapter1.length === 2 &&
  adapter1[0].type === "document" &&
  adapter1[0].embedding.length === 768 &&
  adapter1.every(a => a.id.length === 64)
) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: adapter output structure incorrect\n");
}

// Test 2: Determinism check
console.log("Test 2: Unified Adapter — determinism (100 iterations)");
const results = Array.from({ length: 100 }, () =>
  unifiedIngestionAdapter({
    docs: [docPath1, docPath2],
    images: []
  })
);

const firstIds = results[0].map(a => a.id).join("|");
const allSame = results.every(r => r.map(a => a.id).join("|") === firstIds);

console.log(`  All 100 runs produced identical IDs: ${allSame}`);
if (allSame) console.log("  ✓ PASS\n");
else console.log("  ✗ FAIL: adapter not deterministic\n");

// Test 3: Orchestrator integration
console.log("Test 3: Multi-Pipeline Orchestrator — 4-pipeline execution");

// Backup existing world-state
const worldStatePath = "snapshot/world/world-state.json";
const worldStateBackup = fs.readFileSync(worldStatePath, "utf8");

try {
  const result = orchestrateMultiPipeline({
    docs: [docPath1, docPath2],
    images: []
  });

  console.log(`  Orchestration status: ${result.status}`);
  console.log(`  Asset count: ${result.assetCount}`);
  console.log(`  Pipeline statuses: corpus=${result.pipelines.corpus.status}, training=${result.pipelines.modelTraining.status}, treatment=${result.pipelines.treatment.status}, rewriteLabs=${result.pipelines.rewriteLabs.status}`);
  console.log(`  Final seal hash length: ${result.finalSealHash.length}`);

  const allSuccess =
    result.status === "success" &&
    result.assetCount === 2 &&
    result.pipelines.corpus.status === "success" &&
    result.pipelines.modelTraining.status === "success" &&
    result.pipelines.treatment.status === "success" &&
    result.pipelines.rewriteLabs.status === "success" &&
    result.finalSealHash.length === 64;

  if (allSuccess) {
    console.log("  ✓ PASS\n");
  } else {
    console.log("  ✗ FAIL: orchestrator execution incomplete\n");
  }
} finally {
  // Restore world-state
  fs.writeFileSync(worldStatePath, worldStateBackup);
}

// Test 4: Seal template structure
console.log("Test 4: multi-pipeline-seal.json template");
const sealPath = "final/multi-pipeline-seal.json";
const seal = JSON.parse(fs.readFileSync(sealPath, "utf8"));

console.log(`  version: ${seal.multiPipelineSeal.version}`);
console.log(`  localFirst: ${seal.multiPipelineSeal.localFirst}`);
console.log(`  pipelines: ${Object.keys(seal.multiPipelineSeal.pipelines).join(", ")}`);

const sealValid =
  seal.multiPipelineSeal.version === "1.0.0" &&
  seal.multiPipelineSeal.localFirst === true &&
  seal.multiPipelineSeal.deterministic === true &&
  seal.multiPipelineSeal.sealed === true &&
  Object.keys(seal.multiPipelineSeal.pipelines).length === 4;

if (sealValid) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: seal structure incorrect\n");
}

// Test 5: Delta template structure
console.log("Test 5: multi-pipeline-delta.json template");
const deltaPath = "snapshot/multi-pipeline-delta.json";
const delta = JSON.parse(fs.readFileSync(deltaPath, "utf8"));

console.log(`  version: ${delta.multiPipelineDelta.version}`);
console.log(`  localFirst: ${delta.multiPipelineDelta.localFirst}`);
console.log(`  changes count: ${delta.multiPipelineDelta.changes.length}`);

const deltaValid =
  delta.multiPipelineDelta.version === "1.0.0" &&
  delta.multiPipelineDelta.localFirst === true &&
  Array.isArray(delta.multiPipelineDelta.changes) &&
  delta.multiPipelineDelta.changes.length === 3;

if (deltaValid) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: delta structure incorrect\n");
}

// Cleanup
fs.rmSync(testDir, { recursive: true });

console.log("=== All Phase 2 Verification Tests Complete ===");
