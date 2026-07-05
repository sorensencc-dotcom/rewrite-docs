/**
 * SLO Controller
 * Workstream B: Implements SLO rules, burn-rate calculation, and canary integration
 *
 * Wired to E-Phase enforcement engine for deterministic abort/rollback flow
 */
import { SLORule, Metrics, BurnRateResult, SLOViolationEvent } from "./types";
export declare class SLOController {
    private rules;
    private metrics;
    private violationCallbacks;
    /**
     * Load SLO rules from config
     */
    loadRules(config: SLORule[]): Promise<void>;
    /**
     * Update current metrics snapshot
     */
    setMetrics(metrics: Metrics): void;
    /**
     * Calculate burn rate for a specific SLO rule
     * Burn rate = current value / target
     * Example: error rate 3% against 1% target = 3x burn rate
     */
    calculateBurnRate(rule: SLORule): BurnRateResult;
    /**
     * Evaluate all SLO rules and trigger violations if needed
     */
    evaluate(): Promise<BurnRateResult[]>;
    /**
     * Register callback for SLO violations
     */
    onViolation(callback: (event: SLOViolationEvent) => void): void;
    /**
     * Emit violation event to all registered callbacks
     */
    private emitViolation;
    /**
     * Get current SLO status for canary gate integration
     */
    getCanaryGateStatus(): {
        passes: number;
        violations: number;
    };
}
export declare const sloController: SLOController;
//# sourceMappingURL=slo-controller.d.ts.map