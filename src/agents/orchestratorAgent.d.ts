import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export declare class OrchestratorAgent extends BaseAgent {
    protected routingProfile: AgentRoutingProfile;
    runPlan(plan: string): Promise<string>;
    private buildOrchestratorPrompt;
    private parseOrchestration;
}
//# sourceMappingURL=orchestratorAgent.d.ts.map