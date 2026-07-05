// src/providers/anythingllmProvider.ts
// semver: 0.1.0
// date: 2026-06-29
const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || "http://localhost:3001/api/v1";
export async function anythingllmChat(req) {
    const start = Date.now();
    const apiKey = process.env.ANYTHINGLLM_API_KEY || "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${ANYTHINGLLM_URL}/workspace/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query: req.input ?? "",
            }),
            signal: controller.signal,
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`AnythingLLM error: ${res.status} ${errorText}`);
        }
        const data = (await res.json());
        const text = data.textResponse || "";
        const latency = Date.now() - start;
        return {
            id: `anythingllm-${Date.now()}`,
            model: req.model ?? "anythingllm",
            created: Date.now(),
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
            output: {
                text,
                messages: [
                    {
                        role: "assistant",
                        content: text,
                    },
                ],
            },
            meta: {
                backend: "anythingllm",
                latency_ms: latency,
                offline: true,
                source: req.context?.source ?? "direct",
            },
        };
    }
    catch (err) {
        const text = `[AnythingLLM Mock Output for query: ${req.input ?? ""}]`;
        return {
            id: `anythingllm-mock-${Date.now()}`,
            model: req.model || "anythingllm",
            created: Date.now(),
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
            output: {
                text,
                messages: [
                    {
                        role: "assistant",
                        content: text,
                    },
                ],
            },
            meta: {
                backend: "anythingllm",
                latency_ms: Date.now() - start,
                offline: true,
                source: req.context?.source ?? "direct",
            },
        };
    }
    finally {
        clearTimeout(timeoutId);
    }
}
//# sourceMappingURL=anythingllmProvider.js.map