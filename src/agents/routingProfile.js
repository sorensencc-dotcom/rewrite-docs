import { getModelSpec } from "../core/modelRegistry.js";
import { RoutingError } from "../core/errors.js";
export class AgentRoutingProfile {
    preferredModels;
    fallbackModels;
    mode;
    constructor(preferredModels, fallbackModels = [], mode) {
        this.preferredModels = preferredModels;
        this.fallbackModels = fallbackModels;
        this.mode = mode;
        this.validateModels();
    }
    pickModel() {
        const candidates = [...this.preferredModels, ...this.fallbackModels]
            .map((name) => {
            let score = 0;
            try {
                const spec = getModelSpec(name);
                score = this.computeModelScore(spec, this.preferredModels.includes(name));
            }
            catch {
                // Model spec might be missing; score remains 0
            }
            return { name, score };
        })
            .filter((c) => c.score > 0)
            .sort((a, b) => b.score - a.score);
        if (!candidates.length) {
            throw new RoutingError("No valid models configured for routing profile");
        }
        return candidates[0].name;
    }
    computeModelScore(spec, isPreferred) {
        let score = 50; // baseline
        // Preferred models get boost
        if (isPreferred)
            score += 50;
        // Capability bonus
        if (spec.supports?.toolCalls)
            score += 20;
        if (spec.supports?.streaming)
            score += 10;
        // Explicit routing score if present
        if (spec.routing?.score)
            score = spec.routing.score;
        return Math.max(1, score); // ensure non-zero
    }
    validateModels() {
        if (this.preferredModels.length === 0 && this.fallbackModels.length === 0) {
            throw new RoutingError("AgentRoutingProfile requires at least one model");
        }
    }
}
//# sourceMappingURL=routingProfile.js.map