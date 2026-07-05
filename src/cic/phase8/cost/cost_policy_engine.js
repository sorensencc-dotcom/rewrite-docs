/**
 * Phase 8: Cost Policy Engine
 * Evaluates cost policies and makes routing decisions (ALLOW, DOWNGRADE, BLOCK, QUEUE).
 */
export class CostPolicyEngine {
    costModel;
    config;
    constructor(costModel, config) {
        this.costModel = costModel;
        this.config = config;
    }
    evaluatePolicy(dailySpendUsd, forecast, requestCostUsd) {
        // Determine budget status
        const budgetStatus = this.getBudgetStatus(dailySpendUsd);
        const costPressureLevel = this.getCostPressureLevel(budgetStatus, forecast.anomalyScore);
        // Make routing decision
        let decision = 'ALLOW';
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
    getBudgetStatus(dailySpendUsd) {
        const ratioToHard = dailySpendUsd / this.config.hardCeilingUsd;
        if (ratioToHard >= 1.0)
            return 'hard_ceiling';
        if (ratioToHard >= 0.95)
            return 'soft_ceiling';
        if (ratioToHard >= 0.75)
            return 'approaching';
        return 'healthy';
    }
    getCostPressureLevel(budgetStatus, anomalyScore) {
        if (budgetStatus === 'hard_ceiling')
            return 'critical';
        if (budgetStatus === 'soft_ceiling')
            return 'critical';
        if (budgetStatus === 'approaching')
            return 'warning';
        if (anomalyScore > 0.8)
            return 'warning';
        return 'normal';
    }
}
//# sourceMappingURL=cost_policy_engine.js.map