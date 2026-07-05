/**
 * SLO Controller
 * Workstream B: Implements SLO rules, burn-rate calculation, and canary integration
 *
 * Wired to E-Phase enforcement engine for deterministic abort/rollback flow
 */
import { metricsExporter } from "../observability/metrics-endpoint";
export class SLOController {
    rules = new Map();
    metrics = null;
    violationCallbacks = [];
    /**
     * Load SLO rules from config
     */
    async loadRules(config) {
        for (const rule of config) {
            this.rules.set(rule.id, rule);
        }
    }
    /**
     * Update current metrics snapshot
     */
    setMetrics(metrics) {
        this.metrics = metrics;
    }
    /**
     * Calculate burn rate for a specific SLO rule
     * Burn rate = current value / target
     * Example: error rate 3% against 1% target = 3x burn rate
     */
    calculateBurnRate(rule) {
        if (!this.metrics) {
            throw new Error('Metrics not available');
        }
        const value = this.metrics[rule.metric] ?? 0;
        const currentBurnRate = rule.target > 0 ? value / rule.target : 0;
        const threshold = rule.burnRateThreshold;
        const isViolating = currentBurnRate > threshold;
        const remainingBudget = value >= rule.target ? 0 : rule.target - value;
        const estimatedBudgetExhaustion = currentBurnRate <= 0 ? Infinity : remainingBudget / currentBurnRate;
        metricsExporter.setBurnRate(rule.id, currentBurnRate, threshold);
        return {
            sloId: rule.id,
            currentBurnRate,
            threshold,
            isViolating,
            remainingBudget,
            estimatedBudgetExhaustion,
        };
    }
    /**
     * Evaluate all SLO rules and trigger violations if needed
     */
    async evaluate() {
        const results = [];
        for (const rule of this.rules.values()) {
            const result = this.calculateBurnRate(rule);
            results.push(result);
            // Trigger violation callback if threshold exceeded
            if (result.isViolating) {
                this.emitViolation({
                    timestamp: new Date(),
                    sloId: rule.id,
                    metric: rule.metric,
                    value: 0, // TODO: get actual value from metrics
                    threshold: rule.target,
                    burnRate: result.currentBurnRate,
                    severity: result.currentBurnRate > rule.burnRateThreshold * 2 ? 'critical' : 'warning',
                });
            }
        }
        return results;
    }
    /**
     * Register callback for SLO violations
     */
    onViolation(callback) {
        this.violationCallbacks.push(callback);
    }
    /**
     * Emit violation event to all registered callbacks
     */
    emitViolation(event) {
        for (const callback of this.violationCallbacks) {
            callback(event);
        }
    }
    /**
     * Get current SLO status for canary gate integration
     */
    getCanaryGateStatus() {
        let passes = 0;
        let violations = 0;
        for (const rule of this.rules.values()) {
            const result = this.calculateBurnRate(rule);
            if (result.isViolating)
                violations += 1;
            else
                passes += 1;
        }
        return { passes, violations };
    }
}
export const sloController = new SLOController();
//# sourceMappingURL=slo-controller.js.map