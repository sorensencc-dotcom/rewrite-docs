export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";
export interface CircuitBreakerConfig {
    failureThreshold?: number;
    failureRateThreshold?: number;
    windowSize?: number;
    resetTimeoutMs?: number;
    name?: string;
}
export interface CircuitBreakerMetrics {
    state: CircuitBreakerState;
    consecutiveFailures: number;
    totalRequests: number;
    failureCount: number;
    successCount: number;
    failureRate: number;
    lastFailureTime?: number;
}
/**
 * Circuit breaker pattern: prevents cascading failures.
 * States: CLOSED (normal) → OPEN (failing fast) → HALF_OPEN (test recovery) → CLOSED
 */
export declare class CircuitBreaker {
    private state;
    private consecutiveFailures;
    private totalRequests;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private resetTimer;
    private readonly failureThreshold;
    private readonly failureRateThreshold;
    private readonly windowSize;
    private readonly resetTimeoutMs;
    private readonly name;
    private requestWindow;
    constructor(config?: CircuitBreakerConfig);
    /**
     * Execute function with circuit breaker protection.
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private recordSuccess;
    private recordFailure;
    private scheduleReset;
    private clearResetTimer;
    getState(): CircuitBreakerState;
    getMetrics(): CircuitBreakerMetrics;
    reset(): void;
}
/**
 * Circuit breaker registry for multiple providers.
 */
export declare class CircuitBreakerRegistry {
    private breakers;
    private config;
    constructor(config?: CircuitBreakerConfig);
    getOrCreate(name: string): CircuitBreaker;
    get(name: string): CircuitBreaker | undefined;
    getAll(): Map<string, CircuitBreaker>;
    getMetrics(name: string): CircuitBreakerMetrics | undefined;
    getAllMetrics(): Record<string, CircuitBreakerMetrics>;
    reset(name: string): void;
    resetAll(): void;
}
//# sourceMappingURL=circuitBreaker.d.ts.map