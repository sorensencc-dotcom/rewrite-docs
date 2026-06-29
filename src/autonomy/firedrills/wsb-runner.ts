/**
 * WS-B Canary-Gates:B Validation Runner
 * Executes all four canary gating scenarios (B1-B4) with unified reporting
 * Validates SLO enforcement, burn-rate detection, and rollback SLA compliance
 */

import { runBurnRateSpikeFireDrill } from "./scenario-b-burnrate-spike";
import { runLatencyRegressionGate } from "./scenario-b-latency-regression";
import { runErrorRateDriftGate } from "./scenario-b-error-rate-drift";
import { runSaturationGate } from "./scenario-b-saturation";
import { enforcementIntegration } from "../../slo-controller/enforcement-integration";
import { sloController } from "../../slo-controller/slo-controller";
import { SLORule } from "../../slo-controller/types";

export interface ScenarioResult {
  name: string;
  passed: boolean;
  abortTriggered: boolean;
  rollbackCompleted: boolean;
  rollbackMs: number | null;
  violations: number;
  timestamp: number;
  error?: string;
}

export interface WSBReport {
  startedAt: number;
  completedAt: number;
  duration: number;
  scenarios: {
    B1: ScenarioResult;
    B2: ScenarioResult;
    B3: ScenarioResult;
    B4: ScenarioResult;
  };
  passCount: number;
  failCount: number;
  pass: boolean;
  criticalFailures: string[];
}

const ROLLBACK_SLA_MS = 300;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadWSBRules(): Promise<void> {
  const rules: SLORule[] = [
    {
      id: "slo-error-rate-1m",
      name: "Error Rate 1m",
      metric: "slo_error_rate_1m",
      target: 0.001,
      burnRateThreshold: 3,
    },
    {
      id: "slo-latency-p99",
      name: "P99 Latency",
      metric: "slo_latency_p99_ms",
      target: 120,
      burnRateThreshold: 1.25,
    },
    {
      id: "slo-error-rate-30m",
      name: "Error Rate 30m",
      metric: "slo_error_rate_30m",
      target: 0.001,
      burnRateThreshold: 3,
    },
    {
      id: "slo-cpu-saturation",
      name: "CPU Saturation",
      metric: "slo_cpu_usage",
      target: 0.15,
      burnRateThreshold: 5,
    },
  ];

  await sloController.loadRules(rules);
}

