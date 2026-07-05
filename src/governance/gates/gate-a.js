/**
 * Gate A — Structural Governance (Pre-Canary)
 * Phase 5: Proposal DSL validation, policy conformance, lineage ancestry
 * This gate runs before any canary execution
 */
import { governanceCache } from "../config/governance-cache";
/**
 * Structural governance gate: validates proposal shape, policy conformance, lineage.
 * Always strict — no adaptive behavior in Gate A.
 */
export async function gateAStructuralCheck(input) {
    const config = governanceCache.get();
    let reason = "";
    let passed = true;
    // Check 1: Proposal DSL shape (basic structure)
    if (!input.dslShape || typeof input.dslShape !== "object") {
        reason = "Proposal DSL shape is invalid or missing";
        passed = false;
    }
    // Check 2: Policy version conformance
    if (input.policyVersion !== config.policy_version) {
        reason = `Policy version mismatch: proposal has ${input.policyVersion}, current is ${config.policy_version}`;
        passed = false;
    }
    // Check 3: Lineage ancestry (if ancestor is required)
    if (input.ancestorProposalId && !input.ancestorProposalId.match(/^[a-z0-9-]+$/)) {
        reason = `Ancestor proposal ID format invalid: ${input.ancestorProposalId}`;
        passed = false;
    }
    return {
        verdict: passed ? "PASS" : "FAIL",
        governance_reason: reason || "Proposal passed structural checks",
        governance_path: "gate_a",
        risk_score: passed ? 0.0 : 1.0,
    };
}
//# sourceMappingURL=gate-a.js.map