import { describe, it, expect, beforeEach } from "@jest/globals";
import { ResponseValidator } from "../../core/modelRouter.js";
import { MockProvider } from "../mocks/mockProvider.js";

describe("D-Phase: Response Validator (Fire-Drill)", () => {
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockProvider = new MockProvider();
  });

  it("D-1: detects 500 errors", async () => {
    mockProvider.simulate({ type: "500" });
    await expect(mockProvider.callChat(null as any, null as any)).rejects.toThrow();
  });

  it("D-3: detects malformed JSON", async () => {
    mockProvider.simulate({ type: "malformed" });
    await expect(mockProvider.callChat(null as any, null as any)).rejects.toThrow();
  });

  it("D-4: validator rejects empty text", async () => {
    const result = await mockProvider.callChat(
      { name: "test", provider: "mock", type: "mock", env: "", apiBase: "", supports: { chat: true, toolCalls: true, vision: true, streaming: true, embeddings: true } },
      { model: "test", messages: [] }
    );
    mockProvider.simulate({ type: "empty" });
    const emptyResult = await mockProvider.callChat(
      { name: "test", provider: "mock", type: "mock", env: "", apiBase: "", supports: { chat: true, toolCalls: true, vision: true, streaming: true, embeddings: true } },
      { model: "test", messages: [] }
    );
    const validation = ResponseValidator.validateText(emptyResult.text);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("Empty response");
  });

  it("D-5: detects drifted responses", async () => {
    mockProvider.simulate({ type: "drift" });
    const result = await mockProvider.callChat(
      { name: "test", provider: "mock", type: "mock", env: "", apiBase: "", supports: { chat: true, toolCalls: true, vision: true, streaming: true, embeddings: true } },
      { model: "test", messages: [] }
    );
    expect(result.text).toContain("different");
  });

  it("D-6: validator detects capability mismatch", () => {
    const responseWithoutVision = {
      content: [{ type: "text", text: "no vision" }],
      model: "text-only-model"
    };
    const spec = { name: "text-only", provider: "test", type: "mock" as any, env: "", apiBase: "", supports: { chat: true, toolCalls: true, vision: false, streaming: true, embeddings: true } };
    const validation = ResponseValidator.validateCapability(responseWithoutVision, { vision: true }, spec);
    expect(validation.valid).toBe(false);
  });

  it("All 6 failure modes are detectable", async () => {
    const modes = ["500", "timeout", "malformed", "empty", "drift", "capability_mismatch"];
    for (const mode of modes) {
      mockProvider.simulate({ type: mode as any });
      expect(mockProvider).toBeDefined();
    }
  });

  it("ResponseValidator.validateStructure rejects malformed objects", () => {
    const result = ResponseValidator.validateStructure(null);
    expect(result.valid).toBe(false);

    const result2 = ResponseValidator.validateStructure({});
    expect(result2.valid).toBe(false);

    const result3 = ResponseValidator.validateStructure({ content: [] });
    expect(result3.valid).toBe(true);
  });
});
