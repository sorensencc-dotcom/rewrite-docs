import { UnifiedChatRequest } from "../../types/unifiedChatTypes.js";
export type BackendId = "ollama" | "localai" | "gpt4all" | "llamafile" | "koboldcpp" | "anythingllm" | "mock";
export interface CICState {
    drift: Record<BackendId, number>;
}
export declare function route(request: UnifiedChatRequest, cic: CICState): BackendId;
//# sourceMappingURL=maal-routing-policy.d.ts.map