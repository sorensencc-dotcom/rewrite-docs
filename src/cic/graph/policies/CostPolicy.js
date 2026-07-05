/**
 * Phase 8: Cost Policy
 * Defines how cost optimization context is merged and what engines are required.
 */
export const CostPolicy = {
    name: 'CIC.Cost',
    require: ['Phase8'],
    optional: ['TrueCode', 'GitNexus'],
    mergeStrategy: 'cost-first'
};
//# sourceMappingURL=CostPolicy.js.map