import { fetchWithTimeout, validateAuthKey, estimateTokens } from "./cloudProviderBase.js";
const VALID_MODELS = [
    "meta-llama/Llama-2-7b-hf",
    "mistralai/Mistral-7B-Instruct-v0.1",
    "Qwen/Qwen-7B",
    "01-ai/Yi-6B",
];
export const deepinfraProvider = {
    name: "deepinfra",
    models: VALID_MODELS.map((m) => `deepinfra:${m}`),
    chat: async (req) => {
        if (!req.model || !req.input) {
            throw new Error("model and input are required");
        }
        const modelId = req.model.split("deepinfra:")[1];
        if (!modelId || !VALID_MODELS.includes(modelId)) {
            throw new Error(`Model not found: ${req.model}`);
        }
        const apiKey = process.env.DEEPINFRA_API_KEY;
        validateAuthKey(apiKey, "DEEPINFRA_API_KEY");
        if (process.env.NODE_ENV === "test" && !apiKey) {
            return {
                text: "DeepInfra stub response for testing",
                latencyMs: 320,
                tokens: 13,
            };
        }
        const startTime = Date.now();
        const payload = {
            input: req.input,
            temperature: Math.min(2.0, Math.max(0.0, req.routing?.temperature || 0.7)),
        };
        try {
            const response = await fetchWithTimeout(`https://api.deepinfra.com/v1/inference/${modelId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            }, 30000);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error) {
                    throw new Error(`DeepInfra error: ${errorData.error}`);
                }
                throw new Error(`DeepInfra API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            let text = "";
            if (data.results && Array.isArray(data.results)) {
                text = data.results[0]?.generated_text || "";
            }
            else if (data.generated_text) {
                text = data.generated_text;
            }
            const tokens = estimateTokens(text);
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
//# sourceMappingURL=deepinfraProvider.js.map