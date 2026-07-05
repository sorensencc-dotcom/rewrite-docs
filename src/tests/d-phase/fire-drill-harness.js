import { ResponseValidator } from "../../core/modelRouter.js";
const TEST_SPEC = {
    name: "test-model",
    provider: "mock",
    type: "mock",
    env: "",
    apiBase: "",
    supports: {
        chat: true,
        toolCalls: true,
        vision: true,
        streaming: true,
        embeddings: true
    }
};
export class FireDrillHarness {
    mockProvider;
    results = [];
    constructor(mockProvider) {
        this.mockProvider = mockProvider;
    }
    async runAll() {
        this.results = [];
        await this.d1_internalError();
        await this.d2_timeout();
        await this.d3_malformedJson();
        await this.d4_emptyResponse();
        await this.d5_driftedResponse();
        await this.d6_capabilityMismatch();
        return this.results;
    }
    async d1_internalError() {
        const drill = { name: "D-1", mode: "500_error", passed: false };
        try {
            this.mockProvider.simulate({ type: "500" });
            await this.mockProvider.callChat(TEST_SPEC, { model: "test-model", messages: [] });
        }
        catch (err) {
            drill.error = err.message;
            drill.passed = true;
        }
        this.results.push(drill);
    }
    async d2_timeout() {
        const drill = { name: "D-2", mode: "timeout", passed: false };
        try {
            this.mockProvider.simulate({ type: "timeout", delayMs: 100 });
            await this.mockProvider.callChat(TEST_SPEC, { model: "test-model", messages: [] });
        }
        catch (err) {
            drill.error = err.message;
            drill.passed = true;
        }
        this.results.push(drill);
    }
    async d3_malformedJson() {
        const drill = { name: "D-3", mode: "malformed_json", passed: false };
        try {
            this.mockProvider.simulate({ type: "malformed" });
            await this.mockProvider.callChat(TEST_SPEC, { model: "test-model", messages: [] });
        }
        catch (err) {
            drill.error = err.message;
            drill.passed = true;
        }
        this.results.push(drill);
    }
    async d4_emptyResponse() {
        const drill = { name: "D-4", mode: "empty_response", passed: false };
        try {
            this.mockProvider.simulate({ type: "empty" });
            const result = await this.mockProvider.callChat(TEST_SPEC, { model: "test-model", messages: [] });
            const isValid = ResponseValidator.validateText(result.text);
            drill.passed = !isValid.valid;
        }
        catch (err) {
            drill.error = err.message;
        }
        this.results.push(drill);
    }
    async d5_driftedResponse() {
        const drill = { name: "D-5", mode: "drifted_response", passed: false };
        try {
            this.mockProvider.simulate({ type: "drift" });
            const result = await this.mockProvider.callChat(TEST_SPEC, { model: "test-model", messages: [] });
            drill.passed = !!result && result.text !== "OK response";
        }
        catch (err) {
            drill.error = err.message;
        }
        this.results.push(drill);
    }
    async d6_capabilityMismatch() {
        const drill = { name: "D-6", mode: "capability_mismatch", passed: false };
        try {
            this.mockProvider.simulate({ type: "capability_mismatch" });
            const payload = {
                model: "test-model",
                messages: [],
                requires: { vision: true }
            };
            const spec = { ...TEST_SPEC, supports: { ...TEST_SPEC.supports, vision: false } };
            const result = await this.mockProvider.callChat(spec, payload);
            const isValid = ResponseValidator.validateCapability(result.raw, payload.requires, spec);
            drill.passed = !isValid.valid;
        }
        catch (err) {
            drill.error = err.message;
        }
        this.results.push(drill);
    }
    getResults() {
        return this.results;
    }
    getSummary() {
        const passed = this.results.filter((r) => r.passed).length;
        return {
            total: this.results.length,
            passed,
            failed: this.results.length - passed,
            passRate: ((passed / this.results.length) * 100).toFixed(1) + "%"
        };
    }
}
//# sourceMappingURL=fire-drill-harness.js.map