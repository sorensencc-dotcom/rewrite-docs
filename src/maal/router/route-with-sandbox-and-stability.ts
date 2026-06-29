// src/maal/router/route-with-sandbox-and-stability.ts

import { MAALRouteRequest, MAALRouteResponse } from "./maal-router-types";
import { routeWithSandbox } from "./route-with-sandbox";

/**
 * Historical stability stats derived from CIC audit log.
 * These are fed into MAALRouteRequest.context by the caller.
 */
export interface HistoricalStabilityStats {
  modelId: string;
  sandboxTier: "S0" | "S1" | "S2" | "S3";
  avgDriftScore: number;      // 0–1
  sloViolationRate: number;   // 0–1
  sampleSize: number;
}

export interface MAALRouteContext {
  historicalStats?: HistoricalStabilityStats[];
}

/**
 * Compute stability score for a given (modelId, sandboxTier)
 * Higher score = more stable.
 */
export function computeStabilityScore(
  modelId: string,
  sandboxTier: "S0" | "S1" | "S2" | "S3",
  stats?: HistoricalStabilityStats[]
): number {
  if (!stats || stats.length === 0) {
    return 0.5; // neutral default
  }

  const entry = stats.find(
    s => s.modelId === modelId && s.sandboxTier === sandboxTier
  );

  if (!entry) {
    return 0.5; // neutral default
  }

  // Stability = average of (1 - driftScore) and (1 - SLO violation rate)
  const driftComponent = 1 - entry.avgDriftScore;
  const sloComponent = 1 - entry.sloViolationRate;

  const stability = 0.5 * driftComponent + 0.5 * sloComponent;

  return Math.max(0, Math.min(1, stability));
}

/**
 * MAAL router wrapper that incorporates stability feedback.
 * - First selects model + sandbox tier (routeWithSandbox)
 * - Then computes stabilityScore based on historical stats
 */
export function routeWithSandboxAndStability(
  req: MAALRouteRequest
): MAALRouteResponse {
  const baseRoute = routeWithSandbox(req);

  const stabilityScore = computeStabilityScore(
    baseRoute.selectedModel,
    baseRoute.selectedSandboxTier,
    req.context?.historicalStats as HistoricalStabilityStats[] | undefined
  );

  return {
    ...baseRoute,
    stabilityScore,
    reasonCodes: [
      ...baseRoute.reasonCodes,
      `stabilityScore:${stabilityScore.toFixed(3)}`
    ]
  };
}
