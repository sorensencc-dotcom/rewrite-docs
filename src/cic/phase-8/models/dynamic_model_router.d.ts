/**
 * Phase 8: Dynamic Model Router
 * Routes requests to models based on cost + latency + drift scoring
 */
import { RequestContext } from '../types/request_context';
import { RuntimeSignals, PolicyDecision } from '../types/cost_event';
import { ModelCapabilityRegistry } from './model_capability_registry';
export interface RoutingDecision {
    selectedModelId: string;
    candidates: string[];
    scores: Record<string, number>;
    driftScore: number;
    policyDecision: PolicyDecision;
    rationale: string;
    timestamp: number;
}
/**
 * Dynamic model router
 * Scoring function:
 *   score = (driftWeight × driftScore)
 *         + (latencyWeight × (avgLatencyMs / maxLatencyMs))
 *         + (costWeight × (costPerTokenUsd / maxCostPerTokenUsd))
 *
 * Policy override:
 *   - ALLOW: use normal scoring
 *   - DOWNGRADE: prefer MEDIUM/SMALL families
 *   - BLOCK: only CRITICAL priority; pick cheapest candidate
 *   - Fallback: if no candidate passes, use hardcoded fallback or error
 */
export declare class DynamicModelRouter {
    private registry;
    private fallbackModelId;
    private readonly driftWeight;
    private readonly latencyWeight;
    private readonly costWeight;
    constructor(registry: ModelCapabilityRegistry, fallbackModelId?: string);
    /**
     * Route request to model
     * @param context Request context
     * @param signals Runtime signals (Phase 7 + Phase 8)
     * @param policyDecision Cost policy decision (ALLOW/DOWNGRADE/BLOCK)
     * @returns RoutingDecision with selectedModelId + candidates + scores + rationale
     */
    route(context: RequestContext, signals: RuntimeSignals, policyDecision: PolicyDecision): RoutingDecision;
    /**
     * Score a model based on drift, latency, cost
     * @private
     */
    private scoreModel;
    /**
     * Normalize cost for comparison
     * @private
     */
    private normalizeCost;
}
//# sourceMappingURL=dynamic_model_router.d.ts.map