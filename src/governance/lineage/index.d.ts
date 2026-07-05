import { AuditResult, GovernanceContext, Skill, ISO8601 } from "../models";
export interface Database {
    insert(table: string, data: Record<string, unknown>): Promise<void>;
    query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}
export declare class SkillLineage {
    private db;
    constructor(db: Database);
    record(skill: Skill, audit: AuditResult, ctx: GovernanceContext): Promise<void>;
    getAuditChain(skillId: string): Promise<AuditResult[]>;
    queryByPolicy(policyId: string, timeRange?: {
        start: ISO8601;
        end: ISO8601;
    }): Promise<string[]>;
    detectDrift(skillId: string): Promise<{
        has_drift: boolean;
        drift_timeline: {
            audit_timestamp: ISO8601;
            policies_added: string[];
            policies_removed: string[];
            risk_delta: number;
        }[];
    }>;
    private rowToAuditResult;
}
//# sourceMappingURL=index.d.ts.map