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
export declare class CostPolicyEngine {
    private costModel;
    private config;
    constructor(costModel: CostModel, config: CostPolicyConfig);
    evaluatePolicy(dailySpendUsd: number, forecast: CostForecast, requestCostUsd: number): CostPolicyResult;
    private getBudgetStatus;
    private getCostPressureLevel;
}
//# sourceMappingURL=cost_policy_engine.d.ts.map