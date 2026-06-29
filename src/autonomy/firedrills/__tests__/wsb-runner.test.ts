/**
 * WS-B Runner Test Suite
 * Validates all four canary gating scenarios execute and pass
 */

import { runWSBValidation, formatWSBReport } from "../wsb-runner";
import * as b1 from "../scenario-b-burnrate-spike";
import * as b2 from "../scenario-b-latency-regression";
import * as b3 from "../scenario-b-error-rate-drift";
import * as b4 from "../scenario-b-saturation";

jest.mock("../scenario-b-burnrate-spike");
jest.mock("../scenario-b-latency-regression");
jest.mock("../scenario-b-error-rate-drift");
jest.mock("../scenario-b-saturation");
jest.mock("../../../slo-controller/enforcement-integration");

describe("WS-B Validation Runner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("wsb validation runs all four scenarios", async () => {
    (b1.runBurnRateSpikeFireDrill as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 187,
      duration: 1000,
    });

    (b2.runLatencyRegressionGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 200,
    });

    (b3.runErrorRateDriftGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 220,
    });

    (b4.runSaturationGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 195,
    });

    const report = await runWSBValidation();

    expect(report.scenarios.B1.passed).toBe(true);
    expect(report.scenarios.B2.passed).toBe(true);
    expect(report.scenarios.B3.passed).toBe(true);
    expect(report.scenarios.B4.passed).toBe(true);
    expect(report.passCount).toBe(4);
    expect(report.failCount).toBe(0);
    expect(report.pass).toBe(true);
  });

  test("wsb fails if any scenario exceeds rollback SLA", async () => {
    (b1.runBurnRateSpikeFireDrill as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 187,
      duration: 1000,
    });

    (b2.runLatencyRegressionGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 350, // Exceeds 300ms SLA
    });

    (b3.runErrorRateDriftGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 220,
    });

    (b4.runSaturationGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 195,
    });

    const report = await runWSBValidation();

    expect(report.scenarios.B2.passed).toBe(false);
    expect(report.failCount).toBe(1);
    expect(report.pass).toBe(false);
    expect(report.criticalFailures.length).toBeGreaterThan(0);
  });

  test("wsb fails if abort not triggered", async () => {
    (b1.runBurnRateSpikeFireDrill as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: false,
      rollbackCompleted: false,
      rollbackMs: null,
      duration: 1000,
    });

    (b2.runLatencyRegressionGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 200,
    });

    (b3.runErrorRateDriftGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 220,
    });

    (b4.runSaturationGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 195,
    });

    const report = await runWSBValidation();

    expect(report.scenarios.B1.passed).toBe(false);
    expect(report.pass).toBe(false);
  });

  test("wsb report formats correctly", async () => {
    (b1.runBurnRateSpikeFireDrill as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 187,
      duration: 1000,
    });

    (b2.runLatencyRegressionGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 200,
    });

    (b3.runErrorRateDriftGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 220,
    });

    (b4.runSaturationGate as jest.Mock).mockResolvedValue({
      startedAt: Date.now(),
      completedAt: Date.now() + 1000,
      abortTriggered: true,
      rollbackCompleted: true,
      rollbackMs: 195,
    });

    const report = await runWSBValidation();
    const formatted = formatWSBReport(report);

    expect(formatted).toContain("WS-B CANARY-GATES:B VALIDATION REPORT");
    expect(formatted).toContain("B1:");
    expect(formatted).toContain("B2:");
    expect(formatted).toContain("B3:");
    expect(formatted).toContain("B4:");
    expect(formatted).toContain("Pass Count:     4/4");
    expect(formatted).toContain("✅ PASS");
  });
});
