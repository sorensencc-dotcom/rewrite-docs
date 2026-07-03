// src/tests/maal-routing-policy.test.ts
// semver: 0.1.0
// date: 2026-06-29

import { route, BackendId } from "../maal/router/maal-routing-policy.js";
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";

describe("MAAL Routing Policy", () => {
  const defaultState = {
    drift: {
      ollama: 0,
      localai: 0,
      gpt4all: 0,
      llamafile: 0,
      koboldcpp: 0,
      anythingllm: 0,
      mock: 0,
    },
  };

  test("1. Offline-required routing", () => {
    const req: UnifiedChatRequest = {
      routing: {
        slo: { offline_required: true },
      },
    };
    const result = route(req, defaultState);
    expect(["ollama", "localai", "gpt4all", "llamafile", "mock"]).toContain(result);
  });

  test("2. Cost = 0 (offline-first) routing", () => {
    const req: UnifiedChatRequest = {
      routing: {
        slo: { cost_ceiling: 0 },
      },
    };
    const result = route(req, defaultState);
    expect(["ollama", "gpt4all", "koboldcpp", "llamafile", "mock"]).toContain(result);
  });

  test("3. Low-latency routing", () => {
    const req: UnifiedChatRequest = {
      routing: {
        slo: { latency_ms: 800 },
      },
    };
    const result = route(req, defaultState);
    expect(["ollama", "localai", "mock"]).toContain(result);
  });

  test("4. Long-context routing", () => {
    const req: UnifiedChatRequest = {
      routing: {
        slo: { min_context_length: 12000 },
      },
    };
    const result = route(req, defaultState);
    expect(result).toBe("koboldcpp");
  });

  test("5. RAG-required routing", () => {
    const req: UnifiedChatRequest = {
      tools: [{ name: "rag", type: "rag" }],
    };
    const result = route(req, defaultState);
    expect(result).toBe("anythingllm");
  });

  test("6. Deterministic replay routing", () => {
    const req: UnifiedChatRequest = {
      context: {
        tags: ["deterministic-replay"],
      },
    };
    const result = route(req, defaultState);
    expect(result).toBe("llamafile");
  });

  test("7. Sandbox mode routing", () => {
    const req: UnifiedChatRequest = {
      context: {
        tags: ["sandbox"],
      },
    };
    const result = route(req, defaultState);
    expect(result).toBe("ollama");
  });

  test("8. UX source routing: LM Studio", () => {
    const req: UnifiedChatRequest = {
      context: { source: "lm-studio" },
    };
    const result = route(req, defaultState);
    expect(result).toBe("ollama");
  });

  test("8. UX source routing: Jan", () => {
    const req: UnifiedChatRequest = {
      context: { source: "jan" },
    };
    const result = route(req, defaultState);
    expect(result).toBe("localai");
  });

  test("8. UX source routing: Msty", () => {
    const req: UnifiedChatRequest = {
      context: { source: "msty" },
    };
    const result = route(req, defaultState);
    expect(result).toBe("gpt4all");
  });

  test("8. UX source routing: Open WebUI", () => {
    const req: UnifiedChatRequest = {
      context: { source: "open-webui" },
    };
    const result = route(req, defaultState);
    expect(result).toBe("ollama");
  });

  test("9. Safety net default routing", () => {
    const req: UnifiedChatRequest = {};
    const result = route(req, defaultState);
    expect(result).toBe("ollama");
  });

  test("10. Drift avoidance routing", () => {
    const state = {
      drift: {
        ollama: 0.9, // drifted!
        localai: 0,
        gpt4all: 0,
        llamafile: 0,
        koboldcpp: 0,
        anythingllm: 0,
        mock: 0,
      },
    };
    const req: UnifiedChatRequest = {};
    const result = route(req, state);
    expect(result).not.toBe("ollama");
    expect(result).toBe("localai");
  });
});
