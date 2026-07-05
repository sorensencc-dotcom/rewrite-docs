/**
 * Phase 8: Cost Forecast Engine
 * Forecasts future spend and detects anomalies using simple statistical methods.
 */
import { CostModel } from './cost_model.js';
export interface CostForecast {
    projectedDailySpendUsd: number;
    projectedHourlySpendUsd: number;
    anomalyScore: number;
    isAnomaly: boolean;
    confidenceInterval: [number, number];
    forecastHours: number;
}
export declare class CostForecastEngine {
    private costModel;
    private anomalyThreshold;
    constructor(costModel: CostModel, anomalyThreshold?: number);
    forecast(horizonHours: number): CostForecast;
    private calculateAnomalyScore;
    isAnomalous(spend: number, baseline: number): boolean;
}
//# sourceMappingURL=cost_forecast_engine.d.ts.map