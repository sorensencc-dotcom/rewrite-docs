/*
  filename: trace-emitter.ts
  purpose: collect per-run orchestration data and write to audit logs
  version: 1.0.0
*/

import fs from "fs";
import crypto from "crypto";
import path from "path";
import { OrchestrationResult } from "./multi-pipeline-orchestrator.js";

export interface ExecutionTrace {
  taskId: string;
  task: string;
  localFirst: boolean;
  timestamp: number;
  fingerprint: string;
  regimeSelected: string;
  input: {
    docCount: number;
    imageCount: number;
  };
  normalizedAssets: {
    totalCount: number;
    byType: Record<string, number>;
  };
  pipelines: {
    corpus: { status: string; assetIds: string[]; hash: string };
    modelTraining: { status: string; assetIds: string[]; hash: string };
    treatment: { status: string; hash: string; messageCount: number };
    rewriteLabs: { status: string; assetIds: string[]; hash: string };
  };
  messages: any[];
  result: {
    status: string;
    finalSealHash: string;
    payloadHash: string;
    snapshotHash: string;
  };
}

/**
 * Emit execution trace to audit/runs/<runId>.json
 * Captures full orchestration state for reproducibility and debugging
 */
export function emitTrace(
  orchestrationResult: OrchestrationResult,
  input: { docs: string[]; images: string[] },
  runId: string,
  assetCount: number,
  messagesByType: Record<string, any[]>
): ExecutionTrace {
  // Ensure audit directory exists
  fs.mkdirSync("audit/runs", { recursive: true });

  // Compute fingerprint: SHA256 of input paths
  const sortedInputs = [...input.docs, ...input.images].sort();
  const fingerprint = crypto
    .createHash("sha256")
    .update(sortedInputs.join("|"))
    .digest("hex");

  // Count messages by pipeline
  const treatmentMessages = messagesByType.treatment || [];

  // Compute snapshot hash from world-state
  const worldState = JSON.parse(
    fs.readFileSync("snapshot/world/world-state.json", "utf8")
  );
  const snapshotHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(worldState))
    .digest("hex");

  // Compute payload hash (concatenate all pipeline hashes)
  const payloadHash = crypto
    .createHash("sha256")
    .update(
      [
        orchestrationResult.pipelines.corpus.hash,
        orchestrationResult.pipelines.modelTraining.hash,
        orchestrationResult.pipelines.treatment.hash,
        orchestrationResult.pipelines.rewriteLabs.hash
      ].join("|")
    )
    .digest("hex");

  const trace: ExecutionTrace = {
    taskId: runId,
    task: "multi-pipeline-ingestion",
    localFirst: true,
    timestamp: 0, // Deterministic: no Date.now()
    fingerprint,
    regimeSelected: "local-first",
    input: {
      docCount: input.docs.length,
      imageCount: input.images.length
    },
    normalizedAssets: {
      totalCount: assetCount,
      byType: {
        document: input.docs.length,
        image: input.images.length
      }
    },
    pipelines: {
      corpus: {
        status: orchestrationResult.pipelines.corpus.status,
        assetIds: orchestrationResult.pipelines.corpus.assetIds,
        hash: orchestrationResult.pipelines.corpus.hash
      },
      modelTraining: {
        status: orchestrationResult.pipelines.modelTraining.status,
        assetIds: orchestrationResult.pipelines.modelTraining.assetIds,
        hash: orchestrationResult.pipelines.modelTraining.hash
      },
      treatment: {
        status: orchestrationResult.pipelines.treatment.status,
        hash: orchestrationResult.pipelines.treatment.hash,
        messageCount: treatmentMessages.length
      },
      rewriteLabs: {
        status: orchestrationResult.pipelines.rewriteLabs.status,
        assetIds: orchestrationResult.pipelines.rewriteLabs.assetIds,
        hash: orchestrationResult.pipelines.rewriteLabs.hash
      }
    },
    messages: treatmentMessages,
    result: {
      status: orchestrationResult.status,
      finalSealHash: orchestrationResult.finalSealHash,
      payloadHash,
      snapshotHash
    }
  };

  // Write to audit log (note: timestamp excluded from hash to preserve determinism)
  const tracePath = path.join("audit/runs", `${runId}.json`);
  fs.writeFileSync(tracePath, JSON.stringify({ executionTrace: trace }, null, 2));

  return trace;
}

/**
 * Load execution trace by runId
 */
export function loadTrace(runId: string): ExecutionTrace | null {
  const tracePath = path.join("audit/runs", `${runId}.json`);
  if (!fs.existsSync(tracePath)) return null;
  const data = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  return data.executionTrace;
}

/**
 * List all execution traces
 */
export function listTraces(): string[] {
  const runsDir = "audit/runs";
  if (!fs.existsSync(runsDir)) return [];
  return fs
    .readdirSync(runsDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort();
}
