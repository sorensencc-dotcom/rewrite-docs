import { BaseAgent } from "./baseAgent.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export class EnrichmentAgent extends BaseAgent {
    routingProfile = new AgentRoutingProfile(["mock"], ["mock"]);
    async enrich(doc) {
        const messages = this.buildEnrichmentPrompt(doc);
        const res = await this.llm(messages);
        return this.parseEnrichment(res.text);
    }
    buildEnrichmentPrompt(doc) {
        return [
            { role: "system", content: "You are an enrichment agent." },
            { role: "user", content: `Enrich this doc: ${doc}` }
        ];
    }
    parseEnrichment(text) {
        return text.trim();
    }
}
//# sourceMappingURL=enrichmentAgent.js.map