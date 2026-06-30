/*
  filename: multi-pipeline-orchestrator.ts
  purpose: fan normalized assets into 4 sealed deterministic pipelines
  version: 1.0.0
  deterministic: yes
*/

import fs from "fs";
import crypto from "crypto";
import { unifiedIngestionAdapter, NormalizedAsset } from "./unified-ingestion-adapter.js";
import { LocalFirstBus } from "../messaging/local-first-bus.js";

interface PipelineResult {
  status: "success" | "failure";
  assetIds: string[];
  hash: string;
  messages?: any[];
}

interface OrchestrationResult {
  status: "success" | "failure";
  pipelines: {
    corpus: PipelineResult;
    modelTraining: PipelineResult;
    treatment: PipelineResult;
    rewriteLabs: PipelineResult;
  };
  finalSealHash: string;
  assetCount: number;
}

/**
 * Pipeline 1: Append assets to world-state.json ingestedAssets
 */
function ingestCorpus(assets: NormalizedAsset[]): PipelineResult {
  const worldStatePath = "snapshot/world/world-state.json";
  const worldState = JSON.parse(fs.readFileSync(worldStatePath, "utf8"));

  const assetIds = assets.map(a => a.id);
  const currentAssets = worldState.ingestedAssets || [];
  worldState.ingestedAssets = Array.from(new Set([...currentAssets, ...assetIds]));

  fs.writeFileSync(worldStatePath, JSON.stringify(worldState, null, 2));

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(assetIds))
    .digest("hex");

  return {
    status: "success",
    assetIds,
    hash
  };
}

/**
 * Pipeline 2: Write training asset metadata
 */
function prepareModelTraining(assets: NormalizedAsset[]): PipelineResult {
  fs.mkdirSync("data", { recursive: true });

  const trainingAssets = assets.map(a => ({
    id: a.id,
    type: a.type,
    rawPath: a.rawPath,
    metadataHash: crypto
      .createHash("sha256")
      .update(JSON.stringify(a.metadata))
      .digest("hex"),
    textLength: a.text?.length || 0,
    embeddingDim: a.embedding.length
  }));

  const trainingPath = "data/training-assets.json";
  const existing = fs.existsSync(trainingPath)
    ? JSON.parse(fs.readFileSync(trainingPath, "utf8"))
    : [];

  const updated = [...existing, ...trainingAssets];
  fs.writeFileSync(trainingPath, JSON.stringify(updated, null, 2));

  const assetIds = assets.map(a => a.id);
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(trainingAssets))
    .digest("hex");

  return {
    status: "success",
    assetIds,
    hash
  };
}

/**
 * Pipeline 3: Queue assets via LocalFirstBus treatment flow
 */
function runTreatmentPipeline(assets: NormalizedAsset[]): PipelineResult {
  const bus = new LocalFirstBus();
  const assetIds: string[] = [];

  for (const asset of assets) {
    const msg = bus.send("cic-ingestion", "treatment-pipeline", "evidence_item", {
      assetId: asset.id,
      type: asset.type,
      metadataHash: asset.metadata.hash,
      embeddingHash: crypto
        .createHash("sha256")
        .update(JSON.stringify(asset.embedding))
        .digest("hex")
    });

    assetIds.push(asset.id);
  }

  // Compute hash over all queued messages
  const dump = bus.dump();
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(dump.map(m => ({ id: m.id, from: m.from, to: m.to }))))
    .digest("hex");

  return {
    status: "success",
    assetIds,
    hash,
    messages: dump
  };
}

/**
 * Pipeline 4: Generate redesign seeds
 */
function generateRewriteLabsAssets(assets: NormalizedAsset[]): PipelineResult {
  fs.mkdirSync("data", { recursive: true });

  const rewriteAssets = assets.map(a => ({
    id: a.id,
    type: a.type,
    originalPath: a.rawPath,
    proposedRewriteFormat: a.type === "document" ? "markdown-v2" : "svg-optimized",
    seed: a.embedding.slice(0, 32) // First 32 dims as seed for variation
  }));

  const rewritePath = "data/rewrite-labs-assets.json";
  const existing = fs.existsSync(rewritePath)
    ? JSON.parse(fs.readFileSync(rewritePath, "utf8"))
    : [];

  const updated = [...existing, ...rewriteAssets];
  fs.writeFileSync(rewritePath, JSON.stringify(updated, null, 2));

  const assetIds = assets.map(a => a.id);
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(rewriteAssets))
    .digest("hex");

  return {
    status: "success",
    assetIds,
    hash
  };
}

/**
 * Main orchestrator: normalize, then fan into 4 pipelines
 */
export function orchestrateMultiPipeline(input: {
  docs: string[];
  images: string[];
}): OrchestrationResult {
  try {
    // Normalize input
    const assets = unifiedIngestionAdapter(input);

    // Run 4 pipelines in sequence (deterministic order)
    const corpusResult = ingestCorpus(assets);
    const trainingResult = prepareModelTraining(assets);
    const treatmentResult = runTreatmentPipeline(assets);
    const rewriteLabsResult = generateRewriteLabsAssets(assets);

    // Compute final seal hash: concat all 4 pipeline hashes
    const combinedHash = crypto
      .createHash("sha256")
      .update(
        corpusResult.hash + trainingResult.hash + treatmentResult.hash + rewriteLabsResult.hash
      )
      .digest("hex");

    return {
      status: "success",
      pipelines: {
        corpus: corpusResult,
        modelTraining: trainingResult,
        treatment: treatmentResult,
        rewriteLabs: rewriteLabsResult
      },
      finalSealHash: combinedHash,
      assetCount: assets.length
    };
  } catch (err) {
    return {
      status: "failure",
      pipelines: {
        corpus: { status: "failure", assetIds: [], hash: "", messages: [] },
        modelTraining: { status: "failure", assetIds: [], hash: "", messages: [] },
        treatment: { status: "failure", assetIds: [], hash: "", messages: [] },
        rewriteLabs: { status: "failure", assetIds: [], hash: "", messages: [] }
      },
      finalSealHash: "",
      assetCount: 0
    };
  }
}
