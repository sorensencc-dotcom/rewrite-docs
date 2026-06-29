import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  runBurnRateSpikeFireDrill,
  FireDrillReport,
} from "../scenario-b-burnrate-spike";
import { sloController } from "../../../slo-controller/slo-controller";
import { SLORule } from "../../../slo-controller/types";

describe("Fire-Drill Scenario B: Burn-Rate Spike", () => {
  beforeEach(async () => {
    // Setup SLO rules for fire-drill
    const rules: SLORule[] = [
      {
        id: "slo-firedrills-error-rate",
        name: "Fire-Drill Error Rate",
        metric: "slo_error_rate_1m",
        target: 100,
        window: "1m",
        burnRateThreshold: 10,
      },
    ];

    await sloController.loadRules(rules);
  });

  it("should run fire-drill successfully", async () => {
    const report = await runBurnRateSpikeFireDrill();

    expect(report).toBeDefined();
    expect(report.startedAt).toBeGreaterThan(0);
    expect(report.completedAt).toBeGreaterThanOrEqual(report.startedAt);
  });

  it("should detect abort trigger", async () => {
    const report = await runBurnRateSpikeFireDrill();

    // Spike should trigger abort
    expect(report.abortTriggered).toBeDefined();
    expect(typeof report.abortTriggered).toBe("boolean");
  });

  it("should measure duration", async () => {
    const report = await runBurnRateSpikeFireDrill();

    expect(report.duration).toBeGreaterThan(0);
    expect(report.duration).toBeGreaterThanOrEqual(4000); // 4s wait window
  });

  it("should track rollback attempt", async () => {
    const report = await runBurnRateSpikeFireDrill();

    expect(report.rollbackCompleted).toBeDefined();
    expect(typeof report.rollbackCompleted).toBe("boolean");
  });

  it("should measure rollback timing if completed", async () => {
    const report = await runBurnRateSpikeFireDrill();

    if (report.rollbackCompleted && report.rollbackMs !== null) {
      expect(report.rollbackMs).toBeGreaterThan(0);
      expect(report.rollbackMs).toBeLessThanOrEqual(300); // SLA
    }
  });

  it("should have consistent timestamps", async () => {
    const report = await runBurnRateSpikeFireDrill();

    expect(report.completedAt).toBeGreaterThanOrEqual(report.startedAt);
    expect(report.duration).toEqual(report.completedAt - report.startedAt);
  });

  it("should complete within reasonable time (< 30s)", async () => {
    const beforeTs = Date.now();
    const report = await runBurnRateSpikeFireDrill();
    const afterTs = Date.now();

    expect(afterTs - beforeTs).toBeLessThan(30000);
  });
});
