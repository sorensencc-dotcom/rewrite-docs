/**
 * Routing Cost Signals
 * MAAL routing bias calculation based on cost/savings data
 */
import { type CicCostComputeReport } from '../lib/report/CicCostComputeReport.js';
export interface RoutingSignal {
    agent: string;
    costPerDay: number;
    localSavingsPerDay: number;
    localBias: number;
    preferLocal: boolean;
    reasoning: string;
}
/**
 * Get routing signals for an agent based on cost/savings data
 * Bias tiers:
 *   localSavingsPerDay > 1.00 → +0.25 (strong local preference)
 *   localSavingsPerDay > 0.25 → +0.10 (weak local preference)
 *   else → 0 (no preference)
 */
export declare function getRoutingSignals(agent: string, report?: CicCostComputeReport): RoutingSignal;
/**
 * Get all agent routing signals
 */
export declare function getAllRoutingSignals(report?: CicCostComputeReport): RoutingSignal[];
//# sourceMappingURL=routingCostSignals.d.ts.map