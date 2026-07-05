/**
 * Phase 8: Request Context Types
 * RequestContext interface and validation helpers
 */
/** Default SLA values by priority tier */
export const DEFAULT_SLA_BY_PRIORITY = {
    CRITICAL: { maxLatencyMs: 100, minQualityTier: 'LARGE' },
    HIGH: { maxLatencyMs: 200, minQualityTier: 'MEDIUM' },
    NORMAL: { maxLatencyMs: 500, minQualityTier: 'SMALL' },
    LOW: { maxLatencyMs: 2000, minQualityTier: 'SMALL' },
};
/**
 * Validate RequestContext for required fields and constraints
 * @throws Error if validation fails
 */
export function validateRequestContext(context) {
    // TODO: Implement validation
    // - Validate required fields present
    // - Validate maxLatencyMs > 0
    // - Validate estimatedInputTokens >= 0
    // - Validate priority in valid set
}
/**
 * Apply default SLA constraints based on priority
 */
export function applyDefaultSLA(context) {
    // TODO: Implement SLA defaults
    // - If maxLatencyMs not set, use DEFAULT_SLA_BY_PRIORITY[priority]
    // - If minQualityTier not set, use DEFAULT_SLA_BY_PRIORITY[priority]
    return context;
}
//# sourceMappingURL=request_context.js.map