import { HardeningRegistry } from "../resilience/hardeningOrchestrator.js";
import { CircuitBreakerRegistry } from "../resilience/circuitBreaker.js";
import { RateLimiterRegistry } from "../resilience/rateLimiter.js";
export interface ResilientMetricsSnapshot {
    timestamp: number;
    providers: Record<string, ProviderMetrics>;
    summary: {
        totalRequests: number;
        totalErrors: number;
        avgLatencyMs: number;
        circuitBreakerOpenCount: number;
        rateLimitedCount: number;
    };
}
export interface ProviderMetrics {
    name: string;
    state: "healthy" | "degraded" | "failing";
    circuitBreaker: {
        state: string;
        consecutiveFailures: number;
        failureRate: number;
    };
    rateLimiter: {
        tokensAvailable: number;
        rejectionRate: number;
        requestsPerSecond: number;
    };
    fallback: {
        hasProviders: boolean;
        providerStates: Record<string, string>;
        totalAttempts: number;
        successProvider?: string;
    };
    performance: {
        totalRequests: number;
        successCount: number;
        failureCount: number;
        avgLatencyMs: number;
    };
}
/**
 * Collect metrics from all hardening orchestrators.
 * Export to observability stack (Prometheus, DataDog, etc).
 */
export declare class ResilientMetricsCollector {
    private hardeningRegistry;
    private circuitBreakerRegistry;
    private rateLimiterRegistry;
    private providerLatencies;
    constructor(hardeningRegistry: HardeningRegistry, circuitBreakerRegistry: CircuitBreakerRegistry, rateLimiterRegistry: RateLimiterRegistry);
    /**
     * Record latency for a provider (called after each request).
     */
    recordLatency(providerName: string, latencyMs: number): void;
    /**
     * Get current metrics snapshot.
     */
    getSnapshot(): ResilientMetricsSnapshot;
    /**
     * Export metrics in Prometheus format.
     */
    getPrometheusMetrics(): string;
    /**
     * Check health status.
     */
    isHealthy(): boolean;
    /**
     * Get health status with details.
     */
    getHealthStatus(): {
        healthy: boolean;
        issues: string[];
    };
    /**
     * Reset all metrics.
     */
    reset(): void;
}
//# sourceMappingURL=resilientMetricsCollector.d.ts.map