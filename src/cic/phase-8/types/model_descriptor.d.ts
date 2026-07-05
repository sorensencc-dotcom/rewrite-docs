/**
 * Phase 8: Model Descriptor Types
 * ModelDescriptor interface and cost calculation helpers
 */
import { QualityTier } from './request_context';
export type ModelProvider = 'ANTHROPIC' | 'OLLAMA' | 'EXTERNAL';
export type ModelFamily = 'SMALL' | 'MEDIUM' | 'LARGE';
export interface ModelDescriptor {
    id: string;
    provider: ModelProvider;
    family: ModelFamily;
    costInputPerMTokenUsd: number;
    costOutputPerMTokenUsd: number;
    avgLatencyMs: number;
    qualityTier: QualityTier;
    maxContextTokens: number;
    supportedOperations: string[];
    driftScore: number;
    available: boolean;
}
/**
 * Calculate request cost in USD
 * @param descriptor Model descriptor
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @returns Cost in USD
 */
export declare function calculateRequestCostUsd(descriptor: ModelDescriptor, inputTokens: number, outputTokens: number): number;
/**
 * Validate ModelDescriptor for required fields and constraints
 * @throws Error if validation fails
 */
export declare function validateModelDescriptor(descriptor: ModelDescriptor): void;
//# sourceMappingURL=model_descriptor.d.ts.map