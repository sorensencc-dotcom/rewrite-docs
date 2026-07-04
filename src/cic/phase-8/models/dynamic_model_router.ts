/**
 * Phase 8: Dynamic Model Router
 * Routes requests to models based on cost + latency + drift scoring
 */

import { RequestContext } from '../types/request_context';
import { RuntimeSignals, PolicyDecision } from '../types/cost_event';
import { ModelDescriptor } from '../types/model_descriptor';
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
export class DynamicModelRouter {
  private readonly driftWeight = 0.4;
  private readonly latencyWeight = 0.3;
  private readonly costWeight = 0.3;

  constructor(
    private registry: ModelCapabilityRegistry,
    private fallbackModelId: string = 'fallback-model'
  ) {}

  /**
   * Route request to model
   * @param context Request context
   * @param signals Runtime signals (Phase 7 + Phase 8)
   * @param policyDecision Cost policy decision (ALLOW/DOWNGRADE/BLOCK)
   * @returns RoutingDecision with selectedModelId + candidates + scores + rationale
   */
  route(context: RequestContext, signals: RuntimeSignals, policyDecision: PolicyDecision): RoutingDecision {
    // TODO: Implement routing
    // 1. Get candidate models:
    //    candidates = registry.getCandidates(
    //      context.operationType,
    //      context.maxLatencyMs,
    //      context.minQualityTier,
    //      context.estimatedInputTokens
    //    )
    //
    // 2. If empty candidates, use fallback:
    //    return fallback decision
    //
    // 3. Apply policy override:
    //    - ALLOW: score all candidates normally
    //    - DOWNGRADE: filter to MEDIUM/SMALL, score by cost
    //    - BLOCK: filter to cheapest only, check CRITICAL priority
    //
    // 4. Score remaining candidates:
    //    score = driftWeight*drift + latencyWeight*latency + costWeight*cost
    //
    // 5. Select model with best (lowest) score
    //
    // 6. Build RoutingDecision with rationale

    return {
      selectedModelId: this.fallbackModelId,
      candidates: [],
      scores: {},
      driftScore: 0,
      policyDecision,
      rationale: 'fallback routing',
      timestamp: Date.now(),
    };
  }

  /**
   * Score a model based on drift, latency, cost
   * @private
   */
  private scoreModel(
    descriptor: ModelDescriptor,
    context: RequestContext,
    signals: RuntimeSignals
  ): number {
    // TODO: Implement scoring
    // drift_component = driftWeight * descriptor.driftScore
    // latency_component = latencyWeight * (descriptor.avgLatencyMs / context.maxLatencyMs)
    // cost_component = costWeight * (descriptor.costInputPerMTokenUsd / maxCostPerTokenUsd)
    // return drift_component + latency_component + cost_component
    return 0;
  }

  /**
   * Normalize cost for comparison
   * @private
   */
  private normalizeCost(descriptor: ModelDescriptor): number {
    // TODO: Implement
    // Return normalized cost (0–1) relative to most expensive model
    return 0;
  }
}
