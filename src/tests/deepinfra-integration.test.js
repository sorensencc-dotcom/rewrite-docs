// src/tests/deepinfra-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { deepinfraProvider } from "../providers/deepinfraProvider.js";
describe("DeepInfra Provider Integration", () => {
    let originalEnv;
    beforeAll(() => {
        originalEnv = { DEEPINFRA_API_KEY: process.env.DEEPINFRA_API_KEY };
    });
    afterAll(() => {
        process.env.DEEPINFRA_API_KEY = originalEnv.DEEPINFRA_API_KEY;
    });
    it("should list all supported models", () => {
        expect(deepinfraProvider.models).toHaveLength(4);
        expect(deepinfraProvider.models).toContain("deepinfra:meta-llama/Llama-2-7b-hf");
    });
    it("should throw on missing API key (non-test mode)", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        delete process.env.DEEPINFRA_API_KEY;
        const req = {
            model: "deepinfra:meta-llama/Llama-2-7b-hf",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(deepinfraProvider.chat(req)).rejects.toThrow("DEEPINFRA_API_KEY required");
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should return stub response in test mode without API key", async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "test";
        delete process.env.DEEPINFRA_API_KEY;
        const req = {
            model: "deepinfra:meta-llama/Llama-2-7b-hf",
            input: "Hello",
            stream: false,
            temperature: 0.7,
        };
        const response = await deepinfraProvider.chat(req);
        expect(response.text).toBe("DeepInfra stub response for testing");
        expect(response.latencyMs).toBe(320);
        expect(response.tokens).toBe(13);
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("should throw on invalid model", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "deepinfra:invalid/model",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(deepinfraProvider.chat(req)).rejects.toThrow("Model not found");
    });
    it("should estimate tokens from response text", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "deepinfra:meta-llama/Llama-2-7b-hf",
            input: "Test",
            stream: false,
            temperature: 0.7,
        };
        const response = await deepinfraProvider.chat(req);
        expect(response.tokens).toBeGreaterThan(0);
    });
    it("should have correct provider name", () => {
        expect(deepinfraProvider.name).toBe("deepinfra");
    });
});
//# sourceMappingURL=deepinfra-integration.test.js.map