// src/tests/huggingface-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { huggingfaceProvider } from "../providers/huggingfaceProvider.js";
describe("HuggingFace Provider Integration", () => {
    let originalEnv;
    beforeAll(() => {
        originalEnv = { HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY };
    });
    afterAll(() => {
        process.env.HUGGINGFACE_API_KEY = originalEnv.HUGGINGFACE_API_KEY;
    });
    it("should list all supported models", () => {
        expect(huggingfaceProvider.models.length).toBeGreaterThan(0);
        expect(huggingfaceProvider.models).toContain("huggingface:meta-llama/Llama-2-7b-hf");
    });
    it("should throw on missing API key (non-test mode)", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        delete process.env.HUGGINGFACE_API_KEY;
        const req = {
            model: "huggingface:meta-llama/Llama-2-7b-hf",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(huggingfaceProvider.chat(req)).rejects.toThrow("HUGGINGFACE_API_KEY required");
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should return stub response in test mode without API key", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "test";
        delete process.env.HUGGINGFACE_API_KEY;
        const req = {
            model: "huggingface:meta-llama/Llama-2-7b-hf",
            input: "Hello",
            stream: false,
            temperature: 0.7,
        };
        const response = await huggingfaceProvider.chat(req);
        expect(response.text).toBe("HuggingFace stub response for testing");
        expect(response.latencyMs).toBe(300);
        expect(response.tokens).toBe(12);
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should throw on invalid model", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "huggingface:invalid-model-path",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(huggingfaceProvider.chat(req)).rejects.toThrow("Model not found");
    });
    it("should have correct provider name", () => {
        expect(huggingfaceProvider.name).toBe("huggingface");
    });
    it("should estimate tokens from text", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "huggingface:meta-llama/Llama-2-7b-hf",
            input: "Test message for token counting",
            stream: false,
            temperature: 0.7,
        };
        const response = await huggingfaceProvider.chat(req);
        expect(response.tokens).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=huggingface-integration.test.js.map