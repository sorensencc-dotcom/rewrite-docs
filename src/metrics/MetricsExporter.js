/**
 * PHASE 27.3 — Prometheus Metrics Exporter
 * Emits adapter metrics: latency, error rate, throughput, schema violations
 */
import { Histogram, Counter, register as defaultRegister } from 'prom-client';
export class MetricsExporter {
    registry;
    // Adapter metrics
    adapterDurationMs;
    adapterErrorsTotal;
    adapterCallsTotal;
    adapterSchemaViolationsTotal;
    // Runtime metrics
    orchestratorChainDurationMs;
    orchestratorChainSuccessTotal;
    guardDurationMs;
    // Test tracking
    records = [];
    constructor(registry = defaultRegister) {
        this.registry = registry;
        // Adapter Latency Histogram
        this.adapterDurationMs = new Histogram({
            name: 'cic_adapter_duration_ms',
            help: 'Adapter execution duration in milliseconds',
            labelNames: ['adapter', 'status'],
            buckets: [5, 10, 50, 100, 500, 1000, 5000],
            registers: [this.registry],
        });
        // Adapter Error Counter
        this.adapterErrorsTotal = new Counter({
            name: 'cic_adapter_errors_total',
            help: 'Total adapter errors by code',
            labelNames: ['adapter', 'code'],
            registers: [this.registry],
        });
        // Adapter Call Counter
        this.adapterCallsTotal = new Counter({
            name: 'cic_adapter_calls_total',
            help: 'Total adapter calls by status',
            labelNames: ['adapter', 'status'],
            registers: [this.registry],
        });
        // Schema Violations Counter
        this.adapterSchemaViolationsTotal = new Counter({
            name: 'cic_adapter_schema_violations_total',
            help: 'Schema validation failures by adapter and field',
            labelNames: ['adapter', 'field'],
            registers: [this.registry],
        });
        // Orchestrator Chain Latency
        this.orchestratorChainDurationMs = new Histogram({
            name: 'cic_orchestrator_chain_duration_ms',
            help: 'Orchestrator chain execution duration',
            labelNames: ['chain'],
            buckets: [50, 100, 500, 1000, 5000, 10000],
            registers: [this.registry],
        });
        // Orchestrator Chain Success Counter
        this.orchestratorChainSuccessTotal = new Counter({
            name: 'cic_orchestrator_chain_success_total',
            help: 'Orchestrator chain success/failure count',
            labelNames: ['chain', 'status'],
            registers: [this.registry],
        });
        // Guard Function Duration
        this.guardDurationMs = new Histogram({
            name: 'cic_guard_duration_ms',
            help: 'Guard function execution duration',
            labelNames: ['guard', 'status'],
            buckets: [1, 5, 10, 50, 100],
            registers: [this.registry],
        });
    }
    // Test helper methods
    reset() {
        this.records = [];
    }
    get(metric, labels) {
        const matches = this.records.filter(r => r.name === metric &&
            Object.keys(labels).every(k => r.labels[k] === labels[k]));
        return matches.reduce((sum, r) => sum + r.value, 0);
    }
    getAll(metric) {
        return this.records.filter(r => r.name === metric);
    }
    increment(metric, labels) {
        this.records.push({
            name: metric,
            value: 1,
            labels: labels
        });
        if (metric === 'cic_adapter_calls_total') {
            this.recordAdapterCall(labels.adapter, 0, labels.status || 'success');
        }
        else if (metric === 'cic_adapter_errors_total') {
            this.recordAdapterError(labels.adapter, labels.code || 'ERROR');
        }
    }
    observe(metric, value, labels) {
        this.records.push({
            name: metric,
            value,
            labels: labels
        });
        if (metric === 'cic_adapter_duration_ms') {
            this.recordAdapterCall(labels.adapter, value, labels.status || 'success');
        }
    }
    // Adapter call timing
    recordAdapterCall(adapter, durationMs, status) {
        this.adapterDurationMs.labels(adapter, status).observe(durationMs);
        this.adapterCallsTotal.labels(adapter, status).inc();
    }
    // Adapter error by code
    recordAdapterError(adapter, code) {
        this.adapterErrorsTotal.labels(adapter, code).inc();
    }
    // Schema validation failure
    recordSchemaViolation(adapter, field) {
        this.adapterSchemaViolationsTotal.labels(adapter, field).inc();
    }
    // Orchestrator chain execution
    recordOrchestratorChain(chain, durationMs, status) {
        this.orchestratorChainDurationMs.labels(chain).observe(durationMs);
        this.orchestratorChainSuccessTotal.labels(chain, status).inc();
    }
    // Guard function execution
    recordGuardExecution(guard, durationMs, status) {
        this.guardDurationMs.labels(guard, status).observe(durationMs);
    }
    // Get metrics in Prometheus format
    async getMetrics() {
        return this.registry.metrics();
    }
    // Get content type for /metrics endpoint
    getContentType() {
        return this.registry.contentType;
    }
}
// Singleton instance
export const metricsExporter = new MetricsExporter();
//# sourceMappingURL=MetricsExporter.js.map