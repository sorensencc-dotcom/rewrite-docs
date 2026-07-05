export interface RateLimiterConfig {
    requestsPerSecond?: number;
    burstSize?: number;
    name?: string;
}
export interface RateLimiterMetrics {
    tokensAvailable: number;
    requestsPerSecond: number;
    rejected: number;
    allowed: number;
    rejection_rate: number;
}
/**
 * Token bucket rate limiter: allows bursts but enforces rate limit.
 * - Add tokens at fixed rate (e.g., 10 tokens/sec)
 * - Each request costs 1 token
 * - Reject if insufficient tokens
 */
export declare class RateLimiter {
    private tokens;
    private readonly maxTokens;
    private readonly refillRate;
    private lastRefillTime;
    private rejected;
    private allowed;
    private readonly name;
    constructor(config?: RateLimiterConfig);
    /**
     * Try to consume 1 token. Returns true if allowed.
     */
    tryConsume(): boolean;
    /**
     * Block until token available (promise-based).
     */
    consume(): Promise<void>;
    private refill;
    getMetrics(): RateLimiterMetrics;
    reset(): void;
}
/**
 * Registry of rate limiters per endpoint/provider.
 */
export declare class RateLimiterRegistry {
    private limiters;
    private defaultConfig;
    constructor(defaultConfig?: RateLimiterConfig);
    getOrCreate(name: string, config?: RateLimiterConfig): RateLimiter;
    get(name: string): RateLimiter | undefined;
    tryConsume(name: string): Promise<boolean>;
    consume(name: string): Promise<void>;
    getMetrics(name: string): RateLimiterMetrics | undefined;
    getAllMetrics(): Record<string, RateLimiterMetrics>;
    reset(name: string): void;
    resetAll(): void;
}
//# sourceMappingURL=rateLimiter.d.ts.map