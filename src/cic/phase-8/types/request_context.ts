/**
 * Phase 8: Request Context Types
 * RequestContext interface and validation helpers
 */

export type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type QualityTier = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface RequestContext {
  requestId: string;
  agentId: string;
  tenantId: string;
  priority: Priority;

  // SLA constraints
  maxLatencyMs: number;
  minQualityTier: QualityTier;

  // Model preference
  preferredModelIds?: string[];
  fallbackModelId?: string;

  // Token estimate
  estimatedInputTokens: number;

  // Metadata
  operationType: string; // e.g. 'ANALYZE', 'GENERATE', 'REVIEW'
  timestamp: number;
}

/** Default SLA values by priority tier */
export const DEFAULT_SLA_BY_PRIORITY: Record<Priority, { maxLatencyMs: number; minQualityTier: QualityTier }> = {
  CRITICAL: { maxLatencyMs: 100, minQualityTier: 'LARGE' },
  HIGH: { maxLatencyMs: 200, minQualityTier: 'MEDIUM' },
  NORMAL: { maxLatencyMs: 500, minQualityTier: 'SMALL' },
  LOW: { maxLatencyMs: 2000, minQualityTier: 'SMALL' },
};

/**
 * Validate RequestContext for required fields and constraints
 * @throws Error if validation fails
 */
export function validateRequestContext(context: RequestContext): void {
  // TODO: Implement validation
  // - Validate required fields present
  // - Validate maxLatencyMs > 0
  // - Validate estimatedInputTokens >= 0
  // - Validate priority in valid set
}

/**
 * Apply default SLA constraints based on priority
 */
export function applyDefaultSLA(context: RequestContext): RequestContext {
  // TODO: Implement SLA defaults
  // - If maxLatencyMs not set, use DEFAULT_SLA_BY_PRIORITY[priority]
  // - If minQualityTier not set, use DEFAULT_SLA_BY_PRIORITY[priority]
  return context;
}
