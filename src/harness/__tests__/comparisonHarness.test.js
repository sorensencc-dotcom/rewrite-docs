import { ComparisonHarness } from "../comparisonHarness.js";
describe("ComparisonHarness", () => {
    let harness;
    beforeEach(() => {
        harness = new ComparisonHarness();
        process.env.NODE_ENV = "test";
    });
    it("should instantiate", () => {
        expect(harness).toBeDefined();
    });
    it("should have default prompts", () => {
        const prompts = harness.getDefaultPrompts();
        expect(prompts).toHaveLength(5);
        expect(prompts[0]).toContain("domestic AI chips");
    });
    it("should set custom prompts", () => {
        const custom = ["What is AI?"];
        harness.setCustomPrompts(custom);
        expect(harness.getDefaultPrompts()).toEqual(custom);
    });
    it("should run comparison with mock provider", async () => {
        // Test with a single model from a provider
        const models = ["meituan:meituan-llm-v1"];
        const prompts = ["Test prompt"];
        const report = await harness.runComparison(models, prompts);
        expect(report).toBeDefined();
        expect(report.runId).toMatch(/^comparison-/);
        expect(report.models).toEqual(models);
        expect(report.prompts).toEqual(prompts);
        expect(report.results).toHaveLength(1);
        expect(report.summary).toBeDefined();
        expect(report.summary.totalRuns).toBe(1);
    });
    it("should handle multiple models", async () => {
        const models = ["meituan:meituan-llm-v1", "groq:groq-mixtral"];
        const prompts = ["What is AI?"];
        const report = await harness.runComparison(models, prompts);
        expect(report.summary.totalRuns).toBe(2);
        expect(report.results).toHaveLength(2);
    });
    it("should track success and error counts", async () => {
        const models = ["meituan:meituan-llm-v1"];
        const prompts = ["Test prompt"];
        const report = await harness.runComparison(models, prompts);
        expect(report.summary.successCount + report.summary.errorCount).toBe(report.summary.totalRuns);
    });
    it("should calculate average latency and tokens", async () => {
        const models = ["meituan:meituan-llm-v1"];
        const prompts = ["Prompt 1", "Prompt 2"];
        const report = await harness.runComparison(models, prompts);
        expect(report.summary.avgLatencyMs).toBeGreaterThanOrEqual(0);
        expect(report.summary.avgTokens).toBeGreaterThanOrEqual(0);
    });
    it("should include timestamps", async () => {
        const models = ["meituan:meituan-llm-v1"];
        const report = await harness.runComparison(models);
        expect(report.timestamp).toBeDefined();
        expect(new Date(report.timestamp).getTime()).toBeGreaterThan(0);
        report.results.forEach((result) => {
            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
        });
    });
    it("should generate valid report structure", async () => {
        const models = ["meituan:meituan-llm-v1"];
        const report = await harness.runComparison(models);
        expect(report.runId).toBeTruthy();
        expect(report.timestamp).toBeTruthy();
        expect(Array.isArray(report.models)).toBe(true);
        expect(Array.isArray(report.prompts)).toBe(true);
        expect(Array.isArray(report.results)).toBe(true);
        expect(report.summary).toEqual(expect.objectContaining({
            totalRuns: expect.any(Number),
            successCount: expect.any(Number),
            errorCount: expect.any(Number),
            avgLatencyMs: expect.any(Number),
            avgTokens: expect.any(Number),
        }));
    });
    it("should handle unknown provider gracefully", async () => {
        const models = ["unknown:some-model"];
        const report = await harness.runComparison(models);
        expect(report.summary.errorCount).toBeGreaterThan(0);
        expect(report.results[0].error).toContain("Unknown provider");
    });
    it("should use default prompts when none provided", async () => {
        const models = ["meituan:meituan-llm-v1"];
        const report = await harness.runComparison(models);
        expect(report.prompts).toHaveLength(5);
    });
    it("should return valid comparison result structure", async () => {
        const models = ["meituan:meituan-llm-v1"];
        const report = await harness.runComparison(models, ["Test"]);
        const result = report.results[0];
        expect(result).toEqual(expect.objectContaining({
            model: expect.any(String),
            prompt: expect.any(String),
            response: expect.any(String),
            latencyMs: expect.any(Number),
            tokens: expect.any(Number),
            timestamp: expect.any(String),
        }));
    });
});
//# sourceMappingURL=comparisonHarness.test.js.map