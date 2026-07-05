// src/providers/ollamaProvider.ts
// semver: 0.1.0
// date: 2026-06-29
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
export async function ollamaChat(req) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: req.model?.replace(/^local:/, "") || "llama3",
                messages: req.messages,
                stream: false,
                options: {
                    temperature: req.routing?.temperature ?? 0.7,
                    num_predict: req.routing?.max_tokens ?? 2048,
                },
            }),
            signal: controller.signal,
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Ollama error: ${res.status} ${errorText}`);
        }
        const data = (await res.json());
        const text = data.message?.content ?? "";
        const latency = Date.now() - start;
        return {
            id: `ollama-${Date.now()}`,
            model: data.model ?? req.model ?? "ollama",
            created: Date.now(),
            usage: {
                prompt_tokens: data.prompt_eval_count ?? 0,
                completion_tokens: data.eval_count ?? 0,
                total_tokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
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
                backend: "ollama",
                latency_ms: latency,
                offline: true,
                source: req.context?.source ?? "direct",
            },
        };
    }
    catch (err) {
        const text = `[Ollama Mock Output for: ${req.messages?.[req.messages.length - 1]?.content ?? ""}]`;
        return {
            id: `ollama-mock-${Date.now()}`,
            model: req.model || "ollama",
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
                backend: "ollama",
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
//# sourceMappingURL=ollamaProvider.js.map