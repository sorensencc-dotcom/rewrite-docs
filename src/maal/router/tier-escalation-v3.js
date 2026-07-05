import { StabilityRouterV3 } from './stability-router-v3';
import { LatencyAwareRouter } from './latency-aware-router';
import { ReproducibilityRouter } from './reproducibility-router';
export class TierEscalationV3 {
    stabilityRouter = new StabilityRouterV3();
    latencyRouter;
    reproRouter = new ReproducibilityRouter();
    constructor(sloBudgetMs) {
        this.latencyRouter = new LatencyAwareRouter(sloBudgetMs);
    }
    determineTier(baseTier, driftScore, historicalP99, historicalReproScore) {
        const reasons = [];
        const stability = this.stabilityRouter.evaluate(driftScore);
        if (stability.requiresEscalation)
            reasons.push(stability.reason);
        const latency = this.latencyRouter.evaluate(historicalP99);
        if (latency.requiresEscalation)
            reasons.push(latency.reason);
        const repro = this.reproRouter.evaluate(historicalReproScore);
        if (repro.requiresEscalation)
            reasons.push(repro.reason);
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
//# sourceMappingURL=tier-escalation-v3.js.map