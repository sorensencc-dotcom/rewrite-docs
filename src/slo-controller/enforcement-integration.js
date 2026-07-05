import { sloController } from "./slo-controller";
import { EnforcementEngine } from "./enforcement-engine";
import { canaryEventBus } from "./canary-signals";
export class EnforcementIntegration {
    sloController = sloController;
    enforcementEngine;
    evaluationIntervalMs = 1000;
    evaluationTimer = null;
    constructor() {
        this.enforcementEngine = new EnforcementEngine(this.sloController);
        this.sloController.onViolation((event) => this.handleViolation(event));
        canaryEventBus.onAbort(() => {
            // Signal listener for abort tracking
        });
        canaryEventBus.onRollbackComplete(() => {
            // Signal listener for rollback completion tracking
        });
    }
    async start() {
        this.evaluationTimer = setInterval(async () => {
            await this.enforcementEngine.enforce();
        }, this.evaluationIntervalMs);
    }
    stop() {
        if (this.evaluationTimer) {
            clearInterval(this.evaluationTimer);
            this.evaluationTimer = null;
        }
    }
    async handleViolation(event) {
        try {
            // Classify violation based on severity
            const violationClass = this.classifyViolation(event);
            // Emit governance violation event
            canaryEventBus.emit("violation", {
                type: "violation",
                timestamp: Date.now(),
                sloId: event.sloId,
                severity: event.severity,
                violationClass,
            });
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : "unknown error";
            console.error("[enforcement-integration] violation handling failed:", errorMsg);
            // Do not rethrow — violation handling must not block enforcement
        }
    }
    classifyViolation(event) {
        if (event.severity === "critical") {
            return event.burnRate > 10 ? "hard_violation_runtime" : "hard_violation_structural";
        }
        return "soft_violation_minor";
    }
    getStatus() {
        return {
            running: this.evaluationTimer !== null,
            timestamp: Date.now(),
        };
    }
}
export const enforcementIntegration = new EnforcementIntegration();
//# sourceMappingURL=enforcement-integration.js.map