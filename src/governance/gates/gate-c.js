/**
 * Gate C — Promotion Governance (Post-Canary)
 * Phase 5: GRS-gated promotion decisions with impact score validation
 * This gate runs after canary completes before promoting to prod
 */
import { governanceCache } from "../config/governance-cache";
import { pgQuery } from "../../cic-runtime/audit-log/postgres-client";
/**
 * Promotion gate: gates promotion decisions based on GRS, impact, and lineage consistency.
 * Strict gate — promotion requires all thresholds to be met.
 */
export async function gateCPromotionCheck(input) {
    const config = governanceCache.get();
    const caps = config.promotionCaps;
    let passed = true;
    let reasons = [];
    // Check 1: GRS < maxGRS
    if (input.grs >= caps.maxGRS) {
        passed = false;
        reasons.push(`GRS ${input.grs.toFixed(2)} exceeds cap ${caps.maxGRS}`);
    }
    // Check 2: Impact score < maxImpactScore
    if (input.impactScore >= caps.maxImpactScore) {
        passed = false;
        reasons.push(`Impact score ${input.impactScore.toFixed(2)} exceeds cap ${caps.maxImpactScore}`);
    }
    // Check 3: Lineage consistency perfect (if required)
    if (caps.requiresLCSPerfect && input.lineageConsistencyScore < 1.0) {
        passed = false;
        reasons.push(`Lineage consistency ${input.lineageConsistencyScore.toFixed(2)} < 1.0 (required)`);
    }
    // Check 4: No unresolved hard violations
    if (input.unresolvedViolations > 0) {
        passed = false;
        reasons.push(`${input.unresolvedViolations} unresolved hard violations`);
    }
    if (passed) {
        // Write promotion decision to log
        await pgQuery(`INSERT INTO governance_promotion_log (proposal_id, grs, ics, lcs, verdict, promoted_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, [input.proposalId, input.grs, input.impactScore, input.lineageConsistencyScore, "approved"]);
        // Write to canary_gate_results with grow decision
        await pgQuery(`INSERT INTO canary_gate_results (proposal_id, growth_decision, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`, [input.proposalId, "grow"]);
    }
    else {
        // Log rejection
        await pgQuery(`INSERT INTO governance_promotion_log (proposal_id, grs, ics, lcs, verdict, promoted_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, [input.proposalId, input.grs, input.impactScore, input.lineageConsistencyScore, "rejected"]);
    }
    return {
        verdict: passed ? "PASS" : "FAIL",
        governance_reason: passed ? "Promotion approved" : reasons.join("; "),
        governance_path: "gate_c",
        risk_score: input.grs,
    };
}
//# sourceMappingURL=gate-c.js.map