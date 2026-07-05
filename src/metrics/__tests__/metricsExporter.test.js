// src/metrics/__tests__/metricsExporter.test.ts
import { describe, test, expect, beforeEach } from "@jest/globals";
import { metricsExporter } from "../MetricsExporter.js";
describe("metricsExporter", () => {
    beforeEach(() => {
        metricsExporter.reset();
    });
    test("increments counters", () => {
        metricsExporter.increment("cic_adapter_calls_total", { adapter: "bookstack" });
        metricsExporter.increment("cic_adapter_calls_total", { adapter: "bookstack" });
        const value = metricsExporter.get("cic_adapter_calls_total", { adapter: "bookstack" });
        expect(value).toBe(2);
    });
    test("observes durations", () => {
        metricsExporter.observe("cic_adapter_duration_ms", 42, { adapter: "bookstack" });
        const samples = metricsExporter.getAll("cic_adapter_duration_ms");
        expect(samples.length).toBe(1);
        expect(samples[0].value).toBe(42);
    });
    test("labels are isolated", () => {
        metricsExporter.increment("cic_adapter_calls_total", { adapter: "bookstack" });
        metricsExporter.increment("cic_adapter_calls_total", { adapter: "tika" });
        const bookstack = metricsExporter.get("cic_adapter_calls_total", { adapter: "bookstack" });
        const tika = metricsExporter.get("cic_adapter_calls_total", { adapter: "tika" });
        expect(bookstack).toBe(1);
        expect(tika).toBe(1);
    });
});
//# sourceMappingURL=metricsExporter.test.js.map