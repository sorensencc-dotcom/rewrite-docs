/**
 * Gate A — Structural Governance (Pre-Canary)
 * Phase 5: Proposal DSL validation, policy conformance, lineage ancestry
 * This gate runs before any canary execution
 */
import { GovernanceVerdictV2 } from "../models";
export interface StructuralGateInput {
    proposalId: string;
    dslShape: Record<string, any>;
    policyVersion: string;
    ancestorProposalId?: string;
}
/**
 * Structural governance gate: validates proposal shape, policy conformance, lineage.
 * Always strict — no adaptive behavior in Gate A.
 */
export declare function gateAStructuralCheck(input: StructuralGateInput): Promise<GovernanceVerdictV2>;
//# sourceMappingURL=gate-a.d.ts.map