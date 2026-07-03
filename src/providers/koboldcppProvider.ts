// src/providers/koboldcppProvider.ts
// semver: 0.1.0
// date: 2026-06-29

import {
  UnifiedChatRequest,
  UnifiedChatResponse,
} from "../types/unifiedChatTypes.js";

const KOBOLDCPP_URL = process.env.KOBOLDCPP_URL || "http://localhost:5001/v1";

export async function koboldcppChat(
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
    const res = await fetch(`${KOBOLDCPP_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`koboldcpp API error: ${res.status} ${errorText}`);
    }

    const data = (await res.json()) as any;
    const latency = Date.now() - start;

    const text =
      data?.choices?.[0]?.message?.content ??
      data?.results?.[0]?.text ??
      "";

    return {
      id: data.id ?? `koboldcpp-${Date.now()}`,
      model: data.model ?? req.model ?? "koboldcpp",
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
      tool_calls: [],
      meta: {
        backend: "koboldcpp",
        latency_ms: latency,
        offline: true,
        source: req.context?.source ?? "direct",
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
