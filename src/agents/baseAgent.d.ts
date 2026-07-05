import { ChatPayload, ModelRouter } from "../core/modelRouter.js";
import { ModelSpec } from "../core/modelSpec.js";
import { AgentRoutingProfile } from "./routingProfile.js";
export declare abstract class BaseAgent {
    protected abstract routingProfile: AgentRoutingProfile;
    protected agentName: string;
    protected router: ModelRouter;
    protected llm(messages: ChatPayload["messages"], opts?: Partial<{
        model: string;
        temperature: number;
        maxTokens: number;
        tools?: any[];
        requires?: ChatPayload["requires"];
    }>): Promise<import("../core/modelRouter.js").ChatResult>;
    protected formatMessagesForModel(messages: ChatPayload["messages"], spec: ModelSpec): ChatPayload["messages"];
    private stripToolCallInstructions;
    private stripImageContent;
    private normalizeSystemPrompts;
    private normalizeMessageRoles;
}
//# sourceMappingURL=baseAgent.d.ts.map