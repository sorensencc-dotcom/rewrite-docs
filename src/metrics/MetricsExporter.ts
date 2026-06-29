/**
 * PHASE 27.3 — Prometheus Metrics Exporter
 * Emits adapter metrics: latency, error rate, throughput, schema violations
 */

import { Registry, Histogram, Counter, register as defaultRegister } from 'prom-client';

export interface MetricLabels {
  adapter?: string;
  status?: 'success' | 'error';
  code?: string;
  field?: string;
  guard?: string;
  chain?: string;
}

export class MetricsExporter {
  private registry: Registry;

  // Adapter metrics
  private adapterDurationMs: Histogram;
  private adapterErrorsTotal: Counter;
  private adapterCallsTotal: Counter;
  private adapterSchemaViolationsTotal: Counter;

  // Runtime metrics
  private orchestratorChainDurationMs: Histogram;
  private orchestratorChainSuccessTotal: Counter;
  private guardDurationMs: Histogram;

  // Test tracking
  private records: Array<{ name: string; value: number; labels: Record<string, string> }> = [];

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
  reset(): void {
    this.records = [];
  }

  get(metric: string, labels: Record<string, string>): number {
    const matches = this.records.filter(r => r.name === metric && 
      Object.keys(labels).every(k => r.labels[k] === labels[k])
    );
    return matches.reduce((sum, r) => sum + r.value, 0);
  }

  getAll(metric: string): Array<{ name: string; value: number; labels: Record<string, string> }> {
    return this.records.filter(r => r.name === metric);
  }

  increment(metric: string, labels: { adapter: string; operation?: string; code?: string; status?: 'success' | 'error' }): void {
    this.records.push({
      name: metric,
      value: 1,
      labels: labels as any
    });

    if (metric === 'cic_adapter_calls_total') {
      this.recordAdapterCall(labels.adapter, 0, labels.status || 'success');
    } else if (metric === 'cic_adapter_errors_total') {
      this.recordAdapterError(labels.adapter, labels.code || 'ERROR');
    }
  }

  observe(metric: string, value: number, labels: { adapter: string; operation?: string; status?: 'success' | 'error' }): void {
    this.records.push({
      name: metric,
      value,
      labels: labels as any
    });

    if (metric === 'cic_adapter_duration_ms') {
      this.recordAdapterCall(labels.adapter, value, labels.status || 'success');
    }
  }

  // Adapter call timing
  recordAdapterCall(
    adapter: string,
    durationMs: number,
    status: 'success' | 'error'
  ): void {
    this.adapterDurationMs.labels(adapter, status).observe(durationMs);
    this.adapterCallsTotal.labels(adapter, status).inc();
  }

  // Adapter error by code
  recordAdapterError(adapter: string, code: string): void {
    this.adapterErrorsTotal.labels(adapter, code).inc();
  }

  // Schema validation failure
  recordSchemaViolation(adapter: string, field: string): void {
    this.adapterSchemaViolationsTotal.labels(adapter, field).inc();
  }

  // Orchestrator chain execution
  recordOrchestratorChain(
    chain: string,
    durationMs: number,
    status: 'success' | 'failure'
  ): void {
    this.orchestratorChainDurationMs.labels(chain).observe(durationMs);
    this.orchestratorChainSuccessTotal.labels(chain, status).inc();
  }

  // Guard function execution
  recordGuardExecution(guard: string, durationMs: number, status: 'pass' | 'fail'): void {
    this.guardDurationMs.labels(guard, status).observe(durationMs);
  }

  // Get metrics in Prometheus format
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Get content type for /metrics endpoint
  getContentType(): string {
    return this.registry.contentType;
  }
}

// Singleton instance
export const metricsExporter = new MetricsExporter();
