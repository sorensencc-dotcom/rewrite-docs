/**
 * Fire-Drill Manager: D-Phase Integration
 * Runs resilience tests against MAAL routing layer
 * Reports violations to SLO controller + governance layer
 */
import { FireDrillHarness } from "../../../src/tests/d-phase/fire-drill-harness.js";
import { MockProvider } from "../../../src/tests/mocks/mockProvider.js";
import { logEvent } from "../../../src/observability/events.js";
export class FireDrillManager {
    config;
    harness;
    lastReport = null;
    intervalHandle = null;
    constructor(config = { enabled: true, reportToSLO: true }) {
        this.config = config;
        const mockProvider = new MockProvider();
        this.harness = new FireDrillHarness(mockProvider);
    }
    async runDrills() {
        const startTime = Date.now();
        const results = await this.harness.runAll();
        const summary = this.harness.getSummary();
        const report = {
            timestamp: new Date(),
            totalDrills: summary.total,
            passedDrills: summary.passed,
            failedDrills: summary.failed,
            passRate: summary.passRate,
            violations: results.filter((r) => !r.passed),
            healthy: summary.passed === summary.total
        };
        this.lastReport = report;
        logEvent({
            eventName: "MODEL_CALL_SUCCESS",
            model: "FireDrillManager",
            agent: "D-Phase",
            latencyMs: Date.now() - startTime,
            error: report.healthy ? undefined : `${report.failedDrills} drills failed`,
            tokensUsed: { input: 0, output: 0 }
        });
        return report;
    }
    startSchedule(intervalMs) {
        if (this.intervalHandle)
            clearInterval(this.intervalHandle);
        this.intervalHandle = setInterval(async () => {
            await this.runDrills();
        }, intervalMs || this.config.runOnInterval || 3600000);
    }
    stopSchedule() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
    getLastReport() {
        return this.lastReport;
    }
    isHealthy() {
        return this.lastReport?.healthy ?? true;
    }
}
//# sourceMappingURL=FireDrillManager.js.map