// src/maal/router/route-with-sandbox.ts

import { SandboxTierId } from "../../cic/types/run-manifest";
import { MAALRouteRequest, MAALRouteResponse } from "./maal-router-types";
import sandboxConfig from "./sandbox.config.json";
import { selectModel } from "./llm-router"; // existing router

/**
 * Isolation ranking for SLO comparison
 */
const isolationRank = {
  low: 0,
  medium: 1,
  high: 2
} as const;

/**
 * Map sandbox isolationLevel → isolationRank
 */
function mapIsolationLevelToRank(level: string): number {
  switch (level) {
    case "container":
      return isolationRank.low;
    case "hardened_container":
      return isolationRank.medium;
    case "microvm":
    case "microvm_offline":
      return isolationRank.high;
    default:
      return isolationRank.low;
  }
}

/**
 * Cost ranking for tier selection
 */
const costRank = {
  lowest: 0,
  low: 1,
  medium: 2,
  highest: 3
} as const;

/**
 * Select sandbox tier based on:
 * - trustLevel
 * - dataSensitivity
 * - taskType
 * - SLO isolation requirement
 * - cost preference
 */
export function selectSandboxTier(req: MAALRouteRequest): {
  id: SandboxTierId;
  reasonCodes: string[];
} {
  const entries = Object.entries(sandboxConfig.sandboxMatrix) as [
    SandboxTierId,
    any
  ][];

  // 1. Filter by trust + sensitivity + taskType
  const filtered = entries.filter(([tierId, cfg]) => {
    return (
      cfg.defaultFor.trustLevels.includes(req.trustLevel) &&
      cfg.defaultFor.dataSensitivity.includes(req.dataSensitivity) &&
      cfg.defaultFor.taskTypes.includes(req.taskType)
    );
  });

  // No match → default to S1
  if (filtered.length === 0) {
    return {
      id: "S1",
      reasonCodes: [
        "sandbox:no_match_default_S1",
        `trust:${req.trustLevel}`,
        `sensitivity:${req.dataSensitivity}`,
        `taskType:${req.taskType}`
      ]
    };
  }

  // 2. Apply isolation SLO
  const requiredIsolationRank = isolationRank[req.sloProfile.isolation];

  const isolationFiltered = filtered.filter(([tierId, cfg]) => {
    const tierIsolationRank = mapIsolationLevelToRank(cfg.isolationLevel);
    return tierIsolationRank >= requiredIsolationRank;
  });

  const candidates = isolationFiltered.length > 0 ? isolationFiltered : filtered;

  // 3. Apply cost + latency preference
  const chosen = pickByCostAndLatency(candidates, req.costBudget, req.sloProfile);

  const [chosenId, chosenCfg] = chosen;

  return {
    id: chosenId,
    reasonCodes: [
      `sandbox:${chosenId}`,
      `sandboxIsolation:${chosenCfg.isolationLevel}`,
      `sandboxCostTier:${chosenCfg.costTier}`,
      `trust:${req.trustLevel}`,
      `sensitivity:${req.dataSensitivity}`,
      `sloIsolation:${req.sloProfile.isolation}`
    ]
  };
}

/**
 * Heuristic:
 * - latency=low → cheapest tier
 * - latency=medium → middle tier
 * - latency=high → highest tier
 */
function pickByCostAndLatency(
  candidates: [SandboxTierId, any][],
  costBudget: number | undefined,
  slo: MAALRouteRequest["sloProfile"]
): [SandboxTierId, any] {
  const sorted = [...candidates].sort((a, b) => {
    const costA = costRank[a[1].costTier];
    const costB = costRank[b[1].costTier];
    return costA - costB;
  });

  if (slo.latency === "low") {
    return sorted[0];
  }

  if (slo.latency === "medium") {
    const midIndex = Math.floor(sorted.length / 2);
    return sorted[midIndex];
  }

  return sorted[sorted.length - 1];
}

/**
 * Main MAAL router wrapper:
 * - Select model (existing LLMRouter)
 * - Select sandbox tier (new)
 */
export function routeWithSandbox(req: MAALRouteRequest): MAALRouteResponse {
  const model = selectModel(req);
  const sandbox = selectSandboxTier(req);

  return {
    selectedModel: model.id,
    selectedSandboxTier: sandbox.id,
    reasonCodes: [...model.reasonCodes, ...sandbox.reasonCodes]
  };
}
