export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface RequestContext {
    session_id?: string;
    user_id?: string;
    tags?: string[];
    source?: "lm-studio" | "jan" | "msty" | "open-webui" | "direct";
}
export interface RequestSLO {
    latency_ms?: number;
    cost_ceiling?: number;
    offline_required?: boolean;
    min_context_length?: number;
}
export interface RequestRouting {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    priority?: "low" | "normal" | "high";
    slo?: RequestSLO;
    allowCloud?: boolean;
}
export interface ToolSpec {
    name: string;
    type: "rag" | "search" | "math" | "code";
    args?: Record<string, unknown>;
}
export interface UnifiedChatRequest {
    model?: string;
    input?: string;
    messages?: ChatMessage[];
    context?: RequestContext;
    routing?: RequestRouting;
    tools?: ToolSpec[];
}
export interface ChatUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
export interface ChatOutput {
    text: string;
    messages: ChatMessage[];
}
export interface ToolCall {
    name: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
}
export interface ResponseMeta {
    backend: "ollama" | "gpt4all" | "localai" | "llamafile" | "koboldcpp" | "anythingllm" | "mock";
    latency_ms: number;
    offline: boolean;
    source: string;
}
export interface UnifiedChatResponse {
    id: string;
    model: string;
    created: number;
    usage: ChatUsage;
    output: ChatOutput;
    tool_calls?: ToolCall[];
    meta: ResponseMeta;
}
//# sourceMappingURL=unifiedChatTypes.d.ts.map