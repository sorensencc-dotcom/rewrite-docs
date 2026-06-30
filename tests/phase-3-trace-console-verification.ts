/*
  Manual verification script for Phase 3: Trace Emitter + Operator Console
  Tests: trace emission, console view derivation, report generation
*/

import fs from "fs";
import path from "path";
import { emitTrace, loadTrace, listTraces } from "../ingestion/trace-emitter.js";
import { emitConsoleView, loadConsoleView, generateReport } from "../ingestion/operator-console-view.js";

console.log("=== Phase 3 Trace Emitter + Operator Console Verification Tests ===\n");

// Mock orchestration result
const mockOrchestrationResult = {
  status: "success",
  pipelines: {
    corpus: { status: "success", assetIds: ["id1", "id2"], hash: "hash_corpus" },
    modelTraining: { status: "success", assetIds: ["id1", "id2"], hash: "hash_training" },
    treatment: { status: "success", assetIds: [], hash: "hash_treatment", messages: [] },
    rewriteLabs: { status: "success", assetIds: ["id1", "id2"], hash: "hash_rewrite" }
  },
  finalSealHash: "final_seal_hash_64_chars_0000000000000000000000000000000000000000",
  assetCount: 2
};

const mockInput = {
  docs: ["doc1.txt", "doc2.txt"],
  images: []
};

const testRunId = "test-run-2026-06-29-001";

// Test 1: emitTrace writes trace file
console.log("Test 1: Trace Emission");
const trace = emitTrace(
  mockOrchestrationResult,
  mockInput,
  testRunId,
  2,
  { treatment: [] }
);

console.log(`  taskId: ${trace.taskId}`);
console.log(`  task: ${trace.task}`);
console.log(`  localFirst: ${trace.localFirst}`);
console.log(`  assetCount: ${trace.normalizedAssets.totalCount}`);

const tracePath = path.join("audit/runs", `${testRunId}.json`);
const traceFileExists = fs.existsSync(tracePath);
console.log(`  Trace file written: ${traceFileExists}`);

if (trace.taskId === testRunId && trace.localFirst === true && traceFileExists) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: trace emission incomplete\n");
}

// Test 2: loadTrace reads trace file
console.log("Test 2: Trace Loading");
const loadedTrace = loadTrace(testRunId);

console.log(`  Loaded taskId: ${loadedTrace?.taskId}`);
console.log(`  Loaded status: ${loadedTrace?.result.status}`);

if (loadedTrace && loadedTrace.taskId === testRunId && loadedTrace.result.status === "success") {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: trace loading failed\n");
}

// Test 3: Console view derivation
console.log("Test 3: Operator Console View Derivation");
const consoleView = emitConsoleView(trace, testRunId);

console.log(`  runId: ${consoleView.runId}`);
console.log(`  mode: ${consoleView.mode}`);
console.log(`  status: ${consoleView.status}`);
console.log(`  pipelineCount: ${consoleView.pipelines.length}`);
console.log(`  totalAssetsProcessed: ${consoleView.summary.totalAssetsProcessed}`);

const consolePath = path.join("data/console", `${testRunId}-console.json`);
const consoleFileExists = fs.existsSync(consolePath);
console.log(`  Console file written: ${consoleFileExists}`);

if (
  consoleView.runId === testRunId &&
  consoleView.mode === "local-first" &&
  consoleView.pipelines.length === 4 &&
  consoleFileExists
) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: console view derivation incomplete\n");
}

// Test 4: loadConsoleView reads console file
console.log("Test 4: Console View Loading");
const loadedView = loadConsoleView(testRunId);

console.log(`  Loaded runId: ${loadedView?.runId}`);
console.log(`  Loaded status: ${loadedView?.status}`);
console.log(`  Pipeline statuses: ${Object.values(loadedView?.summary.pipelineStatuses || {}).join(", ")}`);

if (loadedView && loadedView.runId === testRunId && loadedView.pipelines.length === 4) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: console view loading failed\n");
}

// Test 5: Report generation
console.log("Test 5: Human-Readable Report Generation");
const report = generateReport(consoleView);

console.log("Generated report excerpt:");
const reportLines = report.split("\n");
reportLines.slice(0, 10).forEach(line => console.log(`  ${line}`));

if (report.includes("Operator Console Report") && report.includes(testRunId)) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: report generation incomplete\n");
}

// Test 6: listTraces enumerates all traces
console.log("Test 6: Trace Enumeration");
const allTraces = listTraces();

console.log(`  Traces found: ${allTraces.length}`);
console.log(`  Test run in list: ${allTraces.includes(testRunId)}`);

if (allTraces.includes(testRunId)) {
  console.log("  ✓ PASS\n");
} else {
  console.log("  ✗ FAIL: trace enumeration failed\n");
}

// Cleanup
fs.rmSync(path.join("audit/runs", `${testRunId}.json`), { force: true });
fs.rmSync(path.join("data/console", `${testRunId}-console.json`), { force: true });

console.log("=== All Phase 3 Verification Tests Complete ===");
