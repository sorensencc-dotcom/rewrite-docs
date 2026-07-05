import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
import { CacheMetricsCollector } from "../cache-engine/cache-metrics";
import { CachePolicyManager } from "./cache-policy";
import { OfflineModeHandler } from "./offline-mode";
import { AdapterResponse } from "../cache-engine/cache-types";
export declare class AdapterWrapper {
    private adapterId;
    private adapter;
    private l1;
    private l2;
    private metrics;
    private policyManager;
    private offlineHandler;
    private trackedKeys;
    constructor(adapterId: string, adapter: any, l1: L1MemoryCache, l2: L2DiskCache, metrics: CacheMetricsCollector, policyManager: CachePolicyManager, offlineHandler: OfflineModeHandler);
    invoke(payload: any, skipCache?: boolean): Promise<AdapterResponse>;
    private invokeAdapter;
    getMetrics(): import("../cache-engine/cache-types").CacheMetrics;
    invalidateCache(pattern?: string): Promise<number>;
}
//# sourceMappingURL=adapter-wrapper.d.ts.map