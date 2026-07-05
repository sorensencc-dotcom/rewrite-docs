/**
 * Gate B — Adaptive Canary Governance
 * Phase 5: Hybrid GRS computation, violation classification, adaptive retry/rollback
 * This gate runs during canary execution
 */
import { GovernanceVerdictV2 } from "../models";
import { GRSInputs } from "../scoring/grs";
export interface AdaptiveCanaryGateInput {
    proposalId: string;
    grsInputs: GRSInputs;
    violationCount: number;
    retryCount: number;
}
/**
 * Adaptive canary gate: computes GRS, classifies violations, determines retry/rollback behavior.
 * Adaptive behavior based on risk score.
 */
export declare function gateBAdaptiveCanaryCheck(input: AdaptiveCanaryGateInput): Promise<GovernanceVerdictV2>;
//# sourceMappingURL=gate-b.d.ts.map