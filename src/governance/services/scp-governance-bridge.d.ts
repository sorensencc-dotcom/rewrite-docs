import { Database } from "../db";
import { SkillContribution, GovernanceVerdictV2 } from "../models";
import { GovernanceConfig } from "../config/governance.config";
export declare class SCPGovernanceBridge {
    private db;
    constructor(db: Database);
    /**
     * Record a skill contribution event in the governance audit trail.
     * Called when a PR is submitted, merged, or closed.
     * Feeds into Phase 24.5 Build Governance Integration vault.
     * @throws Error on database constraint violation or connection failure
     */
    recordContributionEvent(contrib: SkillContribution, event: "submitted" | "merged" | "closed"): Promise<number>;
    /**
     * Calculate risk score for a contribution.
     * Used for governance decisions on auto-approval vs manual review.
     */
    private calculateContributionRisk;
    /**
     * Query contributions by governance verdict.
     * Used by Phase 24 council voting for approval decisions.
     */
    queryContributionsByVerdict(verdict: "PASS" | "WARN" | "FAIL"): Promise<any[]>;
    /**
     * Link a contribution to its governance audit record.
     * Used by Phase 24.5 to create full lineage chain:
     * Build → Lineage (skill_lineage) → Contribution (skill_contributions)
     * @throws Error on database failure or record not found
     */
    linkContributionToLineage(skillId: string, prNumber: number, lineageId: number): Promise<void>;
    /**
     * Gate A: Structural governance check (pre-canary).
     * Validates proposal DSL shape, policy conformance, lineage ancestry.
     */
    governance_pre_canary_check(proposalId: string): Promise<GovernanceVerdictV2>;
    /**
     * Gate C: Promotion governance check (post-canary).
     * Gates promotion based on GRS, impact score, lineage consistency.
     */
    governance_post_canary_review(proposalId: string): Promise<GovernanceVerdictV2>;
    /**
     * Compute governance risk: full GRS + impact + lineage consistency scores.
     */
    governance_compute_risk(proposalId: string): Promise<{
        grs: number;
        ics: number;
        lcs: number;
    }>;
    /**
     * Adaptive promotion check: full Gate C logic.
     */
    governance_adaptive_promotion_check(proposalId: string): Promise<boolean>;
    /**
     * Apply hot-reload threshold update.
     * Delegates to GovernanceCache for atomic application.
     */
    governance_apply_threshold(patch: Partial<GovernanceConfig>, reason: string, changedBy?: string): Promise<void>;
}
//# sourceMappingURL=scp-governance-bridge.d.ts.map