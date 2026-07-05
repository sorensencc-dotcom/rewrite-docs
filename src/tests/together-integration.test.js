// src/tests/together-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { togetherProvider } from "../providers/togetherProvider.js";
describe("Together AI Provider Integration", () => {
    let originalEnv;
    beforeAll(() => {
        originalEnv = { TOGETHER_API_KEY: process.env.TOGETHER_API_KEY };
    });
    afterAll(() => {
        process.env.TOGETHER_API_KEY = originalEnv.TOGETHER_API_KEY;
    });
    it("should list all supported models", () => {
        expect(togetherProvider.models.length).toBe(5);
        expect(togetherProvider.models).toContain("together:meta-llama/Llama-2-7b-hf");
    });
    it("should throw on missing API key (non-test mode)", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        delete process.env.TOGETHER_API_KEY;
        const req = {
            model: "together:meta-llama/Llama-2-7b-hf",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(togetherProvider.chat(req)).rejects.toThrow("TOGETHER_API_KEY required");
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should return stub response in test mode without API key", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "test";
        delete process.env.TOGETHER_API_KEY;
        const req = {
            model: "together:meta-llama/Llama-2-7b-hf",
            input: "Hello",
            stream: false,
            temperature: 0.7,
        };
        const response = await togetherProvider.chat(req);
        expect(response.text).toBe("Together stub response for testing");
        expect(response.latencyMs).toBe(280);
        expect(response.tokens).toBe(14);
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should throw on invalid model", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "together:invalid/model-path",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(togetherProvider.chat(req)).rejects.toThrow("Model not found");
    });
    it("should have correct provider name", () => {
        expect(togetherProvider.name).toBe("together");
    });
});
//# sourceMappingURL=together-integration.test.js.map