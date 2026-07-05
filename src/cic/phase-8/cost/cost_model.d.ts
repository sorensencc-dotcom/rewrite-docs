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
export declare class CostModel {
    private timeSeries;
    constructor(timeSeries: CostTimeSeries);
    /**
     * Get daily (24h) spend in USD
     */
    getDailySpendUsd(): number;
    /**
     * Get spend by agent (grouped by model)
     * @returns Record mapping model IDs to spend USD
     */
    getSpendByAgent(agentId: string): Record<string, number>;
    /**
     * Get spend by model (grouped by agent)
     * @returns Record mapping agent IDs to spend USD
     */
    getSpendByModel(modelId: string): Record<string, number>;
    /**
     * Get spend in any window (ms)
     */
    getSpendWindow(windowMs: number): number;
}
//# sourceMappingURL=cost_model.d.ts.map