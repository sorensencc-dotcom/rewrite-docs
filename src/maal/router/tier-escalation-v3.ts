import { StabilityRouterV3 } from './stability-router-v3';
import { LatencyAwareRouter } from './latency-aware-router';
import { ReproducibilityRouter } from './reproducibility-router';

export type SandboxTier = 'S1' | 'S2' | 'S3';

export class TierEscalationV3 {
  private stabilityRouter = new StabilityRouterV3();
  private latencyRouter: LatencyAwareRouter;
  private reproRouter = new ReproducibilityRouter();

  constructor(sloBudgetMs: number) {
    this.latencyRouter = new LatencyAwareRouter(sloBudgetMs);
  }

  determineTier(
    baseTier: SandboxTier,
    driftScore: number,
    historicalP99: number,
    historicalReproScore: number
  ): { targetTier: SandboxTier, escalationReasons: string[] } {
    const reasons: string[] = [];

    const stability = this.stabilityRouter.evaluate(driftScore);
    if (stability.requiresEscalation) reasons.push(stability.reason);

    const latency = this.latencyRouter.evaluate(historicalP99);
    if (latency.requiresEscalation) reasons.push(latency.reason);

    const repro = this.reproRouter.evaluate(historicalReproScore);
    if (repro.requiresEscalation) reasons.push(repro.reason);

    // If there is ANY reason to escalate, we force S3 (Firecracker) isolation.
    // If we are already at S3, we stay at S3.
    let targetTier = baseTier;
    if (reasons.length > 0) {
      targetTier = 'S3';
    }

    return {
      targetTier,
      escalationReasons: reasons
    };
  }
}
