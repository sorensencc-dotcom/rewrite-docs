/**
 * Phase 8: Cost Policy
 * Defines how cost optimization context is merged and what engines are required.
 */
export declare const CostPolicy: {
    readonly name: "CIC.Cost";
    readonly require: readonly ["Phase8"];
    readonly optional: readonly ["TrueCode", "GitNexus"];
    readonly mergeStrategy: "cost-first";
};
//# sourceMappingURL=CostPolicy.d.ts.map