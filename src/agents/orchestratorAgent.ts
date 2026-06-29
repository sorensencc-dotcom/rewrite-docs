import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
import { ChatPayload } from "../core/modelRouter.js";

export class OrchestratorAgent extends BaseAgent {
  protected routingProfile = new AgentRoutingProfile(["mock"]);

  async runPlan(plan: string) {
    const messages = this.buildOrchestratorPrompt(plan);
    const res = await this.llm(messages, { requires: { toolCalls: true } });
    return this.parseOrchestration(res.text);
  }

  private buildOrchestratorPrompt(plan: string): ChatPayload["messages"] {
    return [
      { role: "system", content: "You are an orchestrator agent." },
      { role: "user", content: `Run plan: ${plan}` }
    ];
  }

  private parseOrchestration(text: string): string {
    return text.trim();
  }
}
