import { ModelSpec } from "./modelSpec.js";
import { AgentRoutingProfile } from "../agents/routingProfile.js";
export interface ChatPayload {
    model: string;
    messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>;
    tools?: any[];
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    requires?: {
        toolCalls?: boolean;
        vision?: boolean;
        streaming?: boolean;
        embeddings?: boolean;
    };
}
export interface ChatResult {
    raw: any;
    text: string;
    tokensUsed?: {
        input: number;
        output: number;
    };
    model: string;
    fallbackUsed?: boolean;
}
export interface Provider {
    callChat(spec: ModelSpec, payload: ChatPayload): Promise<ChatResult>;
}
export interface RouterConfig {
    providerTimeoutMs?: number;
    driftThresholdPct?: number;
}
export declare class ResponseValidator {
    static validateStructure(raw: any): {
        valid: boolean;
        reason?: string;
    };
    static validateText(text: string): {
        valid: boolean;
        reason?: string;
    };
    static validateCapability(raw: any, requires?: ChatPayload["requires"], spec?: ModelSpec): {
        valid: boolean;
        reason?: string;
    };
}
export declare class ModelRouter {
    private registry;
    constructor(registry: Map<string, ModelSpec>);
    selectModel(profile: AgentRoutingProfile, payload: ChatPayload): ModelSpec;
    private filterByMode;
    private satisfiesRequires;
    private capabilityScore;
}
export declare function callModel(payload: ChatPayload, agentName?: string, config?: RouterConfig): Promise<ChatResult>;
//# sourceMappingURL=modelRouter.d.ts.map