import { describe, it, expect, beforeEach } from "@jest/globals";
import { SLOController } from "../slo-controller";
import { SLORule, BurnRateResult } from "../types";

describe("SLOController", () => {
  let controller: SLOController;

  beforeEach(() => {
    controller = new SLOController();
  });

  it("should load SLO rules", async () => {
    const rules: SLORule[] = [
      {
        id: "slo-latency-p99",
        name: "P99 Latency",
        metric: "slo_latency_p99",
        target: 100,
        window: "5m",
        burnRateThreshold: 10,
      },
    ];

    await controller.loadRules(rules);
    // Rules are loaded internally, verify by evaluating
    const results = await controller.evaluate();
    expect(results).toHaveLength(1);
    expect(results[0].sloId).toBe("slo-latency-p99");
  });

  it("should set metrics", async () => {
    const rules: SLORule[] = [
      {
        id: "slo-error-rate",
        name: "Error Rate",
        metric: "slo_error_rate",
        target: 100,
        window: "1m",
        burnRateThreshold: 5,
      },
    ];

    await controller.loadRules(rules);
    controller.setMetrics({ slo_error_rate: 50 });

    const results = await controller.evaluate();
    expect(results[0].currentBurnRate).toBe(0.5);
  });

  it("should calculate burn rate", async () => {
    const rule: SLORule = {
      id: "slo-test",
      name: "Test SLO",
      metric: "test_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 10,
    };

    await controller.loadRules([rule]);
    controller.setMetrics({ test_metric: 500 });

    const results = await controller.evaluate();
    const result = results[0];

    expect(result.currentBurnRate).toBe(5);
    expect(result.threshold).toBe(10);
    expect(result.isViolating).toBe(false);
  });

  it("should detect SLO violations", async () => {
    const rule: SLORule = {
      id: "slo-critical",
      name: "Critical SLO",
      metric: "critical_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 2,
    };

    await controller.loadRules([rule]);
    controller.setMetrics({ critical_metric: 300 });

    const results = await controller.evaluate();
    const result = results[0];

    expect(result.currentBurnRate).toBe(3);
    expect(result.isViolating).toBe(true);
  });

  it("should emit violation events", async () => {
    const rule: SLORule = {
      id: "slo-test",
      name: "Test SLO",
      metric: "test_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 2,
    };

    let violationCaught = false;
    controller.onViolation((event) => {
      violationCaught = true;
      expect(event.sloId).toBe("slo-test");
      expect(event.severity).toBe("warning");
    });

    await controller.loadRules([rule]);
    controller.setMetrics({ test_metric: 250 });

    await controller.evaluate();
    expect(violationCaught).toBe(true);
  });

  it("should mark critical violations (2x threshold)", async () => {
    const rule: SLORule = {
      id: "slo-critical",
      name: "Critical SLO",
      metric: "critical_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 2,
    };

    let severity = "";
    controller.onViolation((event) => {
      severity = event.severity;
    });

    await controller.loadRules([rule]);
    // 5x burn rate = 2.5x threshold (2 * 2 = 4), so critical
    controller.setMetrics({ critical_metric: 500 });

    await controller.evaluate();
    expect(severity).toBe("critical");
  });

  it("should return canary gate status", async () => {
    const rules: SLORule[] = [
      {
        id: "slo-ok",
        name: "OK SLO",
        metric: "ok_metric",
        target: 100,
        window: "1m",
        burnRateThreshold: 5,
      },
      {
        id: "slo-bad",
        name: "Bad SLO",
        metric: "bad_metric",
        target: 100,
        window: "1m",
        burnRateThreshold: 2,
      },
    ];

    await controller.loadRules(rules);
    controller.setMetrics({
      ok_metric: 100, // 1x, passes
      bad_metric: 300, // 3x, violates (threshold 2)
    });

    const status = controller.getCanaryGateStatus();
    expect(status.passes).toBe(1);
    expect(status.violations).toBe(1);
  });

  it("should calculate remaining budget", async () => {
    const rule: SLORule = {
      id: "slo-budget",
      name: "Budget Test",
      metric: "budget_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 10,
    };

    await controller.loadRules([rule]);
    controller.setMetrics({ budget_metric: 30 });

    const results = await controller.evaluate();
    expect(results[0].remainingBudget).toBe(70);
  });
});
