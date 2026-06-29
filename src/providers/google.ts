import { ModelSpec } from "../core/modelSpec.js";
import { ChatPayload, ChatResult, Provider } from "../core/modelRouter.js";
import { ProviderError } from "../core/errors.js";

interface GooglePart {
  text: string;
}

interface GoogleContent {
  role: "user" | "model";
  parts: GooglePart[];
}

interface GoogleSystemInstruction {
  parts: GooglePart[];
}

interface GoogleRequestBody {
  contents: GoogleContent[];
  systemInstruction?: GoogleSystemInstruction;
  generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
  };
  tools?: any[];
}

export const googleProvider: Provider = {
  async callChat(spec: ModelSpec, payload: ChatPayload): Promise<ChatResult> {
    const apiKey = process.env[spec.env];
    if (!apiKey) {
      throw new ProviderError(`Missing API key for ${spec.name} (${spec.env})`);
    }

    let systemInstruction: GoogleSystemInstruction | undefined;
    const contents: GoogleContent[] = [];

    for (const m of payload.messages) {
      if (m.role === "system") {
        if (!systemInstruction) {
          systemInstruction = { parts: [] };
        }
        systemInstruction.parts.push({ text: m.content });
      } else {
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        });
      }
    }

    const body: GoogleRequestBody = {
      contents,
      generationConfig: {
        temperature: payload.temperature,
        maxOutputTokens: payload.maxTokens
      }
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    if (payload.tools && spec.supports.toolCalls) {
      body.tools = [{ functionDeclarations: payload.tools }];
    }

    const res = await fetch(`${spec.apiBase}/models/${spec.name}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ProviderError(`Google error (${spec.name}): ${res.status} ${text}`);
    }

    const json = (await res.json()) as any;
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return {
      raw: json,
      text,
      model: spec.name,
      tokensUsed: json.usageMetadata
        ? {
            input: json.usageMetadata.promptTokenCount ?? 0,
            output: json.usageMetadata.candidatesTokenCount ?? 0
          }
        : undefined
    };
  }
};
