/**
 * Phase 8: Model Descriptor
 * Defines model capabilities, costs, and SLA constraints.
 */

export interface ModelDescriptor {
  id: string;
  name: string;
  costPerMInput: number; // USD per million input tokens
  costPerMOutput: number; // USD per million output tokens
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

export function calculateModelCost(model: ModelDescriptor, inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * model.costPerMInput;
  const outputCost = (outputTokens / 1_000_000) * model.costPerMOutput;
  return inputCost + outputCost;
}

export function estimateCost(model: ModelDescriptor, inputTokens: number, maxOutputTokens: number): ModelCostEstimate {
  // Estimate output tokens as 25-50% of input (conservative)
  const estOutputTokens = Math.min(Math.ceil(inputTokens * 0.4), maxOutputTokens);
  const estimatedCostUsd = calculateModelCost(model, inputTokens, estOutputTokens);

  return {
    modelId: model.id,
    inputTokens,
    outputTokens: estOutputTokens,
    estimatedCostUsd
  };
}
