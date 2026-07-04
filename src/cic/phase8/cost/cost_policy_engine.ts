/**
 * Phase 8: Cost Policy Engine
 * Evaluates cost policies and makes routing decisions (ALLOW, DOWNGRADE, BLOCK, QUEUE).
 */

import { PolicyDecisionType, CostPressureLevel, BudgetStatus } from '../types/cost_event.js';
import { CostModel } from './cost_model.js';
import { CostForecast } from './cost_forecast_engine.js';

export interface CostPolicyConfig {
  softCeilingUsd: number;
  hardCeilingUsd: number;
  softCeilingPeriodHours: number;
  hardCeilingPeriodHours: number;
}

export interface CostPolicyResult {
  decision: PolicyDecisionType;
  reason: string;
  costPressureLevel: CostPressureLevel;
  budgetStatus: BudgetStatus;
}

export class CostPolicyEngine {
  constructor(
    private costModel: CostModel,
    private config: CostPolicyConfig
  ) {}

  evaluatePolicy(
    dailySpendUsd: number,
    forecast: CostForecast,
    requestCostUsd: number
  ): CostPolicyResult {
    // Determine budget status
    const budgetStatus = this.getBudgetStatus(dailySpendUsd);
    const costPressureLevel = this.getCostPressureLevel(budgetStatus, forecast.anomalyScore);

    // Make routing decision
    let decision: PolicyDecisionType = 'ALLOW';
    let reason = 'Normal operation';

    // Hard ceiling check (absolute limit)
    if (dailySpendUsd + requestCostUsd > this.config.hardCeilingUsd) {
      decision = 'BLOCK';
      reason = `Hard ceiling would be exceeded: $${(dailySpendUsd + requestCostUsd).toFixed(2)} > $${this.config.hardCeilingUsd}`;
      return { decision, reason, costPressureLevel, budgetStatus };
    }

    // Soft ceiling check with forecast
    if (budgetStatus === 'soft_ceiling') {
      decision = 'DOWNGRADE';
      reason = `Soft ceiling reached ($${this.config.softCeilingUsd}). Downgrading to economy model.`;
      return { decision, reason, costPressureLevel, budgetStatus };
    }

    // Approaching soft ceiling
    if (budgetStatus === 'approaching') {
      if (forecast.projectedDailySpendUsd > this.config.softCeilingUsd) {
        decision = 'DOWNGRADE';
        reason = `Forecast ($${forecast.projectedDailySpendUsd.toFixed(2)}) exceeds soft ceiling. Downgrading.`;
        return { decision, reason, costPressureLevel, budgetStatus };
      }
    }

    // Anomaly handling
    if (forecast.isAnomaly && budgetStatus !== 'healthy') {
      decision = 'QUEUE';
      reason = `Anomaly detected during budget pressure. Queueing request.`;
      return { decision, reason, costPressureLevel, budgetStatus };
    }

    return { decision, reason, costPressureLevel, budgetStatus };
  }

  private getBudgetStatus(dailySpendUsd: number): BudgetStatus {
    const ratioToHard = dailySpendUsd / this.config.hardCeilingUsd;

    if (ratioToHard >= 1.0) return 'hard_ceiling';
    if (ratioToHard >= 0.95) return 'soft_ceiling';
    if (ratioToHard >= 0.75) return 'approaching';
    return 'healthy';
  }

  private getCostPressureLevel(
    budgetStatus: BudgetStatus,
    anomalyScore: number
  ): CostPressureLevel {
    if (budgetStatus === 'hard_ceiling') return 'critical';
    if (budgetStatus === 'soft_ceiling') return 'critical';
    if (budgetStatus === 'approaching') return 'warning';
    if (anomalyScore > 0.8) return 'warning';
    return 'normal';
  }
}
