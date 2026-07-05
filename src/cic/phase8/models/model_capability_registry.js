/**
 * Phase 8: Model Capability Registry
 * Maintains model catalog and filters candidates based on constraints.
 */
import { estimateCost } from '../types/model_descriptor.js';
export class ModelCapabilityRegistry {
    models = new Map();
    register(model) {
        this.models.set(model.id, model);
    }
    deregister(modelId) {
        this.models.delete(modelId);
    }
    getModelById(modelId) {
        return this.models.get(modelId);
    }
    getAllModels() {
        return Array.from(this.models.values());
    }
    getCandidates(inputTokens, maxOutputTokens, criteria) {
        let candidates = Array.from(this.models.values());
        // Filter by enabled status
        if (criteria?.requireEnabled !== false) {
            candidates = candidates.filter(m => m.enabled && !m.deprecated);
        }
        // Filter by context window
        if (criteria?.minContextWindowTokens) {
            candidates = candidates.filter(m => m.contextWindowTokens >= criteria.minContextWindowTokens);
        }
        // Filter by latency
        if (criteria?.maxLatencyP95Ms) {
            candidates = candidates.filter(m => m.latencyP95Ms <= criteria.maxLatencyP95Ms);
        }
        // Filter by throughput
        if (criteria?.minThroughputTokPerSec) {
            candidates = candidates.filter(m => m.throughputTokPerSec >= criteria.minThroughputTokPerSec);
        }
        // Filter by tier
        if (criteria?.allowedTiers && criteria.allowedTiers.length > 0) {
            candidates = candidates.filter(m => criteria.allowedTiers.includes(m.tier));
        }
        // Compute estimated costs and sort by cost (ascending)
        const withCosts = candidates.map(m => ({
            model: m,
            estimatedCostUsd: estimateCost(m, inputTokens, maxOutputTokens).estimatedCostUsd
        }));
        return withCosts.sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd);
    }
    getPrimaryModel() {
        // Return highest-tier enabled model (premium > standard > economy)
        const tiers = ['premium', 'standard', 'economy'];
        for (const tier of tiers) {
            const models = Array.from(this.models.values()).filter(m => m.tier === tier && m.enabled);
            if (models.length > 0)
                return models[0];
        }
        return undefined;
    }
    getFallbackModel() {
        // Return lowest-cost standard or economy model
        const candidates = Array.from(this.models.values()).filter(m => (m.tier === 'standard' || m.tier === 'economy') && m.enabled);
        return candidates.sort((a, b) => {
            const aCost = (a.costPerMInput + a.costPerMOutput) / 2;
            const bCost = (b.costPerMInput + b.costPerMOutput) / 2;
            return aCost - bCost;
        })[0];
    }
    getEmergencyModel() {
        // Return lowest-cost enabled model regardless of tier
        const candidates = Array.from(this.models.values()).filter(m => m.enabled);
        return candidates.sort((a, b) => {
            const aCost = (a.costPerMInput + a.costPerMOutput) / 2;
            const bCost = (b.costPerMInput + b.costPerMOutput) / 2;
            return aCost - bCost;
        })[0];
    }
}
//# sourceMappingURL=model_capability_registry.js.map