/**
 * Phase 8: Cost Policy Engine
 * Evaluates cost policy decisions based on budget + anomaly
 */
import { CostPolicyResult } from '../types/cost_event';
/**
 * Cost policy engine
 * Decision logic:
 * - dailySpend < softCeiling → ALLOW
 * - softCeiling ≤ dailySpend < hardCeiling → DOWNGRADE
 * - dailySpend ≥ hardCeiling → BLOCK
 * - anomalyScore > 0.7 → escalate to next level
 */
export declare class CostPolicyEngine {
    /**
     * Evaluate cost policy
     * @param dailySpendUsd Current 24h spend
     * @param softCeilingUsd Soft budget limit
     * @param hardCeilingUsd Hard budget limit
     * @param anomalyScore Forecast anomaly (0–1)
     * @returns CostPolicyResult with decision + pressure level + budget status
     */
    evaluatePolicy(dailySpendUsd: number, softCeilingUsd: number, hardCeilingUsd: number, anomalyScore: number): CostPolicyResult;
    /**
     * Truth table helper: all (spend, anomaly) → decision combinations
     * For testing determinism
     */
    private getTruthTable;
}
//# sourceMappingURL=cost_policy_engine.d.ts.map