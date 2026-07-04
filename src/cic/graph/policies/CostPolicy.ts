/**
 * Phase 8: Cost Policy
 * Defines how cost optimization context is merged and what engines are required.
 */

export const CostPolicy = {
  name: 'CIC.Cost',
  require: ['Phase8'] as const,
  optional: ['TrueCode', 'GitNexus'] as const,
  mergeStrategy: 'cost-first'
} as const;
