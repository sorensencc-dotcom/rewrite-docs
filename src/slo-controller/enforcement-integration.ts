import { sloController } from "./slo-controller";
import { EnforcementEngine } from "./enforcement-engine";
import { SLOViolationEvent } from "./types";
import { canaryEventBus } from "./canary-signals";
import { pgQuery } from "../cic-runtime/audit-log/postgres-client";

type ViolationClass =
  | "soft_violation_minor"
  | "soft_violation_major"
  | "hard_violation_structural"
  | "hard_violation_runtime";

export class EnforcementIntegration {
  private sloController = sloController;
  private enforcementEngine: EnforcementEngine;
  private evaluationIntervalMs = 1000;
  private evaluationTimer: any = null;

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

  async start(): Promise<void> {
    this.evaluationTimer = setInterval(async () => {
      await this.enforcementEngine.enforce();
    }, this.evaluationIntervalMs);
  }

  stop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
  }

  private async handleViolation(event: SLOViolationEvent): Promise<void> {
    try {
      // Classify violation based on severity
      const violationClass = this.classifyViolation(event);

      // Emit governance violation event
      canaryEventBus.emit("status_check", {
        type: "status_check" as const,
        timestamp: Date.now(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "unknown error";
      console.error("[enforcement-integration] violation handling failed:", errorMsg);
      // Do not rethrow — violation handling must not block enforcement
    }
  }

  private classifyViolation(event: SLOViolationEvent): ViolationClass {
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
