import { SLOController } from "./slo-controller";
import { BurnRateResult } from "./types";
import { triggerCanaryAbort } from "./canary-abort";
import { executeCanaryRollback } from "./canary-rollback";

export interface EnforcementAction {
  type: 'none' | 'abort' | 'rollback';
  reason: string;
  timestamp: number;
}

export class EnforcementEngine {
  private controller: SLOController;
  private criticalBurnRateThreshold = 14;
  private lastAbortTs = 0;
  private abortCooldownMs = 5000;

  constructor(controller: SLOController) {
    this.controller = controller;
    // Set critical threshold to 6x for canary gate tier (B-Phase SLO enforcement)
    this.criticalBurnRateThreshold = 6;
  }

  async enforce(): Promise<EnforcementAction> {
    const results = await this.controller.evaluate();

    for (const result of results) {
      if (result.isViolating && result.currentBurnRate > this.criticalBurnRateThreshold) {
        return await this.handleCriticalViolation(result);
      }
    }

    return { type: 'none', reason: 'all_slos_healthy', timestamp: Date.now() };
  }

  private async handleCriticalViolation(result: BurnRateResult): Promise<EnforcementAction> {
    const now = Date.now();

    if (now - this.lastAbortTs < this.abortCooldownMs) {
      return {
        type: 'none',
        reason: 'abort_cooldown_active',
        timestamp: now,
      };
    }

    this.lastAbortTs = now;

    await triggerCanaryAbort({
      reason: 'critical_burn_rate',
      sloId: result.sloId,
      burnRate: result.currentBurnRate,
      threshold: this.criticalBurnRateThreshold,
    });

    // TODO: Map sloId to proposalId via governance_config
    // For now, assume sloId is associated with proposal
    const rollbackResult = await executeCanaryRollback(result.sloId);

    if (rollbackResult.success && rollbackResult.completeMs <= 300) {
      return {
        type: 'rollback',
        reason: `burn_rate_${result.currentBurnRate.toFixed(2)}x`,
        timestamp: now,
      };
    } else {
      return {
        type: 'abort',
        reason: 'rollback_failed_or_slow',
        timestamp: now,
      };
    }
  }
}
