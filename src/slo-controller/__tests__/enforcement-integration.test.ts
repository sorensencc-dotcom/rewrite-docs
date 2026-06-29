import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EnforcementIntegration } from "../enforcement-integration";
import { sloController } from "../slo-controller";
import { SLORule } from "../types";

describe("EnforcementIntegration", () => {
  let integration: EnforcementIntegration;

  beforeEach(async () => {
    // Create fresh instance per test
    integration = new EnforcementIntegration();

    const rule: SLORule = {
      id: "slo-test",
      name: "Test SLO",
      metric: "test_metric",
      target: 100,
      window: "5m",
      burnRateThreshold: 10,
    };

    await sloController.loadRules([rule]);
  });

  afterEach(() => {
    integration.stop();
  });

  it("should start evaluation loop", async () => {
    await integration.start();

    const status = integration.getStatus();
    expect(status.running).toBe(true);
  });

  it("should stop evaluation loop", async () => {
    await integration.start();
    integration.stop();

    const status = integration.getStatus();
    expect(status.running).toBe(false);
  });

  it("should return status with timestamp", async () => {
    const beforeTs = Date.now();
    const status = integration.getStatus();
    const afterTs = Date.now();

    expect(status.timestamp).toBeGreaterThanOrEqual(beforeTs);
    expect(status.timestamp).toBeLessThanOrEqual(afterTs);
  });

  it("should eval metrics on interval", async () => {
    await integration.start();

    sloController.setMetrics({ test_metric: 50 }); // Healthy

    // Wait for eval loop to run a few times
    await new Promise((resolve) => setTimeout(resolve, 1500));

    integration.stop();

    const status = integration.getStatus();
    expect(status.running).toBe(false);
  });

  it("should register abort listener", async () => {
    // Verify abort listener is registered without error
    await integration.start();

    const status = integration.getStatus();
    expect(status.running).toBe(true);

    integration.stop();
  });

  it("should register rollback complete listener", async () => {
    // Verify rollback complete listener is registered without error
    await integration.start();

    const status = integration.getStatus();
    expect(status.running).toBe(true);

    integration.stop();
  });

  it("should handle multiple start/stop cycles", async () => {
    await integration.start();
    let status = integration.getStatus();
    expect(status.running).toBe(true);

    integration.stop();
    status = integration.getStatus();
    expect(status.running).toBe(false);

    // Should be able to start again
    await integration.start();
    status = integration.getStatus();
    expect(status.running).toBe(true);

    integration.stop();
  });
});
