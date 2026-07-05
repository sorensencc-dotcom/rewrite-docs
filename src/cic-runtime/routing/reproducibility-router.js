export class ReproducibilityRouter {
    evaluate(historicalReproScore) {
        if (historicalReproScore < 0.9) {
            return { requiresEscalation: true, reason: 'LOW_REPRODUCIBILITY_CONFIDENCE' };
        }
        return { requiresEscalation: false, reason: 'HIGH_REPRODUCIBILITY' };
    }
}
//# sourceMappingURL=reproducibility-router.js.map