/**
 * Phase 8: Model Capability Registry
 * Maintains model catalog and filters candidates based on constraints.
 */
import { ModelDescriptor } from '../types/model_descriptor.js';
export interface FilterCriteria {
    minContextWindowTokens?: number;
    maxLatencyP95Ms?: number;
    minThroughputTokPerSec?: number;
    allowedTiers?: Array<'premium' | 'standard' | 'economy'>;
    requireEnabled?: boolean;
}
export declare class ModelCapabilityRegistry {
    private models;
    register(model: ModelDescriptor): void;
    deregister(modelId: string): void;
    getModelById(modelId: string): ModelDescriptor | undefined;
    getAllModels(): ModelDescriptor[];
    getCandidates(inputTokens: number, maxOutputTokens: number, criteria?: FilterCriteria): Array<{
        model: ModelDescriptor;
        estimatedCostUsd: number;
    }>;
    getPrimaryModel(): ModelDescriptor | undefined;
    getFallbackModel(): ModelDescriptor | undefined;
    getEmergencyModel(): ModelDescriptor | undefined;
}
//# sourceMappingURL=model_capability_registry.d.ts.map