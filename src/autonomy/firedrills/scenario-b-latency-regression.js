/**
 * WS-B Scenario B2: Latency Regression Gate
 * Injects p99 latency above SLO threshold, verifies abort + rollback
 */
import { sloController } from "../../slo-controller/slo-controller";
import { canaryEventBus } from "../../slo-controller/canary-signals";
let latencyRollbackMs = null;
canaryEventBus.onRollbackComplete((signal) => {
    const rollbackStart = signal.context?.rollbackStart ?? signal.timestamp;
    latencyRollbackMs = signal.timestamp - rollbackStart;
});
export async function runLatencyRegressionGate() {
    const startedAt = Date.now();
    latencyRollbackMs = null;
    // Inject latency: p99 = 800ms (6.6x SLO threshold of 120ms)
    sloController.setMetrics({
        slo_latency_p99_ms: 800,
        slo_latency_p95_ms: 500,
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
        rollbackCompleted: latencyRollbackMs !== null,
        rollbackMs: latencyRollbackMs,
    };
}
//# sourceMappingURL=scenario-b-latency-regression.js.map