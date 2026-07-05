// src/build-system/auto-repair-engine.ts
const REPAIR_STRATEGIES = {
    TIMEOUT: ['USE_CACHED_ARTIFACTS', 'REDUCE_CONCURRENCY'],
    CRASH: ['CLEAR_OUTPUTS_AND_REBUILD'],
    DRIFT: ['CLEAR_OUTPUTS_AND_REBUILD'],
    OOM: ['REDUCE_BATCH', 'CLEAR_MEMORY_CACHE'],
    GPU_OOM: ['FALLBACK_TO_CPU', 'REDUCE_BATCH'],
    RESOURCE_SPIKE: ['REDUCE_CONCURRENCY'],
};
export class AutoRepairEngine {
    planRepair(failure) {
        const actions = REPAIR_STRATEGIES[failure.category] ?? [];
        const reason = `Repair plan for ${failure.category} on node ${failure.nodeId}`;
        return { actions, reason };
    }
    async executeRepair(ctx, plan) {
        for (const action of plan.actions) {
            switch (action) {
                case 'REDUCE_BATCH':
                    await ctx.reduceBatchSize(ctx.nodeId);
                    break;
                case 'REDUCE_CONCURRENCY':
                    await ctx.reduceConcurrency(ctx.nodeId);
                    break;
                case 'CLEAR_MEMORY_CACHE':
                    await ctx.clearMemoryCache(ctx.nodeId);
                    break;
                case 'USE_CACHED_ARTIFACTS':
                    await ctx.useCachedArtifacts(ctx.nodeId);
                    break;
                case 'CLEAR_OUTPUTS_AND_REBUILD':
                    await ctx.clearOutputsAndRebuild(ctx.nodeId);
                    break;
                case 'APPLY_PINNED_DEP_OVERRIDES':
                    await ctx.applyPinnedDepOverrides(ctx.nodeId);
                    break;
                case 'FALLBACK_TO_CPU':
                    await ctx.fallbackToCpu(ctx.nodeId);
                    break;
            }
        }
    }
}
//# sourceMappingURL=auto-repair-engine.js.map