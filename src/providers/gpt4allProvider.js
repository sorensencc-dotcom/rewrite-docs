// src/providers/gpt4allProvider.ts
// semver: 0.1.0
// date: 2026-06-29
const GPT4ALL_URL = process.env.GPT4ALL_URL || "http://localhost:4891/v1";
export async function gpt4allChat(req) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const res = await fetch(`${GPT4ALL_URL}/chat/completions`, {
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
            throw new Error(`GPT4All error: ${res.status} ${errorText}`);
        }
        const data = (await res.json());
        const text = data.choices?.[0]?.message?.content ?? "";
        const latency = Date.now() - start;
        return {
            id: data.id ?? `gpt4all-${Date.now()}`,
            model: data.model ?? req.model ?? "gpt4all",
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
                backend: "gpt4all",
                latency_ms: latency,
                offline: true,
                source: req.context?.source ?? "direct",
            },
        };
    }
    catch (err) {
        const text = `[GPT4All Mock Output for: ${req.messages?.[req.messages.length - 1]?.content ?? ""}]`;
        return {
            id: `gpt4all-mock-${Date.now()}`,
            model: req.model || "gpt4all",
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
                backend: "gpt4all",
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
//# sourceMappingURL=gpt4allProvider.js.map