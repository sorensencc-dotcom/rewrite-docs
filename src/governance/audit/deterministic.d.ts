import { GovernancePolicy } from "../models";
export declare class DeterministicAudit {
    private compiledPatterns;
    constructor();
    private compilePatterns;
    check(skillContent: string, policies: GovernancePolicy[]): {
        hard_fails: GovernancePolicy[];
        flags: GovernancePolicy[];
    };
    private runCheck;
}
//# sourceMappingURL=deterministic.d.ts.map