import { describe, it, expect, beforeEach } from "@jest/globals";
import { FireDrillHarness } from "./fire-drill-harness.js";
import { MockProvider } from "../mocks/mockProvider.js";
describe("D-Phase: Offline Fire-Drill Harness", () => {
    let mockProvider;
    let harness;
    beforeEach(() => {
        mockProvider = new MockProvider();
        harness = new FireDrillHarness(mockProvider);
    });
    it("D-1: Provider returns 500 error", async () => {
        mockProvider.simulate({ type: "500" });
        const results = await harness.runAll();
        const d1 = results.find((r) => r.name === "D-1");
        expect(d1).toBeDefined();
        expect(d1?.mode).toBe("500_error");
    });
    it("D-2: Provider timeout", async () => {
        mockProvider.simulate({ type: "timeout" });
        const results = await harness.runAll();
        const d2 = results.find((r) => r.name === "D-2");
        expect(d2).toBeDefined();
        expect(d2?.mode).toBe("timeout");
    });
    it("D-3: Malformed JSON response", async () => {
        mockProvider.simulate({ type: "malformed" });
        const results = await harness.runAll();
        const d3 = results.find((r) => r.name === "D-3");
        expect(d3).toBeDefined();
        expect(d3?.mode).toBe("malformed_json");
    });
    it("D-4: Empty response", async () => {
        mockProvider.simulate({ type: "empty" });
        const results = await harness.runAll();
        const d4 = results.find((r) => r.name === "D-4");
        expect(d4).toBeDefined();
        expect(d4?.mode).toBe("empty_response");
    });
    it("D-5: Drifted response", async () => {
        mockProvider.simulate({ type: "drift" });
        const results = await harness.runAll();
        const d5 = results.find((r) => r.name === "D-5");
        expect(d5).toBeDefined();
        expect(d5?.mode).toBe("drifted_response");
    });
    it("D-6: Capability mismatch", async () => {
        mockProvider.simulate({ type: "capability_mismatch" });
        const results = await harness.runAll();
        const d6 = results.find((r) => r.name === "D-6");
        expect(d6).toBeDefined();
        expect(d6?.mode).toBe("capability_mismatch");
    });
    it("All 6 fire-drills complete without hanging", async () => {
        const results = await harness.runAll();
        expect(results).toHaveLength(6);
        results.forEach((r) => {
            expect(r.name).toMatch(/D-[1-6]/);
            expect(typeof r.passed).toBe("boolean");
        });
    });
    it("D-phase summary reports accurate pass/fail counts", async () => {
        mockProvider.simulate({ type: "ok" });
        await harness.runAll();
        const summary = harness.getSummary();
        expect(summary.total).toBe(6);
        expect(summary.passRate).toBeDefined();
    });
    it("Fallback chain is deterministic across runs", async () => {
        mockProvider.simulate({ type: "500" });
        const run1 = await harness.runAll();
        const run1Hash = JSON.stringify(run1);
        mockProvider.reset();
        mockProvider.simulate({ type: "500" });
        const run2 = await harness.runAll();
        const run2Hash = JSON.stringify(run2);
        expect(run1Hash).toBe(run2Hash);
    });
});
//# sourceMappingURL=d-phase.test.js.map