// src/tests/meituan-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { meituanProvider } from "../providers/meituanProvider.js";
describe("Meituan Provider Integration", () => {
    let originalEnv;
    beforeAll(() => {
        originalEnv = {
            MEITUAN_API_KEY: process.env.MEITUAN_API_KEY,
            NODE_ENV: process.env.NODE_ENV,
            MOCK_PROVIDERS: process.env.MOCK_PROVIDERS,
        };
    });
    afterAll(() => {
        process.env.MEITUAN_API_KEY = originalEnv.MEITUAN_API_KEY;
        process.env.NODE_ENV = originalEnv.NODE_ENV;
        process.env.MOCK_PROVIDERS = originalEnv.MOCK_PROVIDERS;
    });
    it("should list supported models", () => {
        expect(meituanProvider.models).toHaveLength(1);
        expect(meituanProvider.models).toContain("meituan:meituan-llm-v1");
    });
    it("should return stub response in test mode without API key", async () => {
        process.env.NODE_ENV = "test";
        delete process.env.MEITUAN_API_KEY;
        const req = {
            model: "meituan:meituan-llm-v1",
            input: "Explain domestic chips",
            stream: false,
            temperature: 0.7,
        };
        const response = await meituanProvider.chat(req);
        expect(response.text).toBe("Domestic AI chips reduce dependency on foreign accelerators and allow tighter optimization between hardware and training stack.");
        expect(response.latencyMs).toBe(182);
        expect(response.tokens).toBe(41);
    });
    it("should return stub response with MOCK_PROVIDERS=1", async () => {
        delete process.env.MEITUAN_API_KEY;
        process.env.MOCK_PROVIDERS = "1";
        const req = {
            model: "meituan:meituan-llm-v1",
            input: "Test",
            stream: false,
            temperature: 0.0,
        };
        const response = await meituanProvider.chat(req);
        expect(response.text).toContain("Domestic AI chips");
        expect(response.latencyMs).toBe(182);
        expect(response.tokens).toBe(41);
    });
    it("should throw on missing API key in production", async () => {
        process.env.NODE_ENV = "production";
        delete process.env.MEITUAN_API_KEY;
        const req = {
            model: "meituan:meituan-llm-v1",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(meituanProvider.chat(req)).rejects.toThrow("MEITUAN_API_KEY required");
    });
    it("should throw on invalid model", async () => {
        process.env.NODE_ENV = "test";
        const req = {
            model: "meituan:invalid-model",
            input: "Hello",
            stream: false,
            temperature: 0.0,
        };
        await expect(meituanProvider.chat(req)).rejects.toThrow("Model not found");
    });
    it("should have correct provider name", () => {
        expect(meituanProvider.name).toBe("meituan");
    });
    it("should have deterministic stub response", async () => {
        process.env.NODE_ENV = "test";
        delete process.env.MEITUAN_API_KEY;
        const req = {
            model: "meituan:meituan-llm-v1",
            input: "Any input",
            stream: false,
            temperature: 0.0,
        };
        // Call twice and verify same response
        const response1 = await meituanProvider.chat(req);
        const response2 = await meituanProvider.chat(req);
        expect(response1.text).toBe(response2.text);
        expect(response1.latencyMs).toBe(response2.latencyMs);
        expect(response1.tokens).toBe(response2.tokens);
    });
});
//# sourceMappingURL=meituan-integration.test.js.map