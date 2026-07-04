/**
 * Phase 8: Cost Model
 * Queries rolling spend windows (5m, 1h, 24h)
 */

import { CostEvent } from '../types/cost_event';

export interface CostTimeSeries {
  getEvents(windowMs: number): CostEvent[];
}

/**
 * Cost model with rolling time windows
 * Backed by time-series sink (e.g., InfluxDB or in-memory ring buffer)
 */
export class CostModel {
  constructor(private timeSeries: CostTimeSeries) {}

  /**
   * Get daily (24h) spend in USD
   */
  getDailySpendUsd(): number {
    // TODO: Implement
    // - Get events from past 24 hours (86400000 ms)
    // - Sum totalCostUsd
    // - Return sum
    return 0;
  }

  /**
   * Get spend by agent (grouped by model)
   * @returns Record mapping model IDs to spend USD
   */
  getSpendByAgent(agentId: string): Record<string, number> {
    // TODO: Implement
    // - Filter events by agentId
    // - Group by modelId
    // - Sum totalCostUsd per model
    // - Return Record<modelId, spendUsd>
    return {};
  }

  /**
   * Get spend by model (grouped by agent)
   * @returns Record mapping agent IDs to spend USD
   */
  getSpendByModel(modelId: string): Record<string, number> {
    // TODO: Implement
    // - Filter events by modelId
    // - Group by agentId
    // - Sum totalCostUsd per agent
    // - Return Record<agentId, spendUsd>
    return {};
  }

  /**
   * Get spend in any window (ms)
   */
  getSpendWindow(windowMs: number): number {
    // TODO: Implement
    // - Get events from past windowMs
    // - Sum totalCostUsd
    // - Return sum
    return 0;
  }

  /**
   * Query helper: edge case handling
   * - Empty window -> return 0
   * - No events -> return 0
   * - Single event -> return totalCostUsd
   */
}
