import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export declare class SynthesisAgent extends BaseAgent {
    protected routingProfile: AgentRoutingProfile;
    synthesize(chunks: string[]): Promise<string>;
    private buildSynthesisPrompt;
    private parseSynthesis;
}
//# sourceMappingURL=synthesisAgent.d.ts.map