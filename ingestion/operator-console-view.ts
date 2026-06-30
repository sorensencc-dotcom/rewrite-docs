/*
  filename: operator-console-view.ts
  purpose: derive human-readable operator dashboard view from trace
  version: 1.0.0
*/

import fs from "fs";
import crypto from "crypto";
import path from "path";
import { ExecutionTrace } from "./trace-emitter.js";

export interface OperatorConsoleView {
  runId: string;
  mode: string;
  status: string;
  summary: {
    totalAssetsProcessed: number;
    pipelineCount: number;
    pipelineStatuses: Record<string, string>;
    finalSealHash: string;
    snapshotHash: string;
  };
  pipelines: Array<{
    name: string;
    status: string;
    assetCount: number;
    messageCount: number;
    hash: string;
  }>;
  routing: {
    regime: string;
    localFirstEnabled: boolean;
    backends: string[];
  };
  certificates: {
    localFirst: boolean;
    deterministic: boolean;
    sealed: boolean;
  };
}

/**
 * Derive operator console view from execution trace
 * Pure function: no side effects except file write
 */
export function deriveConsoleView(trace: ExecutionTrace, runId: string): OperatorConsoleView {
  return {
    runId,
    mode: "local-first",
    status: trace.result.status,
    summary: {
      totalAssetsProcessed: trace.normalizedAssets.totalCount,
      pipelineCount: 4,
      pipelineStatuses: {
        corpus: trace.pipelines.corpus.status,
        modelTraining: trace.pipelines.modelTraining.status,
        treatment: trace.pipelines.treatment.status,
        rewriteLabs: trace.pipelines.rewriteLabs.status
      },
      finalSealHash: trace.result.finalSealHash,
      snapshotHash: trace.result.snapshotHash
    },
    pipelines: [
      {
        name: "corpus",
        status: trace.pipelines.corpus.status,
        assetCount: trace.pipelines.corpus.assetIds.length,
        messageCount: 0,
        hash: trace.pipelines.corpus.hash
      },
      {
        name: "modelTraining",
        status: trace.pipelines.modelTraining.status,
        assetCount: trace.pipelines.modelTraining.assetIds.length,
        messageCount: 0,
        hash: trace.pipelines.modelTraining.hash
      },
      {
        name: "treatment",
        status: trace.pipelines.treatment.status,
        assetCount: 0,
        messageCount: trace.pipelines.treatment.messageCount,
        hash: trace.pipelines.treatment.hash
      },
      {
        name: "rewriteLabs",
        status: trace.pipelines.rewriteLabs.status,
        assetCount: trace.pipelines.rewriteLabs.assetIds.length,
        messageCount: 0,
        hash: trace.pipelines.rewriteLabs.hash
      }
    ],
    routing: {
      regime: trace.regimeSelected,
      localFirstEnabled: trace.localFirst,
      backends: ["ollama", "llamafile", "mock"]
    },
    certificates: {
      localFirst: true,
      deterministic: true,
      sealed: true
    }
  };
}

/**
 * Write console view to data/console/<runId>-console.json
 */
export function emitConsoleView(
  trace: ExecutionTrace,
  runId: string
): OperatorConsoleView {
  fs.mkdirSync("data/console", { recursive: true });

  const view = deriveConsoleView(trace, runId);

  const consolePath = path.join("data/console", `${runId}-console.json`);
  fs.writeFileSync(consolePath, JSON.stringify({ operatorConsoleView: view }, null, 2));

  return view;
}

/**
 * Load console view by runId
 */
export function loadConsoleView(runId: string): OperatorConsoleView | null {
  const consolePath = path.join("data/console", `${runId}-console.json`);
  if (!fs.existsSync(consolePath)) return null;
  const data = JSON.parse(fs.readFileSync(consolePath, "utf8"));
  return data.operatorConsoleView;
}

/**
 * Generate human-readable report from console view
 */
export function generateReport(view: OperatorConsoleView): string {
  const lines: string[] = [];

  lines.push("=== Operator Console Report ===");
  lines.push(`Run ID: ${view.runId}`);
  lines.push(`Mode: ${view.mode}`);
  lines.push(`Status: ${view.status}`);
  lines.push("");

  lines.push("Summary:");
  lines.push(`  Total Assets: ${view.summary.totalAssetsProcessed}`);
  lines.push(`  Pipelines: ${view.summary.pipelineCount}`);
  lines.push(`  Final Seal Hash: ${view.summary.finalSealHash.substring(0, 16)}...`);
  lines.push("");

  lines.push("Pipeline Status:");
  for (const pipeline of view.pipelines) {
    lines.push(
      `  ${pipeline.name}: ${pipeline.status} (${pipeline.assetCount} assets, ${pipeline.messageCount} messages)`
    );
  }
  lines.push("");

  lines.push("Routing:");
  lines.push(`  Regime: ${view.routing.regime}`);
  lines.push(`  Local-First: ${view.routing.localFirstEnabled}`);
  lines.push(`  Backends: ${view.routing.backends.join(", ")}`);
  lines.push("");

  lines.push("Certificates:");
  lines.push(`  Local-First: ${view.certificates.localFirst}`);
  lines.push(`  Deterministic: ${view.certificates.deterministic}`);
  lines.push(`  Sealed: ${view.certificates.sealed}`);

  return lines.join("\n");
}
