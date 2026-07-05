import { ProviderError } from "../core/errors.js";
export const openaiCompatibleProvider = {
    async callChat(spec, payload) {
        const apiKey = process.env[spec.env];
        if (!apiKey) {
            throw new ProviderError(`Missing API key for ${spec.name} (${spec.env})`);
        }
        const body = {
            model: spec.name,
            messages: payload.messages,
            stream: payload.stream ?? false,
            max_tokens: payload.maxTokens,
            temperature: payload.temperature
        };
        if (payload.tools && spec.supports.toolCalls) {
            body.tools = payload.tools;
        }
        const res = await fetch(`${spec.apiBase}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new ProviderError(`OpenAI-compatible error (${spec.name}): ${res.status} ${text}`);
        }
        const json = (await res.json());
        const choice = json.choices?.[0];
        const text = choice?.message?.content ?? "";
        return {
            raw: json,
            text,
            model: spec.name,
            tokensUsed: json.usage
                ? {
                    input: json.usage.prompt_tokens ?? 0,
                    output: json.usage.completion_tokens ?? 0
                }
                : undefined
        };
    }
};
//# sourceMappingURL=openaiCompatible.js.map