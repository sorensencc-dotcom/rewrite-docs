// src/providers/llamafileProvider.ts
// semver: 0.1.0
// date: 2026-06-29

import {
  UnifiedChatRequest,
  UnifiedChatResponse,
} from "../types/unifiedChatTypes.js";

const LLAMAFILE_URL = process.env.LLAMAFILE_URL || "http://localhost:8080/v1";

export async function llamafileChat(
  req: UnifiedChatRequest
): Promise<UnifiedChatResponse> {
  const start = Date.now();

  const payload = {
    model: req.model,
    messages: req.messages,
    max_tokens: req.routing?.max_tokens ?? 2048,
    temperature: req.routing?.temperature ?? 0.7,
    top_p: req.routing?.top_p ?? 0.9,
    stream: false,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${LLAMAFILE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`llamafile API error: ${res.status} ${errorText}`);
    }

    const data = (await res.json()) as any;
    const latency = Date.now() - start;

    return {
      id: data.id ?? `llamafile-${Date.now()}`,
      model: data.model ?? req.model ?? "llamafile",
      created: Date.now(),
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
      output: {
        text: data.choices?.[0]?.message?.content ?? "",
        messages: [
          {
            role: "assistant",
            content: data.choices?.[0]?.message?.content ?? "",
          },
        ],
      },
      tool_calls: [],
      meta: {
        backend: "llamafile",
        latency_ms: latency,
        offline: true,
        source: req.context?.source ?? "direct",
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
