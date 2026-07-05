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
import { register, Counter, Gauge, Histogram } from 'prom-client';
/**
 * Prometheus metric definitions for M2
 */
export class MetricsExporter {
    // Ledger metrics (WS-A)
    ledgerWritesTotal;
    ledgerWriteFailures;
    ledgerWriteLatency;
    ledgerCapacityUsage;
    // SLO metrics (WS-B)
    sloViolations;
    burnRate;
    burnRateThreshold;
    canaryAborts;
    // Cache metrics (WS-C)
    cacheHits;
    cacheMisses;
    cacheEvictions;
    cacheHitRate;
    // General metrics
    httpRequestsTotal;
    httpRequestDuration;
    governanceHookLatency;
    constructor() {
        // Ledger metrics
        this.ledgerWritesTotal = new Counter({
            name: 'ledger_writes_total',
            help: 'Total number of ledger write operations',
        });
        this.ledgerWriteFailures = new Counter({
            name: 'ledger_write_failures_total',
            help: 'Total number of failed ledger writes',
        });
        this.ledgerWriteLatency = new Histogram({
            name: 'ledger_write_latency_ms',
            help: 'Ledger write latency in milliseconds',
            buckets: [1, 5, 10, 15, 20, 50],
        });
        this.ledgerCapacityUsage = new Gauge({
            name: 'ledger_capacity_usage_percent',
            help: 'Ledger capacity usage percentage',
        });
        // SLO metrics
        this.sloViolations = new Counter({
            name: 'slo_violations_total',
            help: 'Total number of SLO violations',
            labelNames: ['slo_id', 'metric'],
        });
        this.burnRate = new Gauge({
            name: 'slo_burn_rate',
            help: 'Current burn rate for SLO',
            labelNames: ['slo_id'],
        });
        this.burnRateThreshold = new Gauge({
            name: 'slo_burn_rate_threshold',
            help: 'Burn rate threshold',
            labelNames: ['slo_id'],
        });
        this.canaryAborts = new Counter({
            name: 'canary_aborts_total',
            help: 'Total number of canary aborts triggered by SLO violations',
        });
        // Cache metrics
        this.cacheHits = new Counter({
            name: 'cache_hits_total',
            help: 'Total cache hits',
            labelNames: ['cache_level'],
        });
        this.cacheMisses = new Counter({
            name: 'cache_misses_total',
            help: 'Total cache misses',
            labelNames: ['cache_level'],
        });
        this.cacheEvictions = new Counter({
            name: 'cache_evictions_total',
            help: 'Total cache evictions',
            labelNames: ['cache_level'],
        });
        this.cacheHitRate = new Gauge({
            name: 'cache_hit_rate_percent',
            help: 'Cache hit rate percentage',
            labelNames: ['cache_level'],
        });
        // General metrics
        this.httpRequestsTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total HTTP requests',
            labelNames: ['method', 'path', 'status'],
        });
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_ms',
            help: 'HTTP request duration in milliseconds',
            labelNames: ['method', 'path'],
            buckets: [10, 50, 100, 500, 1000, 5000],
        });
        this.governanceHookLatency = new Histogram({
            name: 'governance_hook_latency_ms',
            help: 'Governance hook latency in milliseconds',
            buckets: [5, 10, 20, 50, 100],
        });
    }
    /**
     * Record ledger write
     */
    recordLedgerWrite(latencyMs, success) {
        this.ledgerWritesTotal.inc();
        if (!success) {
            this.ledgerWriteFailures.inc();
        }
        this.ledgerWriteLatency.observe(latencyMs);
    }
    /**
     * Record SLO violation
     */
    recordSLOViolation(sloId, metric) {
        this.sloViolations.inc({ slo_id: sloId, metric });
    }
    /**
     * Update burn rate metric
     */
    setBurnRate(sloId, burnRate, threshold) {
        this.burnRate.set({ slo_id: sloId }, burnRate);
        this.burnRateThreshold.set({ slo_id: sloId }, threshold);
    }
    /**
     * Record canary abort
     */
    recordCanaryAbort() {
        this.canaryAborts.inc();
    }
    /**
     * Record cache hit/miss
     */
    recordCacheHit(level) {
        this.cacheHits.inc({ cache_level: level });
    }
    recordCacheMiss(level) {
        this.cacheMisses.inc({ cache_level: level });
    }
    /**
     * Update cache hit rate
     */
    setCacheHitRate(level, hitRate) {
        this.cacheHitRate.set({ cache_level: level }, hitRate);
    }
    /**
     * Record HTTP request
     */
    recordHttpRequest(method, path, status, durationMs) {
        this.httpRequestsTotal.inc({ method, path, status: String(status) });
        this.httpRequestDuration.observe({ method, path }, durationMs);
    }
    /**
     * Record governance hook latency
     */
    recordGovernanceHookLatency(latencyMs) {
        this.governanceHookLatency.observe(latencyMs);
    }
    /**
     * Get Prometheus registry (for scraping)
     */
    getRegistry() {
        return register;
    }
    /**
     * Export metrics in Prometheus text format
     */
    async getMetrics() {
        return register.metrics();
    }
}
export const metricsExporter = new MetricsExporter();
//# sourceMappingURL=metrics-endpoint.js.map