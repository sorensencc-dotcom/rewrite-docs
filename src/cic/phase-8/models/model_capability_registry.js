/**
 * Phase 8: Model Capability Registry
 * In-memory store of model descriptors with filtering + scoring
 */
/**
 * Model capability registry
 * - In-memory store
 * - Supports hot-swap via register()
 * - Filters candidates by operationType, maxContextTokens, latency, quality
 * - Returns sorted by driftScore (ascending)
 */
export class ModelCapabilityRegistry {
    models = new Map();
    /**
     * Register or update a model descriptor
     */
    register(descriptor) {
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
    getCandidates(operationType, maxLatencyMs, minQualityTier, estimatedInputTokens = 0) {
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
    getModelById(id) {
        // TODO: Implement
        // - return this.models.get(id) || null
        return null;
    }
    /**
     * Get all registered models
     */
    getAllModels() {
        // TODO: Implement
        // - return Array.from(this.models.values())
        return [];
    }
    /**
     * Helper: quality tier ranking for comparisons
     */
    qualityTierRank(tier) {
        // TODO: Implement
        // SMALL: 1, MEDIUM: 2, LARGE: 3
        return 0;
    }
}
//# sourceMappingURL=model_capability_registry.js.map