import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export class OrchestratorAgent extends BaseAgent {
    routingProfile = new AgentRoutingProfile(["mock"]);
    async runPlan(plan) {
        const messages = this.buildOrchestratorPrompt(plan);
        const res = await this.llm(messages, { requires: { toolCalls: true } });
        return this.parseOrchestration(res.text);
    }
    buildOrchestratorPrompt(plan) {
        return [
            { role: "system", content: "You are an orchestrator agent." },
            { role: "user", content: `Run plan: ${plan}` }
        ];
    }
    parseOrchestration(text) {
        return text.trim();
    }
}
//# sourceMappingURL=orchestratorAgent.js.map