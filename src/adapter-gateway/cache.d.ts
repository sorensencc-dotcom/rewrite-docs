/**
 * Adapter Gateway Cache
 * Workstream C: L1 in-memory + L2 distributed caching
 *
 * TODO: Implement
 * - [ ] L1 in-memory cache with TTL/LRU eviction
 * - [ ] L2 distributed cache (Redis) client
 * - [ ] Cache invalidation rules
 * - [ ] Hit/miss metrics collection
 * - [ ] Stampede prevention
 */
export interface CacheConfig {
    l1MaxSize: number;
    l1TTL: number;
    l2Enabled: boolean;
    l2Host?: string;
    l2Port?: number;
    stampedePrevention: boolean;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    evictions: number;
    stampedeCount: number;
}
/**
 * L1 In-Memory Cache with LRU eviction
 */
export declare class L1Cache {
    private cache;
    private lruOrder;
    private maxSize;
    private ttl;
    private metrics;
    constructor(config: CacheConfig);
    /**
     * Get value from cache
     */
    get(key: string): unknown | null;
    /**
     * Set value in cache
     */
    set(key: string, value: unknown): void;
    /**
     * Invalidate cache entry
     */
    invalidate(key: string): void;
    /**
     * Get cache metrics
     */
    getMetrics(): CacheMetrics;
}
/**
 * L2 Distributed Cache (Redis stub)
 */
export declare class L2Cache {
    private enabled;
    private host;
    private port;
    constructor(config: CacheConfig);
    /**
     * Get value from distributed cache
     */
    get(key: string): Promise<unknown | null>;
    /**
     * Set value in distributed cache
     */
    set(key: string, value: unknown, ttl: number): Promise<void>;
    /**
     * Invalidate distributed cache entry
     */
    invalidate(key: string): Promise<void>;
}
/**
 * Unified Cache with L1+L2 hierarchy
 */
export declare class AdapterGatewayCache {
    private l1;
    private l2;
    private config;
    constructor(config: CacheConfig);
    /**
     * Get from L1, fall back to L2, then origin
     */
    get(key: string): Promise<unknown | null>;
    /**
     * Set in both L1 and L2
     */
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    /**
     * Invalidate both caches
     */
    invalidate(key: string): Promise<void>;
    /**
     * Get metrics
     */
    getMetrics(): CacheMetrics;
}
//# sourceMappingURL=cache.d.ts.map