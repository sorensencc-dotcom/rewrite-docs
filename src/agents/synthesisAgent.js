import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export class SynthesisAgent extends BaseAgent {
    routingProfile = new AgentRoutingProfile(["mock"], ["mock"]);
    async synthesize(chunks) {
        const messages = this.buildSynthesisPrompt(chunks);
        const res = await this.llm(messages);
        return this.parseSynthesis(res.text);
    }
    buildSynthesisPrompt(chunks) {
        return [
            { role: "system", content: "You are a synthesis agent." },
            { role: "user", content: `Synthesize: ${chunks.join("\n")}` }
        ];
    }
    parseSynthesis(text) {
        return text.trim();
    }
}
//# sourceMappingURL=synthesisAgent.js.map