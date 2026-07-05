/**
 * Phase 8: Cost Telemetry Collector
 * Collects and buffers cost events, publishes to metric sink.
 */
import { CostEvent, AuditEvent } from '../types/cost_event.js';
export type CostSink = 'prometheus' | 'cloudwatch' | 'datadog' | 'mock';
export interface CostTelemetryCollectorConfig {
    sink: CostSink;
    bufferSize: number;
    flushIntervalMs: number;
}
export declare class CostTelemetryCollector {
    private config;
    private buffer;
    private auditBuffer;
    private flushInterval;
    private totalCostUsd;
    constructor(config: CostTelemetryCollectorConfig);
    recordCostEvent(event: CostEvent): void;
    recordAuditEvent(event: AuditEvent): void;
    private flush;
    private flushAudit;
    private publishEvents;
    private publishAuditEvents;
    private publishPrometheus;
    private publishCloudWatch;
    private publishDatadog;
    getTotalCostUsd(): number;
    getBufferSize(): number;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=cost_telemetry_collector.d.ts.map