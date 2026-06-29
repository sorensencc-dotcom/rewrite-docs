import { sloController } from "./slo-controller";
import { EnforcementEngine } from "./enforcement-engine";
import { SLOViolationEvent } from "./types";
import { canaryEventBus } from "./canary-signals";

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

  private async handleViolation(_event: SLOViolationEvent): Promise<void> {
    // Hook for violation tracking (connects to audit log)
  }

  getStatus() {
    return {
      running: this.evaluationTimer !== null,
      timestamp: Date.now(),
    };
  }
}

export const enforcementIntegration = new EnforcementIntegration();
