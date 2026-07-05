import { fetchWithTimeout, validateAuthKey } from "./cloudProviderBase.js";
export const meituanProvider = {
    name: "meituan",
    models: ["meituan:meituan-llm-v1"],
    chat: async (req) => {
        if (!req.model || !req.input) {
            throw new Error("model and input are required");
        }
        const modelId = req.model.split("meituan:")[1];
        if (modelId !== "meituan-llm-v1") {
            throw new Error(`Model not found: ${req.model}`);
        }
        const apiKey = process.env.MEITUAN_API_KEY;
        // Stub mode: test environment or MOCK_PROVIDERS=1
        if ((process.env.NODE_ENV === "test" || process.env.MOCK_PROVIDERS === "1") &&
            !apiKey) {
            return {
                text: "Domestic AI chips reduce dependency on foreign accelerators and allow tighter optimization between hardware and training stack.",
                latencyMs: 182,
                tokens: 41,
            };
        }
        validateAuthKey(apiKey, "MEITUAN_API_KEY");
        const startTime = Date.now();
        const payload = {
            model: "meituan-llm-v1",
            messages: [{ role: "user", content: req.input }],
            temperature: Math.min(2.0, Math.max(0.0, req.routing?.temperature || 0.7)),
            max_tokens: 1024,
        };
        try {
            const response = await fetchWithTimeout("https://api.meituan.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            }, 30000);
            if (!response.ok) {
                throw new Error(`Meituan API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "";
            const tokens = data.usage?.total_tokens || 0;
            const latencyMs = Date.now() - startTime;
            return { text, latencyMs, tokens };
        }
        catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Request timeout after 30000ms");
            }
            throw error;
        }
    },
};
//# sourceMappingURL=meituanProvider.js.map