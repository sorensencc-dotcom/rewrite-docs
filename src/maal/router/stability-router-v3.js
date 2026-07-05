import { DRIFT_HIGH, DRIFT_MED } from '../../cic-runtime/drift/drift-thresholds';
export function computeStabilityPenalty(driftScore) {
    if (driftScore >= DRIFT_HIGH)
        return 100;
    if (driftScore >= DRIFT_MED)
        return 50;
    return 0;
}
export class StabilityRouterV3 {
    evaluate(driftScore) {
        const penalty = computeStabilityPenalty(driftScore);
        return {
            requiresEscalation: penalty >= 100,
            penaltyScore: penalty,
            reason: penalty >= 100 ? 'CRITICAL_DRIFT' : penalty >= 50 ? 'WARNING_DRIFT' : 'STABLE'
        };
    }
}
//# sourceMappingURL=stability-router-v3.js.map