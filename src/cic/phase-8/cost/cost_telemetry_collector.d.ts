/**
 * Phase 8: Cost Telemetry Collector
 * Records cost events with deduplication and validation
 */
import { CostEvent } from '../types/cost_event';
export interface CostSink {
    write(event: CostEvent): void;
}
/**
 * Collects cost events, validates, deduplicates, and writes to sink
 */
export declare class CostTelemetryCollector {
    private sink;
    private recentRequestIds;
    private readonly deduplicationWindowMs;
    constructor(sink: CostSink);
    /**
     * Record a cost event
     * - Validate event
     * - Check for duplicates (requestId within 1s)
     * - Write to sink
     */
    recordCostEvent(event: CostEvent): void;
    /**
     * Clear recent request IDs (for testing)
     */
    clearDeduplicationState(): void;
}
//# sourceMappingURL=cost_telemetry_collector.d.ts.map