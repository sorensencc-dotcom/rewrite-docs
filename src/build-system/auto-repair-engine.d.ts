import { FailureEvent } from './failure-detector';
export type RepairAction = 'REDUCE_BATCH' | 'REDUCE_CONCURRENCY' | 'CLEAR_MEMORY_CACHE' | 'USE_CACHED_ARTIFACTS' | 'CLEAR_OUTPUTS_AND_REBUILD' | 'APPLY_PINNED_DEP_OVERRIDES' | 'FALLBACK_TO_CPU';
export interface RepairPlan {
    actions: RepairAction[];
    reason: string;
}
export interface RepairExecutionContext {
    buildId: string;
    nodeId: string;
    reduceBatchSize: (nodeId: string) => Promise<void>;
    reduceConcurrency: (nodeId: string) => Promise<void>;
    clearMemoryCache: (nodeId: string) => Promise<void>;
    useCachedArtifacts: (nodeId: string) => Promise<void>;
    clearOutputsAndRebuild: (nodeId: string) => Promise<void>;
    applyPinnedDepOverrides: (nodeId: string) => Promise<void>;
    fallbackToCpu: (nodeId: string) => Promise<void>;
}
export declare class AutoRepairEngine {
    planRepair(failure: FailureEvent): RepairPlan;
    executeRepair(ctx: RepairExecutionContext, plan: RepairPlan): Promise<void>;
}
//# sourceMappingURL=auto-repair-engine.d.ts.map