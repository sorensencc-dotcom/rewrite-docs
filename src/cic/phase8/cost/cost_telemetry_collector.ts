/**
 * Phase 8: Cost Telemetry Collector
 * Collects and buffers cost events, publishes to metric sink.
 */

import { CostEvent, AuditEvent, AuditEventType } from '../types/cost_event.js';

export type CostSink = 'prometheus' | 'cloudwatch' | 'datadog' | 'mock';

export interface CostTelemetryCollectorConfig {
  sink: CostSink;
  bufferSize: number;
  flushIntervalMs: number;
}

export class CostTelemetryCollector {
  private buffer: CostEvent[] = [];
  private auditBuffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private totalCostUsd = 0;

  constructor(private config: CostTelemetryCollectorConfig) {
    if (config.flushIntervalMs > 0) {
      this.flushInterval = setInterval(() => this.flush(), config.flushIntervalMs);
    }
  }

  recordCostEvent(event: CostEvent): void {
    this.buffer.push(event);
    this.totalCostUsd += event.costUsd;

    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  recordAuditEvent(event: AuditEvent): void {
    this.auditBuffer.push(event);

    if (this.auditBuffer.length >= Math.max(10, this.config.bufferSize / 2)) {
      this.flushAudit();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    // Publish to sink (implementation depends on config.sink)
    this.publishEvents(events);
  }

  private flushAudit(): void {
    if (this.auditBuffer.length === 0) return;

    const events = [...this.auditBuffer];
    this.auditBuffer = [];

    // Publish to sink
    this.publishAuditEvents(events);
  }

  private publishEvents(events: CostEvent[]): void {
    // Sink-specific publication logic
    switch (this.config.sink) {
      case 'prometheus':
        this.publishPrometheus(events);
        break;
      case 'cloudwatch':
        this.publishCloudWatch(events);
        break;
      case 'datadog':
        this.publishDatadog(events);
        break;
      case 'mock':
        // No-op for tests
        break;
    }
  }

  private publishAuditEvents(events: AuditEvent[]): void {
    // Audit event routing (typically to audit log or separate sink)
    switch (this.config.sink) {
      case 'prometheus':
        // Count audit events in metrics
        events.forEach(e => {
          // Counter increment: cic_audit_events_total{type=e.eventType}
        });
        break;
    }
  }

  private publishPrometheus(events: CostEvent[]): void {
    // Update Prometheus metrics
    events.forEach(e => {
      // cic_cost_total_usd += e.costUsd
      // cic_cost_request_usd{agent=e.agentId, model=e.model} += e.costUsd
      // cic_cost_input_tokens += e.inputTokens
      // cic_cost_output_tokens += e.outputTokens
      // cic_cost_daily_spend_usd (rolling 24h window)
    });
  }

  private publishCloudWatch(events: CostEvent[]): void {
    // CloudWatch metrics publication
  }

  private publishDatadog(events: CostEvent[]): void {
    // Datadog metrics publication
  }

  getTotalCostUsd(): number {
    return this.totalCostUsd;
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  async shutdown(): Promise<void> {
    this.flush();
    this.flushAudit();
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}
