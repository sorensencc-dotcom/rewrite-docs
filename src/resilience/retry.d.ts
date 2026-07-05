export interface RetryConfig {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    name?: string;
}
export interface RetryMetrics {
    name: string;
    totalAttempts: number;
    retries: number;
    failures: number;
    successes: number;
    lastError?: string;
}
/**
 * Retry with exponential backoff.
 * Delays: 100ms → 200ms → 400ms → 800ms (capped)
 */
export declare class RetryHandler {
    private readonly maxAttempts;
    private readonly initialDelayMs;
    private readonly maxDelayMs;
    private readonly backoffMultiplier;
    private readonly name;
    private totalAttempts;
    private retries;
    private failures;
    private successes;
    private lastError?;
    constructor(config?: RetryConfig);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private calculateDelay;
    private sleep;
    getMetrics(): RetryMetrics;
    reset(): void;
}
/**
 * Registry of retry handlers per endpoint.
 */
export declare class RetryHandlerRegistry {
    private handlers;
    private defaultConfig;
    constructor(defaultConfig?: RetryConfig);
    getOrCreate(name: string, config?: RetryConfig): RetryHandler;
    get(name: string): RetryHandler | undefined;
    execute<T>(name: string, fn: () => Promise<T>): Promise<T>;
    getMetrics(name: string): RetryMetrics | undefined;
    getAllMetrics(): Record<string, RetryMetrics>;
    reset(name: string): void;
    resetAll(): void;
}
//# sourceMappingURL=retry.d.ts.map