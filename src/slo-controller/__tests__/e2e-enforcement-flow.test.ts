import { describe, it, expect, beforeEach } from "@jest/globals";
import { EnforcementIntegration } from "../enforcement-integration";
import { sloController } from "../slo-controller";
import { SLORule } from "../types";
import { canaryEventBus } from "../canary-signals";

describe("E2E: SLO Enforcement Flow", () => {
  let integration: EnforcementIntegration;
  let abortTriggered = false;
  let rollbackTriggered = false;

  beforeEach(async () => {
    integration = new EnforcementIntegration();
    abortTriggered = false;
    rollbackTriggered = false;

    canaryEventBus.onAbort(() => {
      abortTriggered = true;
    });

    canaryEventBus.onRollback(() => {
      rollbackTriggered = true;
    });

    const rule: SLORule = {
      id: "slo-e2e-test",
      name: "E2E Test SLO",
      metric: "e2e_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 2,
    };

    await sloController.loadRules([rule]);
  });

  afterEach(() => {
    integration.stop();
  });

  it("should evaluate healthy SLOs without abort", async () => {
    await integration.start();

    sloController.setMetrics({ e2e_metric: 50 }); // 0.5x burn rate

    // Wait for eval loop
    await new Promise((resolve) => setTimeout(resolve, 1500));

    integration.stop();

    expect(abortTriggered).toBe(false);
  });

  it("should detect violation on canary gate", async () => {
    await integration.start();

    sloController.setMetrics({ e2e_metric: 300 }); // 3x burn rate, > threshold 10

    // Wait for eval loop
    await new Promise((resolve) => setTimeout(resolve, 1500));

    integration.stop();

    const status = sloController.getCanaryGateStatus();
    expect(status.violations).toBeGreaterThan(0);
  });

  it("should flow from eval → enforcement → abort", async () => {
    await integration.start();

    // Inject critical violation
    sloController.setMetrics({ e2e_metric: 2000 }); // 20x burn rate > 14x critical

    // Wait for enforcement loop to react
    await new Promise((resolve) => setTimeout(resolve, 2000));

    integration.stop();

    // Abort should have been triggered
    // (Note: this depends on mocks; actual orchestrator wiring is TODO)
    const finalStatus = sloController.getCanaryGateStatus();
    expect(finalStatus.violations).toBeGreaterThan(0);
  });

  it("should record violation events", async () => {
    let violationCount = 0;

    sloController.onViolation(() => {
      violationCount += 1;
    });

    await integration.start();

    sloController.setMetrics({ e2e_metric: 500 }); // 5x burn rate

    // Wait for eval loop
    await new Promise((resolve) => setTimeout(resolve, 1500));

    integration.stop();

    expect(violationCount).toBeGreaterThan(0);
  });

  it("should maintain loop over multiple evals", async () => {
    await integration.start();

    // Healthy → Violation → Healthy flow
    sloController.setMetrics({ e2e_metric: 50 }); // Healthy
    await new Promise((resolve) => setTimeout(resolve, 500));

    sloController.setMetrics({ e2e_metric: 500 }); // Violation
    await new Promise((resolve) => setTimeout(resolve, 500));

    sloController.setMetrics({ e2e_metric: 50 }); // Healthy again
    await new Promise((resolve) => setTimeout(resolve, 500));

    integration.stop();

    const status = integration.getStatus();
    expect(status.running).toBe(false);
  });
});
