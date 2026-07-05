/**
 * Phase 8: Request Context
 * Defines request structure passed through cost optimization pipeline.
 */
export function validateRequestContext(ctx) {
    if (!ctx || typeof ctx !== 'object')
        return false;
    const c = ctx;
    return (typeof c.requestId === 'string' &&
        typeof c.timestamp === 'string' &&
        typeof c.agentId === 'string' &&
        typeof c.serviceId === 'string' &&
        typeof c.model === 'string' &&
        typeof c.estimatedInputTokens === 'number' &&
        typeof c.estimatedOutputTokens === 'number' &&
        ['critical', 'high', 'normal', 'low'].includes(c.priority) &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(c.timestamp));
}
//# sourceMappingURL=request_context.js.map