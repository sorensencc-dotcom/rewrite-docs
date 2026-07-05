/**
 * Gate C — Promotion Governance (Post-Canary)
 * Phase 5: GRS-gated promotion decisions with impact score validation
 * This gate runs after canary completes before promoting to prod
 */
import { GovernanceVerdictV2 } from "../models";
export interface PromotionGateInput {
    proposalId: string;
    grs: number;
    impactScore: number;
    lineageConsistencyScore: number;
    unresolvedViolations: number;
}
/**
 * Promotion gate: gates promotion decisions based on GRS, impact, and lineage consistency.
 * Strict gate — promotion requires all thresholds to be met.
 */
export declare function gateCPromotionCheck(input: PromotionGateInput): Promise<GovernanceVerdictV2>;
//# sourceMappingURL=gate-c.d.ts.map