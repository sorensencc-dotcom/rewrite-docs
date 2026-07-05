export class ReproducibilityRouter {
    evaluate(historicalReproScore) {
        // Score is 0.0 to 1.0 (1.0 = perfect repro match rate)
        if (historicalReproScore < 0.9) {
            return { requiresEscalation: true, reason: 'LOW_REPRODUCIBILITY_CONFIDENCE' };
        }
        return { requiresEscalation: false, reason: 'HIGH_REPRODUCIBILITY' };
    }
}
//# sourceMappingURL=reproducibility-router.js.map