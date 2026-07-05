export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttlMs: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
}
export declare class RagCache<T> {
    private cache;
    private maxSize;
    private defaultTtlMs;
    private stats;
    constructor(maxSize?: number, defaultTtlMs?: number);
    set(key: string, data: T, ttlMs?: number): void;
    get(key: string): T | null;
    has(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
    getHitRate(): number;
    size(): number;
    static generateKey(query: string, params?: Record<string, any>): string;
}
export declare const ragSearchCache: RagCache<{
    slug: string;
    title: string;
    snippet: string;
}[]>;
export declare const ragContextCache: RagCache<string>;
//# sourceMappingURL=ragCache.d.ts.map