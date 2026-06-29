import { ModelSpec } from "../core/modelSpec.js";
import { ChatPayload, ChatResult, Provider } from "../core/modelRouter.js";
import { ProviderError } from "../core/errors.js";

export const azureOpenAIProvider: Provider = {
  async callChat(spec: ModelSpec, payload: ChatPayload): Promise<ChatResult> {
    const apiKey = process.env[spec.env];
    if (!apiKey) {
      throw new ProviderError(`Missing API key for ${spec.name} (${spec.env})`);
    }

    const body: any = {
      messages: payload.messages,
      stream: payload.stream ?? false,
      max_tokens: payload.maxTokens,
      temperature: payload.temperature
    };

    if (payload.tools && spec.supports.toolCalls) {
      body.tools = payload.tools;
    }

    const res = await fetch(`${spec.apiBase}/chat/completions?api-version=2024-02-15-preview`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ProviderError(`Azure OpenAI error (${spec.name}): ${res.status} ${text}`);
    }

    const json = (await res.json()) as any;
    const choice = json.choices?.[0];
    const text = choice?.message?.content ?? "";

    return {
      raw: json,
      text,
      model: spec.name,
      tokensUsed: json.usage
        ? {
            input: json.usage.prompt_tokens ?? 0,
            output: json.usage.completion_tokens ?? 0
          }
        : undefined
    };
  }
};
