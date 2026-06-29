import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
import { ChatPayload } from "../core/modelRouter.js";

export class SynthesisAgent extends BaseAgent {
  protected routingProfile = new AgentRoutingProfile(
    ["mock"],
    ["mock"]
  );

  async synthesize(chunks: string[]) {
    const messages = this.buildSynthesisPrompt(chunks);
    const res = await this.llm(messages);
    return this.parseSynthesis(res.text);
  }

  private buildSynthesisPrompt(chunks: string[]): ChatPayload["messages"] {
    return [
      { role: "system", content: "You are a synthesis agent." },
      { role: "user", content: `Synthesize: ${chunks.join("\n")}` }
    ];
  }

  private parseSynthesis(text: string): string {
    return text.trim();
  }
}
