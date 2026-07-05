import { fetchWithTimeout, validateAuthKey, estimateTokens } from "./cloudProviderBase.js";
const VALID_MODELS = [
    "meta-llama/Llama-2-7b-hf",
    "mistralai/Mistral-7B-v0.1",
    "Qwen/Qwen-7B",
    "01-ai/Yi-6B",
    "baichuan-inc/Baichuan-13B-Chat",
    "THUDM/chatglm3-6b",
];
export const huggingfaceProvider = {
    name: "huggingface",
    models: VALID_MODELS.map((m) => `huggingface:${m}`),
    chat: async (req) => {
        if (!req.model || !req.input) {
            throw new Error("model and input are required");
        }
        const modelId = req.model.split("huggingface:")[1];
        if (!modelId || !VALID_MODELS.includes(modelId)) {
            throw new Error(`Model not found: ${req.model}`);
        }
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        validateAuthKey(apiKey, "HUGGINGFACE_API_KEY");
        if (process.env.NODE_ENV === "test" && !apiKey) {
            return {
                text: "HuggingFace stub response for testing",
                latencyMs: 300,
                tokens: 12,
            };
        }
        const startTime = Date.now();
        const payload = {
            inputs: req.input,
            parameters: {
                temperature: Math.min(2.0, Math.max(0.0, req.routing?.temperature || 0.7)),
                max_new_tokens: 512,
            },
        };
        try {
            const response = await fetchWithTimeout(`https://api-inference.huggingface.co/models/${modelId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            }, 60000);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error) {
                    throw new Error(`HuggingFace error: ${errorData.error}`);
                }
                throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            let text = "";
            if (Array.isArray(data)) {
                text = data[0]?.generated_text || "";
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
                throw new Error("Request timeout after 60000ms");
            }
            throw error;
        }
    },
};
//# sourceMappingURL=huggingfaceProvider.js.map