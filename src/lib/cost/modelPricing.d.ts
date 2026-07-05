/**
 * Model Pricing Table
 * Current rates (USD per 1M tokens)
 */
export declare const MODEL_RATES: Record<string, {
    input: number;
    output: number;
}>;
export declare function computeCost(model: string, tokensIn: number, tokensOut: number): number;
//# sourceMappingURL=modelPricing.d.ts.map