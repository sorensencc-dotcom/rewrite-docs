/**
 * Phase 8: Cost Telemetry Collector
 * Records cost events with deduplication and validation
 */

import { CostEvent, validateCostEvent } from '../types/cost_event';

export interface CostSink {
  write(event: CostEvent): void;
}

/**
 * Collects cost events, validates, deduplicates, and writes to sink
 */
export class CostTelemetryCollector {
  private recentRequestIds: Set<string> = new Set();
  private readonly deduplicationWindowMs = 1000;

  constructor(private sink: CostSink) {}

  /**
   * Record a cost event
   * - Validate event
   * - Check for duplicates (requestId within 1s)
   * - Write to sink
   */
  recordCostEvent(event: CostEvent): void {
    // TODO: Implement cost event recording
    // 1. validateCostEvent(event)
    // 2. Check if requestId in recentRequestIds -> skip with log
    // 3. Add requestId to recentRequestIds
    // 4. Schedule cleanup: remove requestId after deduplicationWindowMs
    // 5. this.sink.write(event)
  }

  /**
   * Clear recent request IDs (for testing)
   */
  clearDeduplicationState(): void {
    // TODO: Clear recentRequestIds set
  }
}
