/**
 * Phase 8: Request Context
 * Defines request structure passed through cost optimization pipeline.
 */
export interface RequestContext {
    requestId: string;
    timestamp: string;
    agentId: string;
    serviceId: string;
    model: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    maxOutputTokens?: number;
    priority: 'critical' | 'high' | 'normal' | 'low';
    slaMs?: number;
    metadata?: Record<string, unknown>;
}
export interface ValidatedRequestContext extends RequestContext {
    validated: true;
    validatedAt: string;
}
export declare function validateRequestContext(ctx: unknown): ctx is ValidatedRequestContext;
//# sourceMappingURL=request_context.d.ts.map