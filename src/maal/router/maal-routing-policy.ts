// src/maal/router/maal-routing-policy.ts
// semver: 0.1.0
// date: 2026-06-29

import { UnifiedChatRequest } from "../../types/unifiedChatTypes.js";

export type BackendId =
  | "ollama"
  | "localai"
  | "gpt4all"
  | "llamafile"
  | "koboldcpp"
  | "anythingllm"
  | "mock";

export interface CICState {
  drift: Record<BackendId, number>;
}

const DRIFT_THRESHOLD = 0.7;

function hasTag(request: UnifiedChatRequest, tag: string): boolean {
  return (request.context?.tags ?? []).includes(tag);
}

function toolsInclude(request: UnifiedChatRequest, type: string): boolean {
  return (request.tools ?? []).some(t => t.name === type || t.type === type);
}

function prefer(
  candidates: BackendId[],
  reason: string,
  current: BackendId[]
): BackendId[] {
  const set = new Set(current);
  for (const c of candidates) {
    if (!set.has(c)) {
      current.push(c);
      set.add(c);
    }
  }
  return current;
}

function avoid(
  backend: BackendId,
  reason: string,
  current: BackendId[]
): BackendId[] {
  return current.filter(b => b !== backend);
}

export function route(request: UnifiedChatRequest, cic: CICState): BackendId {
  const { routing, context, tools } = request;
  const slo = routing?.slo ?? {};
  let order: BackendId[] = [];

  // 1. Offline-required
  if (slo.offline_required) {
    order = prefer(
      ["ollama", "localai", "gpt4all", "llamafile", "mock"],
      "offline-required",
      order
    );
  }

  // 2. Cost = 0 (offline-first)
  if (slo.cost_ceiling === 0) {
    order = prefer(
      ["ollama", "gpt4all", "koboldcpp", "llamafile", "mock"],
      "cost-zero",
      order
    );
  }

  // 3. Low-latency
  if (typeof slo.latency_ms === "number" && slo.latency_ms < 1000) {
    order = prefer(["ollama", "localai", "mock"], "low-latency", order);
  }

  // 4. Long-context
  if (typeof slo.min_context_length === "number" && slo.min_context_length > 8000) {
    order = prefer(["koboldcpp", "ollama"], "long-context", order);
  }

  // 5. RAG-required
  if (toolsInclude(request, "rag")) {
    order = prefer(["anythingllm"], "rag-required", order);
    order = prefer(["ollama", "mock"], "rag-generation", order);
  }

  // 6. Deterministic replay
  if (context && hasTag(request, "deterministic-replay")) {
    order = prefer(["llamafile", "mock"], "deterministic-replay", order);
  }

  // 7. Sandbox mode
  if (context && hasTag(request, "sandbox")) {
    order = prefer(["ollama", "llamafile", "mock"], "sandbox-mode", order);
  }

  // 8. UX source
  if (context?.source) {
    switch (context.source) {
      case "lm-studio":
        order = prefer(["ollama", "mock"], "ux-lm-studio", order);
        break;
      case "jan":
        order = prefer(["localai", "mock"], "ux-jan", order);
        break;
      case "msty":
        order = prefer(["gpt4all", "mock"], "ux-msty", order);
        break;
      case "open-webui":
        order = prefer(["ollama", "mock"], "ux-open-webui", order);
        break;
      default:
        break;
    }
  }

  // 9. Default safety net if nothing selected yet
  if (order.length === 0) {
    order = ["ollama", "localai", "gpt4all", "koboldcpp", "llamafile", "anythingllm", "mock"];
  }

  // 10. Drift-aware pruning (CIC feedback)
  for (const backend of [...order]) {
    const driftScore = cic.drift[backend] ?? 0;
    if (driftScore > DRIFT_THRESHOLD) {
      order = avoid(backend, "drift-detected", order);
    }
  }

  // 11. Final selection
  if (order.length === 0) {
    return "ollama";
  }

  return order[0];
}
