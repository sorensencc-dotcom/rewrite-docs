// src/providers/groqProvider.ts
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";
import { Provider, CloudChatResponse, fetchWithTimeout, validateAuthKey } from "./cloudProviderBase.js";

const VALID_MODELS = [
  "llama3-8b-8192",
  "llama3-70b-8192",
  "mixtral-8x7b-32768",
  "gemma-7b-it",
];

export const groqProvider: Provider = {
  name: "groq",
  models: VALID_MODELS.map((m) => `groq:${m}`),

  chat: async (req: UnifiedChatRequest): Promise<CloudChatResponse> => {
    if (!req.model || !req.input) {
      throw new Error("model and input are required");
    }

    const modelId = req.model.split("groq:")[1];
    if (!modelId || !VALID_MODELS.includes(modelId)) {
      throw new Error(`Model not found: ${req.model}`);
    }

    const apiKey = process.env.GROQ_API_KEY;
    validateAuthKey(apiKey, "GROQ_API_KEY");

    if (process.env.NODE_ENV === "test" && !apiKey) {
      return {
        text: "Groq stub response for testing",
        latencyMs: 100,
        tokens: 10,
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
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        },
        15000
      );

      if (!response.ok) {
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}`
        );
      }

      const data: any = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const tokens = data.usage?.total_tokens || 0;
      const latencyMs = Date.now() - startTime;

      return { text, latencyMs, tokens };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout after 15000ms");
      }
      throw error;
    }
  },
};
