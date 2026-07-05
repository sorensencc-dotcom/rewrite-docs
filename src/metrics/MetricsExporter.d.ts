/**
 * PHASE 27.3 — Prometheus Metrics Exporter
 * Emits adapter metrics: latency, error rate, throughput, schema violations
 */
import { Registry } from 'prom-client';
export interface MetricLabels {
    adapter?: string;
    status?: 'success' | 'error';
    code?: string;
    field?: string;
    guard?: string;
    chain?: string;
}
export declare class MetricsExporter {
    private registry;
    private adapterDurationMs;
    private adapterErrorsTotal;
    private adapterCallsTotal;
    private adapterSchemaViolationsTotal;
    private orchestratorChainDurationMs;
    private orchestratorChainSuccessTotal;
    private guardDurationMs;
    private records;
    constructor(registry?: Registry<"text/plain; version=0.0.4; charset=utf-8">);
    reset(): void;
    get(metric: string, labels: Record<string, string>): number;
    getAll(metric: string): Array<{
        name: string;
        value: number;
        labels: Record<string, string>;
    }>;
    increment(metric: string, labels: {
        adapter: string;
        operation?: string;
        code?: string;
        status?: 'success' | 'error';
    }): void;
    observe(metric: string, value: number, labels: {
        adapter: string;
        operation?: string;
        status?: 'success' | 'error';
    }): void;
    recordAdapterCall(adapter: string, durationMs: number, status: 'success' | 'error'): void;
    recordAdapterError(adapter: string, code: string): void;
    recordSchemaViolation(adapter: string, field: string): void;
    recordOrchestratorChain(chain: string, durationMs: number, status: 'success' | 'failure'): void;
    recordGuardExecution(guard: string, durationMs: number, status: 'pass' | 'fail'): void;
    getMetrics(): Promise<string>;
    getContentType(): string;
}
export declare const metricsExporter: MetricsExporter;
//# sourceMappingURL=MetricsExporter.d.ts.map