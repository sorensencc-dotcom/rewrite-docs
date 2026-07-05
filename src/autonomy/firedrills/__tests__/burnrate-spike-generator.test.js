import { describe, it, expect } from "@jest/globals";
import { generateBurnRateSpike } from "../burnrate-spike-generator";
describe("Burn-Rate Spike Generator", () => {
    it("should generate baseline metrics", async () => {
        const metrics = {};
        const callback = (m) => {
            Object.assign(metrics, m);
        };
        const config = {
            baseErrorRate: 0.001,
            windows: ["1m"],
        };
        await generateBurnRateSpike(callback, config);
        expect(metrics["slo_error_rate_1m"]).toBeDefined();
    });
    it("should apply spike multiplier", async () => {
        const metricsHistory = [];
        const callback = (m) => {
            metricsHistory.push({ ...m });
        };
        const config = {
            baseErrorRate: 0.001,
            spikeMultiplier: 5,
            windows: ["1m"],
        };
        await generateBurnRateSpike(callback, config);
        // Should have multiple snapshots: baseline, spike, ramp-down
        expect(metricsHistory.length).toBeGreaterThanOrEqual(2);
        // Check that spike is larger than baseline
        const baseline = metricsHistory[0]["slo_error_rate_1m"];
        const withSpike = metricsHistory[1]["slo_error_rate_1m"];
        expect(withSpike).toBeGreaterThan(baseline);
        expect(withSpike).toBe(baseline * 5);
    });
    it("should support multiple windows", async () => {
        const metrics = {};
        const callback = (m) => {
            Object.assign(metrics, m);
        };
        const config = {
            baseErrorRate: 0.001,
            windows: ["1m", "5m", "30m"],
        };
        await generateBurnRateSpike(callback, config);
        expect(metrics["slo_error_rate_1m"]).toBeDefined();
        expect(metrics["slo_error_rate_5m"]).toBeDefined();
        expect(metrics["slo_error_rate_30m"]).toBeDefined();
    });
    it("should respect hold time", async () => {
        const metricsHistory = [];
        const timestamps = [];
        const callback = (m) => {
            metricsHistory.push({ ...m });
            timestamps.push(Date.now());
        };
        const config = {
            baseErrorRate: 0.001,
            windows: ["1m"],
            holdTimeMs: 2000,
        };
        const beforeTs = Date.now();
        await generateBurnRateSpike(callback, config);
        const afterTs = Date.now();
        // Total duration should be >= 1000 (baseline) + 2000 (hold) + 2000 (ramp) = 5000
        expect(afterTs - beforeTs).toBeGreaterThanOrEqual(4000);
    });
    it("should ramp down to baseline", async () => {
        const metricsHistory = [];
        const callback = (m) => {
            metricsHistory.push({ ...m });
        };
        const config = {
            baseErrorRate: 0.001,
            windows: ["1m"],
            holdTimeMs: 1000,
            rampDownMs: 500,
        };
        await generateBurnRateSpike(callback, config);
        const firstMetric = metricsHistory[0]["slo_error_rate_1m"];
        const lastMetric = metricsHistory[metricsHistory.length - 1]["slo_error_rate_1m"];
        // Final should be close to baseline
        expect(lastMetric).toBeCloseTo(firstMetric, 5);
    });
    it("should use default config if not provided", async () => {
        const metrics = {};
        const callback = (m) => {
            Object.assign(metrics, m);
        };
        // No config passed
        await generateBurnRateSpike(callback);
        // Should have default windows
        expect(metrics["slo_error_rate_1m"]).toBeDefined();
        expect(metrics["slo_error_rate_5m"]).toBeDefined();
        expect(metrics["slo_error_rate_30m"]).toBeDefined();
    });
    it("should call callback multiple times", async () => {
        const callCount = { count: 0 };
        const callback = (_m) => {
            callCount.count += 1;
        };
        await generateBurnRateSpike(callback, {
            windows: ["1m"],
        });
        // Should call multiple times: baseline, spike, ramp
        expect(callCount.count).toBeGreaterThanOrEqual(2);
    });
});
//# sourceMappingURL=burnrate-spike-generator.test.js.map