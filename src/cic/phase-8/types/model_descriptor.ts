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

  // Cost per 1M tokens
  costInputPerMTokenUsd: number;
  costOutputPerMTokenUsd: number;

  // Performance
  avgLatencyMs: number;
  qualityTier: QualityTier;

  // Capabilities
  maxContextTokens: number;
  supportedOperations: string[];

  // Health
  driftScore: number; // 0–1, Levenshtein drift from SLA
  available: boolean;
}

/**
 * Calculate request cost in USD
 * @param descriptor Model descriptor
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @returns Cost in USD
 */
export function calculateRequestCostUsd(
  descriptor: ModelDescriptor,
  inputTokens: number,
  outputTokens: number
): number {
  // TODO: Implement cost calculation
  // - Cost = (inputTokens / 1_000_000) * costInputPerMTokenUsd
  //        + (outputTokens / 1_000_000) * costOutputPerMTokenUsd
  return 0;
}

/**
 * Validate ModelDescriptor for required fields and constraints
 * @throws Error if validation fails
 */
export function validateModelDescriptor(descriptor: ModelDescriptor): void {
  // TODO: Implement validation
  // - Validate required fields present
  // - Validate driftScore in [0, 1]
  // - Validate cost values >= 0
  // - Validate avgLatencyMs > 0
  // - Validate maxContextTokens > 0
}
