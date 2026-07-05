import { AuditResult, GovernanceContext, Skill } from "../models";
import { DeterministicAudit } from "./deterministic";
import { AuditCache } from "./cache";
export declare class SkillAudit {
    private cache;
    private policyVersion;
    private deterministic;
    constructor(cache: AuditCache, policyVersion?: string);
    audit(skill: Skill, ctx: GovernanceContext): Promise<AuditResult>;
    private determineVerdict;
    private buildAuditResult;
}
export { DeterministicAudit };
export { AuditCache };
export type { CacheClient } from "./cache";
//# sourceMappingURL=index.d.ts.map