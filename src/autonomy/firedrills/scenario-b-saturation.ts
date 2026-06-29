/**
 * WS-B Scenario B4: Saturation Gate
 * Injects CPU/Memory/Queue saturation, verifies abort + rollback
 */

import { sloController } from "../../slo-controller/slo-controller";
import { canaryEventBus } from "../../slo-controller/canary-signals";

export interface SaturationGateReport {
  startedAt: number;
  completedAt: number;
  abortTriggered: boolean;
  rollbackCompleted: boolean;
  rollbackMs: number | null;
}

let saturationRollbackMs: number | null = null;

canaryEventBus.onRollbackComplete((signal) => {
  const rollbackStart = signal.context?.rollbackStart ?? signal.timestamp;
  saturationRollbackMs = signal.timestamp - rollbackStart;
});

export async function runSaturationGate(): Promise<SaturationGateReport> {
  const startedAt = Date.now();
  saturationRollbackMs = null;

  // Inject saturation: CPU=0.95, Memory=0.92, Queue=0.88
  sloController.setMetrics({
    slo_cpu_usage: 0.95,
    slo_memory_usage: 0.92,
    slo_queue_depth: 0.88,
  });

  // Wait for enforcement to evaluate and react
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const status = sloController.getCanaryGateStatus();
  const abortTriggered = status.violations > 0;

  const completedAt = Date.now();

  return {
    startedAt,
    completedAt,
    abortTriggered,
    rollbackCompleted: saturationRollbackMs !== null,
    rollbackMs: saturationRollbackMs,
  };
}
