/**
 * Phase 8: Cost Model
 * Queries rolling spend windows (5m, 1h, 24h)
 */
/**
 * Cost model with rolling time windows
 * Backed by time-series sink (e.g., InfluxDB or in-memory ring buffer)
 */
export class CostModel {
    timeSeries;
    constructor(timeSeries) {
        this.timeSeries = timeSeries;
    }
    /**
     * Get daily (24h) spend in USD
     */
    getDailySpendUsd() {
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
    getSpendByAgent(agentId) {
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
    getSpendByModel(modelId) {
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
    getSpendWindow(windowMs) {
        // TODO: Implement
        // - Get events from past windowMs
        // - Sum totalCostUsd
        // - Return sum
        return 0;
    }
}
//# sourceMappingURL=cost_model.js.map