/**
 * Phase 8: Model Descriptor
 * Defines model capabilities, costs, and SLA constraints.
 */
export function calculateModelCost(model, inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1_000_000) * model.costPerMInput;
    const outputCost = (outputTokens / 1_000_000) * model.costPerMOutput;
    return inputCost + outputCost;
}
export function estimateCost(model, inputTokens, maxOutputTokens) {
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
//# sourceMappingURL=model_descriptor.js.map