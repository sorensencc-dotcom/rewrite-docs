/**
 * Phase 8: Cost Forecast Engine
 * Linear projection + anomaly detection
 */
export type Horizon = '1h' | '24h' | '7d';
export interface CostForecast {
    projectedSpendUsd: number;
    anomalyScore: number;
    horizon: Horizon;
    confidence: number;
}
/**
 * Cost forecast with linear projection and Z-score anomaly detection
 */
export declare class CostForecastEngine {
    /**
     * Forecast spend at given horizon
     * - Linear projection: slope × time
     * - Anomaly detection: Z-score over historical variance
     * - Conservative: round up projections
     * @param horizon Forecast horizon (1h, 24h, 7d)
     * @returns CostForecast with projectedSpendUsd and anomalyScore
     */
    forecast(horizon: Horizon): CostForecast;
    /**
     * Get anomaly score only (0–1)
     * Based on deviation from expected spend
     */
    getAnomalyScore(): number;
}
//# sourceMappingURL=cost_forecast_engine.d.ts.map