export async function runWSBValidation(): Promise<WSBReport> {
  const startedAt = Date.now();
  const criticalFailures: string[] = [];
  const scenarios: Record<string, ScenarioResult> = {};

  // Load SLO rules for WS-B validation
  await loadWSBRules();

  // Ensure enforcement loop is running
  await enforcementIntegration.start();
  await sleep(500);

  try {
    // B1: Burn-Rate Spike Gate
    const b1Report = await runBurnRateSpikeFireDrill();
    scenarios.B1 = {
      name: "Burn-Rate Spike Gate",
      passed:
        b1Report.abortTriggered &&
        b1Report.rollbackCompleted &&
        (b1Report.rollbackMs ?? 301) <= ROLLBACK_SLA_MS,
      abortTriggered: b1Report.abortTriggered,
      rollbackCompleted: b1Report.rollbackCompleted,
      rollbackMs: b1Report.rollbackMs,
      violations: b1Report.abortTriggered ? 1 : 0,
      timestamp: b1Report.completedAt,
    };
    if (!scenarios.B1.passed) {
      criticalFailures.push(
        `B1 failed: abort=${b1Report.abortTriggered}, rollbackMs=${b1Report.rollbackMs}`
      );
    }

    await sleep(1000);

    // B2: Latency Regression Gate
    const b2Report = await runLatencyRegressionGate();
    scenarios.B2 = {
      name: "Latency Regression Gate",
      passed:
        b2Report.abortTriggered &&
        b2Report.rollbackCompleted &&
        (b2Report.rollbackMs ?? 301) <= ROLLBACK_SLA_MS,
      abortTriggered: b2Report.abortTriggered,
      rollbackCompleted: b2Report.rollbackCompleted,
      rollbackMs: b2Report.rollbackMs,
      violations: b2Report.abortTriggered ? 1 : 0,
      timestamp: b2Report.completedAt,
    };
    if (!scenarios.B2.passed) {
      criticalFailures.push(
        `B2 failed: abort=${b2Report.abortTriggered}, rollbackMs=${b2Report.rollbackMs}`
      );
    }

    await sleep(1000);

    // B3: Error-Rate Drift Gate
    const b3Report = await runErrorRateDriftGate();
    scenarios.B3 = {
      name: "Error-Rate Drift Gate",
      passed:
        b3Report.abortTriggered &&
        b3Report.rollbackCompleted &&
        (b3Report.rollbackMs ?? 301) <= ROLLBACK_SLA_MS,
      abortTriggered: b3Report.abortTriggered,
      rollbackCompleted: b3Report.rollbackCompleted,
      rollbackMs: b3Report.rollbackMs,
      violations: b3Report.abortTriggered ? 1 : 0,
      timestamp: b3Report.completedAt,
    };
    if (!scenarios.B3.passed) {
      criticalFailures.push(
        `B3 failed: abort=${b3Report.abortTriggered}, rollbackMs=${b3Report.rollbackMs}`
      );
    }

    await sleep(1000);

    // B4: Saturation Gate
    const b4Report = await runSaturationGate();
    scenarios.B4 = {
      name: "Saturation Gate",
      passed:
        b4Report.abortTriggered &&
        b4Report.rollbackCompleted &&
        (b4Report.rollbackMs ?? 301) <= ROLLBACK_SLA_MS,
      abortTriggered: b4Report.abortTriggered,
      rollbackCompleted: b4Report.rollbackCompleted,
      rollbackMs: b4Report.rollbackMs,
      violations: b4Report.abortTriggered ? 1 : 0,
      timestamp: b4Report.completedAt,
    };
    if (!scenarios.B4.passed) {
      criticalFailures.push(
        `B4 failed: abort=${b4Report.abortTriggered}, rollbackMs=${b4Report.rollbackMs}`
      );
    }
  } finally {
    enforcementIntegration.stop();
  }

  const completedAt = Date.now();
  const duration = completedAt - startedAt;

  const passCount = Object.values(scenarios).filter((s) => s.passed).length;
  const failCount = Object.values(scenarios).filter((s) => !s.passed).length;

  return {
    startedAt,
    completedAt,
    duration,
    scenarios: scenarios as any,
    passCount,
    failCount,
    pass: failCount === 0 && criticalFailures.length === 0,
    criticalFailures,
  };
}

export function formatWSBReport(report: WSBReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("  WS-B CANARY-GATES:B VALIDATION REPORT");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(`Started:    ${new Date(report.startedAt).toISOString()}`);
  lines.push(`Completed:  ${new Date(report.completedAt).toISOString()}`);
  lines.push(`Duration:   ${report.duration}ms`);
  lines.push("");
  lines.push("SCENARIO RESULTS:");
  lines.push("───────────────────────────────────────────────────────────────");

  for (const [key, scenario] of Object.entries(report.scenarios)) {
    const status = scenario.passed ? "✅ PASS" : "❌ FAIL";
    lines.push(
      `${key}: ${status} | Abort: ${scenario.abortTriggered} | Rollback: ${scenario.rollbackMs ?? "N/A"}ms`
    );
  }

  lines.push("");
  lines.push("SUMMARY:");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push(`Pass Count:     ${report.passCount}/4`);
  lines.push(`Fail Count:     ${report.failCount}/4`);
  lines.push(`Overall Status: ${report.pass ? "✅ PASS" : "❌ FAIL"}`);

  if (report.criticalFailures.length > 0) {
    lines.push("");
    lines.push("CRITICAL FAILURES:");
    lines.push("───────────────────────────────────────────────────────────────");
    for (const failure of report.criticalFailures) {
      lines.push(`  • ${failure}`);
    }
  }

  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");

  return lines.join("\n");
}
