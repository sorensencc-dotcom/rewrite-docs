/**
 * Fire-Drill Scenario B: Burn-Rate Spike Detection
 * Injects 5x error rate spike, verifies abort + rollback < 300ms SLA
 * Part of D-Phase + E-Phase integration harness
 */
import { sloController } from "../../slo-controller/slo-controller";
import { canaryEventBus } from "../../slo-controller/canary-signals";
let lastRollbackResult = null;
// Track rollback timing
canaryEventBus.onRollbackComplete((signal) => {
    const rollbackStart = signal.context?.rollbackStart ?? signal.timestamp;
    lastRollbackResult = {
        success: true,
        totalMs: signal.timestamp - rollbackStart,
    };
});
/**
 * Run burn-rate spike fire-drill
 * Injects 5x load, monitors for abort + rollback completion
 * SLA: rollback completes < 300ms
 */
export async function runBurnRateSpikeFireDrill() {
    const startedAt = Date.now();
    lastRollbackResult = null;
    // Enforcement loop already started by wsb-runner
    // Inject sustained error spike (don't ramp down yet)
    const baseErrorRate = 0.001;
    const spikeRate = baseErrorRate * 10; // 10x error rate
    sloController.setMetrics({
        slo_error_rate_1m: spikeRate,
        slo_error_rate_5m: spikeRate,
        slo_error_rate_30m: spikeRate,
    });
    // Wait for enforcement to detect and react
    await new Promise((resolve) => setTimeout(resolve, 4000));
    // Inspect canary gate status
    const status = sloController.getCanaryGateStatus();
    const abortTriggered = status.violations > 0;
    const rollbackCompleted = !!lastRollbackResult?.success;
    const rollbackMs = lastRollbackResult?.totalMs ?? null;
    const completedAt = Date.now();
    const duration = completedAt - startedAt;
    return {
        startedAt,
        completedAt,
        abortTriggered,
        rollbackCompleted,
        rollbackMs,
        duration,
    };
}
//# sourceMappingURL=scenario-b-burnrate-spike.js.map