// src/providers/togetherProvider.ts
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";
import { Provider, CloudChatResponse, fetchWithTimeout, validateAuthKey } from "./cloudProviderBase.js";

const VALID_MODELS = [
  "meta-llama/Llama-2-7b-hf",
  "mistralai/Mistral-7B-Instruct-v0.1",
  "togethercomputer/LLaMA-2-70B-chat",
  "NousResearch/Nous-Hermes-2-7B-DPO",
  "togethercomputer/alpaca-7b",
];

export const togetherProvider: Provider = {
  name: "together",
  models: VALID_MODELS.map((m) => `together:${m}`),

  chat: async (req: UnifiedChatRequest): Promise<CloudChatResponse> => {
    if (!req.model || !req.input) {
      throw new Error("model and input are required");
    }

    const modelId = req.model.split("together:")[1];
    if (!modelId || !VALID_MODELS.includes(modelId)) {
      throw new Error(`Model not found: ${req.model}`);
    }

    const apiKey = process.env.TOGETHER_API_KEY;
    validateAuthKey(apiKey, "TOGETHER_API_KEY");

    if (process.env.NODE_ENV === "test" && !apiKey) {
      return {
        text: "Together stub response for testing",
        latencyMs: 280,
        tokens: 14,
      };
    }

    const startTime = Date.now();

    const payload = {
      model: modelId,
      messages: [{ role: "user", content: req.input }],
      temperature: Math.min(2.0, Math.max(0.0, req.routing?.temperature || 0.7)),
      max_tokens: 1024,
    };

    try {
      const response = await fetchWithTimeout(
        "https://api.together.xyz/v1/chat/completions",
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
          `Together API error: ${response.status} ${response.statusText}`
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
