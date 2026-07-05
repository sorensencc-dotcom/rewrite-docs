import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export declare class EnrichmentAgent extends BaseAgent {
    protected routingProfile: AgentRoutingProfile;
    enrich(doc: string): Promise<string>;
    private buildEnrichmentPrompt;
    private parseEnrichment;
}
//# sourceMappingURL=enrichmentAgent.d.ts.map