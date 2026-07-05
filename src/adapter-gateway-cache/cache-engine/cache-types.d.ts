export interface CacheConfig {
    l1MaxEntries: number;
    l2DiskDir: string;
    defaultTTLMs: number;
    enableMetrics: boolean;
}
export interface CacheHit {
    source: "l1" | "l2" | "provider" | "offline";
    data: any;
    timestamp: number;
    ttlMs?: number;
}
export interface CacheMetrics {
    l1Hits: number;
    l2Hits: number;
    providerHits: number;
    offlineHits: number;
    evictions: number;
    diskWrites: number;
    diskReads: number;
    errors: number;
}
export interface CacheEntry {
    key: string;
    value: any;
    timestamp: number;
    ttlMs?: number;
    sourceAdapter?: string;
}
export interface AdapterRequest {
    adapterId: string;
    payload: any;
    skipCache?: boolean;
    offlineMode?: boolean;
}
export interface AdapterResponse {
    success: boolean;
    data?: any;
    source: "l1" | "l2" | "provider" | "offline" | "error";
    error?: string;
    timestamp: number;
    cacheKey?: string;
}
//# sourceMappingURL=cache-types.d.ts.map