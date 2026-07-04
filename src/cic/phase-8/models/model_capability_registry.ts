/**
 * Phase 8: Model Capability Registry
 * In-memory store of model descriptors with filtering + scoring
 */

import { ModelDescriptor } from '../types/model_descriptor';
import { QualityTier } from '../types/request_context';

/**
 * Model capability registry
 * - In-memory store
 * - Supports hot-swap via register()
 * - Filters candidates by operationType, maxContextTokens, latency, quality
 * - Returns sorted by driftScore (ascending)
 */
export class ModelCapabilityRegistry {
  private models: Map<string, ModelDescriptor> = new Map();

  /**
   * Register or update a model descriptor
   */
  register(descriptor: ModelDescriptor): void {
    // TODO: Implement
    // - this.models.set(descriptor.id, descriptor)
  }

  /**
   * Get candidate models matching constraints
   * - operationType support
   * - maxContextTokens ≥ estimated input tokens
   * - avgLatencyMs ≤ maxLatencyMs
   * - qualityTier ≥ minQualityTier
   * @returns Array sorted by driftScore (ascending)
   */
  getCandidates(
    operationType: string,
    maxLatencyMs: number,
    minQualityTier: QualityTier,
    estimatedInputTokens: number = 0
  ): ModelDescriptor[] {
    // TODO: Implement filtering
    // 1. Iterate over this.models.values()
    // 2. Filter by:
    //    - descriptor.supportedOperations includes operationType
    //    - descriptor.maxContextTokens >= estimatedInputTokens
    //    - descriptor.avgLatencyMs <= maxLatencyMs
    //    - qualityTierRank(descriptor.qualityTier) >= qualityTierRank(minQualityTier)
    //    - descriptor.available === true
    // 3. Sort by driftScore ascending
    // 4. Return sorted array
    return [];
  }

  /**
   * Get model by ID
   */
  getModelById(id: string): ModelDescriptor | null {
    // TODO: Implement
    // - return this.models.get(id) || null
    return null;
  }

  /**
   * Get all registered models
   */
  getAllModels(): ModelDescriptor[] {
    // TODO: Implement
    // - return Array.from(this.models.values())
    return [];
  }

  /**
   * Helper: quality tier ranking for comparisons
   */
  private qualityTierRank(tier: QualityTier): number {
    // TODO: Implement
    // SMALL: 1, MEDIUM: 2, LARGE: 3
    return 0;
  }
}
