// src/maal/router/route-with-sandbox-and-stability.ts
import { routeWithSandbox } from "./route-with-sandbox";
/**
 * Compute stability score for a given (modelId, sandboxTier)
 * Higher score = more stable.
 */
export function computeStabilityScore(modelId, sandboxTier, stats) {
    if (!stats || stats.length === 0) {
        return 0.5; // neutral default
    }
    const entry = stats.find(s => s.modelId === modelId && s.sandboxTier === sandboxTier);
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
export function routeWithSandboxAndStability(req) {
    const baseRoute = routeWithSandbox(req);
    const stabilityScore = computeStabilityScore(baseRoute.selectedModel, baseRoute.selectedSandboxTier, req.context?.historicalStats);
    return {
        ...baseRoute,
        stabilityScore,
        reasonCodes: [
            ...baseRoute.reasonCodes,
            `stabilityScore:${stabilityScore.toFixed(3)}`
        ]
    };
}
//# sourceMappingURL=route-with-sandbox-and-stability.js.map