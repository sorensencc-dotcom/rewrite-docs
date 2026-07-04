/**
 * Phase 8: Cost Forecast Engine
 * Forecasts future spend and detects anomalies using simple statistical methods.
 */

import { CostModel, CostWindow } from './cost_model.js';

export interface CostForecast {
  projectedDailySpendUsd: number;
  projectedHourlySpendUsd: number;
  anomalyScore: number; // 0-1
  isAnomaly: boolean;
  confidenceInterval: [number, number]; // [lower, upper]
  forecastHours: number;
}

export class CostForecastEngine {
  constructor(
    private costModel: CostModel,
    private anomalyThreshold = 0.75 // 75th percentile triggers anomaly
  ) {}

  forecast(horizonHours: number): CostForecast {
    const hour1 = this.costModel.getSpendWindow('1h');
    const hour5m = this.costModel.getSpendWindow('5m');

    // Simple linear extrapolation
    const currentHourlyRate = hour1.totalCostUsd;
    const projectedDailySpend = currentHourlyRate * 24;

    // Estimate 5m rate and extrapolate for forecast
    const fiveMinuteRate = hour5m.totalCostUsd / (5 / 60); // Normalize to hourly
    const projectedHourlyFromRecent = fiveMinuteRate;

    // Anomaly detection: compare recent rate to historical hourly average
    const anomalyScore = this.calculateAnomalyScore(currentHourlyRate, hour5m.totalCostUsd);
    const isAnomaly = anomalyScore > this.anomalyThreshold;

    // Confidence interval: ±20% of projection
    const projectedSpend = projectedDailySpend;
    const margin = projectedSpend * 0.2;

    return {
      projectedDailySpendUsd: projectedSpend,
      projectedHourlySpendUsd: currentHourlyRate,
      anomalyScore,
      isAnomaly,
      confidenceInterval: [Math.max(0, projectedSpend - margin), projectedSpend + margin],
      forecastHours: horizonHours
    };
  }

  private calculateAnomalyScore(hourlySpend: number, recentFiveMinSpend: number): number {
    // Detect spike: recent 5m rate extrapolated vs hourly baseline
    const recentRate = recentFiveMinSpend / (5 / 60); // Normalize to hourly
    const ratio = hourlySpend > 0 ? recentRate / hourlySpend : 0;

    // Spike factor: 1.0 = normal, >2.0 = severe anomaly
    // Map to 0-1 score
    const spikeScore = Math.min(1.0, Math.max(0, (ratio - 1.0) / 2.0));

    return spikeScore;
  }

  isAnomalous(spend: number, baseline: number): boolean {
    if (baseline === 0) return spend > 0;
    const ratio = spend / baseline;
    return ratio > 2.0 || (ratio < 0.5 && baseline > 0);
  }
}
