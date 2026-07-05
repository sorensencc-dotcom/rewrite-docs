export function validateGraphContext(ctx) {
    if (!ctx || typeof ctx !== 'object')
        return false;
    if (!ctx.code || typeof ctx.code !== 'object')
        return false;
    if (!ctx.history || typeof ctx.history !== 'object')
        return false;
    if (!ctx.knowledge || typeof ctx.knowledge !== 'object')
        return false;
    if (!ctx.meta || typeof ctx.meta !== 'object')
        return false;
    if (typeof ctx.meta.generatedAt !== 'string')
        return false;
    if (typeof ctx.meta.policy !== 'string')
        return false;
    return true;
}
export * from '../cic/graph/GraphContext.js';
//# sourceMappingURL=index.js.map