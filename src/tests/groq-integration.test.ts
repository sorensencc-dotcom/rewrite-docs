// src/tests/groq-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { groqProvider } from "../providers/groqProvider.js";
import { UnifiedChatRequest } from "../types/unifiedChatTypes.js";

describe("Groq Provider Integration", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeAll(() => {
    originalEnv = { GROQ_API_KEY: process.env.GROQ_API_KEY };
  });

  afterAll(() => {
    process.env.GROQ_API_KEY = originalEnv.GROQ_API_KEY;
  });

  it("should list all supported models", () => {
    expect(groqProvider.models).toHaveLength(4);
    expect(groqProvider.models).toContain("groq:llama3-8b-8192");
    expect(groqProvider.models).toContain("groq:mixtral-8x7b-32768");
  });

  it("should throw on missing API key (non-test mode)", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.GROQ_API_KEY;

    const req: UnifiedChatRequest = {
      model: "groq:llama3-8b-8192",
      input: "Hello",
      stream: false,
      temperature: 0.0,
    };

    await expect(groqProvider.chat(req)).rejects.toThrow(
      "GROQ_API_KEY required"
    );

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should return stub response in test mode without API key", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    delete process.env.GROQ_API_KEY;

    const req: UnifiedChatRequest = {
      model: "groq:llama3-8b-8192",
      input: "Hello",
      stream: false,
      temperature: 0.7,
    };

    const response = await groqProvider.chat(req);
    expect(response.text).toBe("Groq stub response for testing");
    expect(response.latencyMs).toBe(100);
    expect(response.tokens).toBe(10);

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should throw on invalid model", async () => {
    process.env.NODE_ENV = "test";

    const req: UnifiedChatRequest = {
      model: "groq:nonexistent-model",
      input: "Hello",
      stream: false,
      temperature: 0.0,
    };

    await expect(groqProvider.chat(req)).rejects.toThrow(
      "Model not found"
    );
  });

  it("should normalize temperature", async () => {
    process.env.NODE_ENV = "test";

    const req: UnifiedChatRequest = {
      model: "groq:llama3-8b-8192",
      input: "Test",
      stream: false,
      temperature: 0.5,
    };

    const response = await groqProvider.chat(req);
    expect(response.text).toBeTruthy();
  });

  it("should have correct provider name", () => {
    expect(groqProvider.name).toBe("groq");
  });
});
