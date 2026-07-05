// src/tests/openrouter-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { openrouterProvider } from "../providers/openrouterProvider.js";
describe("OpenRouter Provider Integration", () => {
    let originalEnv;
    beforeAll(() => {
        originalEnv = { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY };
    });
    afterAll(() => {
        process.env.OPENROUTER_API_KEY = originalEnv.OPENROUTER_API_KEY;
    });
    it("should list all supported models", () => {
        expect(openrouterProvider.models).toHaveLength(8);
        expect(openrouterProvider.models).toContain("openrouter:llama3-8b");
        expect(openrouterProvider.models).toContain("openrouter:mistral-7b");
    });
    it("should throw on missing API key (non-test mode)", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        delete process.env.OPENROUTER_API_KEY;
        const req = {
            model: "openrouter:llama3-8b",
            input: "What is 2+2?",
            stream: false,
            temperature: 0.0,
        };
        await expect(openrouterProvider.chat(req)).rejects.toThrow("OPENROUTER_API_KEY required");
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should return stub response in test mode without API key", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "test";
        delete process.env.OPENROUTER_API_KEY;
        const req = {
            model: "openrouter:llama3-8b",
            input: "Hello",
            stream: false,
            temperature: 0.7,
        };
        const response = await openrouterProvider.chat(req);
        expect(response.text).toBe("OpenRouter stub response for testing");
        expect(response.latencyMs).toBe(250);
        expect(response.tokens).toBe(15);
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should throw on invalid model", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "openrouter:nonexistent-model",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(openrouterProvider.chat(req)).rejects.toThrow("Model not found");
    });
    it("should normalize temperature to valid range", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "openrouter:llama3-8b",
            input: "Test",
            stream: false,
            temperature: 3.0, // Out of range
        };
        const response = await openrouterProvider.chat(req);
        expect(response.text).toBeTruthy();
        expect(response.tokens).toBeGreaterThan(0);
    });
    it("should have correct provider name", () => {
        expect(openrouterProvider.name).toBe("openrouter");
    });
});
//# sourceMappingURL=openrouter-integration.test.js.map