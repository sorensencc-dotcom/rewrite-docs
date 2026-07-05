/**
 * Prometheus Metrics Endpoint
 * Workstream B: Expose metrics for Prometheus scraping
 *
 * TODO: Implement
 * - [ ] Register Prometheus client
 * - [ ] Define metric types (Counter, Gauge, Histogram)
 * - [ ] Expose /metrics endpoint
 * - [ ] Update metrics from application
 * - [ ] Ensure scrape success rate 100%
 */
/**
 * Prometheus metric definitions for M2
 */
export declare class MetricsExporter {
    private ledgerWritesTotal;
    private ledgerWriteFailures;
    private ledgerWriteLatency;
    private ledgerCapacityUsage;
    private sloViolations;
    private burnRate;
    private burnRateThreshold;
    private canaryAborts;
    private cacheHits;
    private cacheMisses;
    private cacheEvictions;
    private cacheHitRate;
    private httpRequestsTotal;
    private httpRequestDuration;
    private governanceHookLatency;
    constructor();
    /**
     * Record ledger write
     */
    recordLedgerWrite(latencyMs: number, success: boolean): void;
    /**
     * Record SLO violation
     */
    recordSLOViolation(sloId: string, metric: string): void;
    /**
     * Update burn rate metric
     */
    setBurnRate(sloId: string, burnRate: number, threshold: number): void;
    /**
     * Record canary abort
     */
    recordCanaryAbort(): void;
    /**
     * Record cache hit/miss
     */
    recordCacheHit(level: 'l1' | 'l2'): void;
    recordCacheMiss(level: 'l1' | 'l2'): void;
    /**
     * Update cache hit rate
     */
    setCacheHitRate(level: 'l1' | 'l2', hitRate: number): void;
    /**
     * Record HTTP request
     */
    recordHttpRequest(method: string, path: string, status: number, durationMs: number): void;
    /**
     * Record governance hook latency
     */
    recordGovernanceHookLatency(latencyMs: number): void;
    /**
     * Get Prometheus registry (for scraping)
     */
    getRegistry(): import("prom-client").Registry<"text/plain; version=0.0.4; charset=utf-8">;
    /**
     * Export metrics in Prometheus text format
     */
    getMetrics(): Promise<string>;
}
export declare const metricsExporter: MetricsExporter;
//# sourceMappingURL=metrics-endpoint.d.ts.map