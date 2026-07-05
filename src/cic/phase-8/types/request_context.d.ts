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
    maxLatencyMs: number;
    minQualityTier: QualityTier;
    preferredModelIds?: string[];
    fallbackModelId?: string;
    estimatedInputTokens: number;
    operationType: string;
    timestamp: number;
}
/** Default SLA values by priority tier */
export declare const DEFAULT_SLA_BY_PRIORITY: Record<Priority, {
    maxLatencyMs: number;
    minQualityTier: QualityTier;
}>;
/**
 * Validate RequestContext for required fields and constraints
 * @throws Error if validation fails
 */
export declare function validateRequestContext(context: RequestContext): void;
/**
 * Apply default SLA constraints based on priority
 */
export declare function applyDefaultSLA(context: RequestContext): RequestContext;
//# sourceMappingURL=request_context.d.ts.map