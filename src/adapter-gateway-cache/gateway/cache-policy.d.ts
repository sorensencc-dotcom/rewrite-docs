export declare enum CachePolicy {
    ALWAYS = "always",
    NEVER = "never",
    ON_MISS = "on_miss",
    READ_ONLY = "read_only"
}
export interface TTLPolicy {
    adapter?: string;
    default: number;
    min?: number;
    max?: number;
    override?: Record<string, number>;
}
export declare class CachePolicyManager {
    private policies;
    private ttlPolicy;
    private invalidationPatterns;
    constructor(defaultTTL?: number);
    setPolicy(adapterId: string, policy: CachePolicy): void;
    getPolicy(adapterId: string): CachePolicy;
    shouldCache(adapterId: string): boolean;
    shouldWrite(adapterId: string): boolean;
    getTTL(adapterId: string): number;
    setTTLPolicy(policy: TTLPolicy): void;
    setInvalidationPattern(adapterId: string, patterns: string[]): void;
    getInvalidationPatterns(adapterId: string): string[];
    matchesInvalidation(key: string, patterns: string[]): boolean;
}
export declare const DEFAULT_CACHE_POLICY: CachePolicyManager;
//# sourceMappingURL=cache-policy.d.ts.map