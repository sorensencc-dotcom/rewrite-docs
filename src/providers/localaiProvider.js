// src/providers/localaiProvider.ts
// semver: 0.1.0
// date: 2026-06-29
const LOCALAI_URL = process.env.LOCALAI_URL || "http://localhost:8080/v1";
export async function localaiChat(req) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${LOCALAI_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: req.model || "default",
                messages: req.messages,
                max_tokens: req.routing?.max_tokens ?? 2048,
                temperature: req.routing?.temperature ?? 0.7,
                stream: false,
            }),
            signal: controller.signal,
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`LocalAI error: ${res.status} ${errorText}`);
        }
        const data = (await res.json());
        const text = data.choices?.[0]?.message?.content ?? "";
        const latency = Date.now() - start;
        return {
            id: data.id ?? `localai-${Date.now()}`,
            model: data.model ?? req.model ?? "localai",
            created: Date.now(),
            usage: {
                prompt_tokens: data.usage?.prompt_tokens ?? 0,
                completion_tokens: data.usage?.completion_tokens ?? 0,
                total_tokens: data.usage?.total_tokens ?? 0,
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
                backend: "localai",
                latency_ms: latency,
                offline: true,
                source: req.context?.source ?? "direct",
            },
        };
    }
    catch (err) {
        const text = `[LocalAI Mock Output for: ${req.messages?.[req.messages.length - 1]?.content ?? ""}]`;
        return {
            id: `localai-mock-${Date.now()}`,
            model: req.model || "localai",
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
                backend: "localai",
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
//# sourceMappingURL=localaiProvider.js.map