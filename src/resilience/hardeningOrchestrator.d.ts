export interface HardeningConfig {
    name: string;
    circuitBreakerFailureThreshold?: number;
    rateLimiterRequestsPerSecond?: number;
    timeoutMs?: number;
    maxRetries?: number;
}
export interface HardeningMetrics {
    name: string;
    circuitBreaker: any;
    rateLimiter: any;
    timeout: any;
    retry: any;
    fallback: any;
}
/**
 * Composite hardening orchestrator: combines all resilience patterns.
 * Execution flow:
 * 1. Rate limit check (reject if over limit)
 * 2. Circuit breaker check (fail-fast if OPEN)
 * 3. Retry loop with timeout wrapper
 * 4. Fallback chain (try alternate providers)
 */
export declare class HardeningOrchestrator {
    private circuitBreaker;
    private rateLimiter;
    private timeoutHandler;
    private retryHandler;
    private fallbackChain;
    private readonly name;
    constructor(config: HardeningConfig);
    /**
     * Execute with full hardening: rate limit → circuit breaker → timeout+retry → fallback
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Execute with async rate limiting (waits if needed).
     */
    executeWithAsyncRateLimit<T>(fn: () => Promise<T>): Promise<T>;
    addFallbackProvider(name: string, execute: <T>() => Promise<T>, priority?: number): void;
    getMetrics(): HardeningMetrics;
    reset(): void;
}
/**
 * Registry of hardening orchestrators per provider.
 */
export declare class HardeningRegistry {
    private orchestrators;
    getOrCreate(config: HardeningConfig): HardeningOrchestrator;
    get(name: string): HardeningOrchestrator | undefined;
    getMetrics(name: string): HardeningMetrics | undefined;
    getAllMetrics(): Record<string, HardeningMetrics>;
    reset(name: string): void;
    resetAll(): void;
}
//# sourceMappingURL=hardeningOrchestrator.d.ts.map