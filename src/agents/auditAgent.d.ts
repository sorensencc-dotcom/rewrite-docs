import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export interface AuditResult {
    primary: string;
    secondary: string;
    primaryModel: string;
    secondaryModel: string;
    score: number;
    issues: string[];
}
export declare class AuditAgent extends BaseAgent {
    protected routingProfile: AgentRoutingProfile;
    audit(primary: string, secondary?: string): Promise<AuditResult>;
    audit(result: string): Promise<AuditResult>;
    private auditImplementation;
    private buildAuditPrompt;
    private computeConsistency;
}
//# sourceMappingURL=auditAgent.d.ts.map