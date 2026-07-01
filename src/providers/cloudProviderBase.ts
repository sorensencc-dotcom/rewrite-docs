// src/providers/cloudProviderBase.ts
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";

export interface CloudChatResponse {
  text: string;
  latencyMs: number;
  tokens: number;
}

export interface Provider {
  name: string;
  models: string[];
  chat: (req: UnifiedChatRequest) => Promise<CloudChatResponse>;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function validateAuthKey(key: string | undefined, envVar: string): void {
  if (!key && process.env.NODE_ENV !== "test") {
    throw new Error(`${envVar} required`);
  }
}

export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
