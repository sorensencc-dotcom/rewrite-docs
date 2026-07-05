import { CacheConfig, AdapterResponse, CacheMetrics } from "../cache-engine/cache-types";
export declare class AdapterGateway {
    private wrappers;
    private l1;
    private l2;
    private metrics;
    private policyManager;
    private offlineHandler;
    private initialized;
    constructor(config: CacheConfig);
    initialize(): Promise<void>;
    registerAdapter(adapterId: string, adapter: any): void;
    unregisterAdapter(adapterId: string): boolean;
    invoke(adapterId: string, payload: any, skipCache?: boolean): Promise<AdapterResponse>;
    setOfflineMode(enabled: boolean): void;
    getOfflineStatus(): {
        isOffline: boolean;
        durationMs: number;
    };
    preloadOfflineCache(adapterId: string, keys: string[]): Promise<number>;
    invalidateAdapter(adapterId: string, pattern?: string): Promise<number>;
    invalidateAll(): Promise<number>;
    getMetrics(): CacheMetrics;
    getMetricsSummary(): string;
    getHitRate(): number;
    getOfflineStats(): {
        cachedKeys: number;
        lastKnownGoodCount: number;
        oldestEntry: number | null;
    };
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getRegisteredAdapters(): string[];
}
//# sourceMappingURL=adapter-gateway.d.ts.map