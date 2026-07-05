import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";
export interface CloudChatResponse {
    text: string;
    latencyMs: number;
    tokens: number;
}
export interface Provider {
    name: string;
    models: string[];
    chat: (req: UnifiedChatRequest) => Promise<CloudChatResponse>;
}
export declare function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response>;
export declare function validateAuthKey(key: string | undefined, envVar: string): void;
export declare function estimateTokens(text: string): number;
//# sourceMappingURL=cloudProviderBase.d.ts.map