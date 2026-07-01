// src/providers/openrouterProvider.ts
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";
import { Provider, CloudChatResponse, fetchWithTimeout, validateAuthKey } from "./cloudProviderBase.js";

const MODEL_MAPPING: Record<string, string> = {
  "llama3-8b": "meta-llama/llama-3-8b",
  "llama3-70b": "meta-llama/llama-3-70b",
  "mistral-7b": "mistralai/Mistral-7B-v0.1",
  "qwen-7b": "Qwen/Qwen-7B",
  "yi-34b": "01-ai/Yi-34B-Chat",
  "baichuan2-13b": "baichuan-inc/Baichuan-13B-Chat",
  "glm-4": "THUDM/glm-4-9b-chat",
  "kimi-k3": "THUDM/glm-4-9b-chat", // Placeholder
};

export const openrouterProvider: Provider = {
  name: "openrouter",
  models: [
    "openrouter:llama3-8b",
    "openrouter:llama3-70b",
    "openrouter:mistral-7b",
    "openrouter:qwen-7b",
    "openrouter:yi-34b",
    "openrouter:baichuan2-13b",
    "openrouter:glm-4",
    "openrouter:kimi-k3",
  ],

  chat: async (req: UnifiedChatRequest): Promise<CloudChatResponse> => {
    if (!req.model || !req.input) {
      throw new Error("model and input are required");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    validateAuthKey(apiKey, "OPENROUTER_API_KEY");

    if (process.env.NODE_ENV === "test" && !apiKey) {
      return {
        text: "OpenRouter stub response for testing",
        latencyMs: 250,
        tokens: 15,
      };
    }

    const modelId = req.model.split(":")[1];
    if (!modelId || !MODEL_MAPPING[modelId]) {
      throw new Error(`Model not found: ${req.model}`);
    }

    const mappedModel = MODEL_MAPPING[modelId];
    const startTime = Date.now();

    const payload = {
      model: mappedModel,
      messages: [{ role: "user", content: req.input }],
      temperature: Math.min(2.0, Math.max(0.0, req.routing?.temperature || 0.7)),
      max_tokens: 1024,
    };

    try {
      const response = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        },
        30000
      );

      if (!response.ok) {
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}`
        );
      }

      const data: any = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const tokens = data.usage?.total_tokens || 0;
      const latencyMs = Date.now() - startTime;

      return { text, latencyMs, tokens };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout after 30000ms");
      }
      throw error;
    }
  },
};
