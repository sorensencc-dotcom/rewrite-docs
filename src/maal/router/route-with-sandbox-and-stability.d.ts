import { MAALRouteRequest, MAALRouteResponse } from "./maal-router-types";
/**
 * Historical stability stats derived from CIC audit log.
 * These are fed into MAALRouteRequest.context by the caller.
 */
export interface HistoricalStabilityStats {
    modelId: string;
    sandboxTier: "S0" | "S1" | "S2" | "S3";
    avgDriftScore: number;
    sloViolationRate: number;
    sampleSize: number;
}
export interface MAALRouteContext {
    historicalStats?: HistoricalStabilityStats[];
}
/**
 * Compute stability score for a given (modelId, sandboxTier)
 * Higher score = more stable.
 */
export declare function computeStabilityScore(modelId: string, sandboxTier: "S0" | "S1" | "S2" | "S3", stats?: HistoricalStabilityStats[]): number;
/**
 * MAAL router wrapper that incorporates stability feedback.
 * - First selects model + sandbox tier (routeWithSandbox)
 * - Then computes stabilityScore based on historical stats
 */
export declare function routeWithSandboxAndStability(req: MAALRouteRequest): MAALRouteResponse;
//# sourceMappingURL=route-with-sandbox-and-stability.d.ts.map