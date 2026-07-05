/**
 * Phase 8: Model Descriptor
 * Defines model capabilities, costs, and SLA constraints.
 */
export interface ModelDescriptor {
    id: string;
    name: string;
    costPerMInput: number;
    costPerMOutput: number;
    latencyP95Ms: number;
    throughputTokPerSec: number;
    maxOutputTokens: number;
    contextWindowTokens: number;
    tier: 'premium' | 'standard' | 'economy';
    enabled: boolean;
    deprecated?: boolean;
}
export interface ModelCostEstimate {
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
}
export declare function calculateModelCost(model: ModelDescriptor, inputTokens: number, outputTokens: number): number;
export declare function estimateCost(model: ModelDescriptor, inputTokens: number, maxOutputTokens: number): ModelCostEstimate;
//# sourceMappingURL=model_descriptor.d.ts.map