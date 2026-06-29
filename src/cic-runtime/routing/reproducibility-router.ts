export class ReproducibilityRouter {
  evaluate(historicalReproScore: number) {
    if (historicalReproScore < 0.9) {
      return { requiresEscalation: true, reason: 'LOW_REPRODUCIBILITY_CONFIDENCE' };
    }
    return { requiresEscalation: false, reason: 'HIGH_REPRODUCIBILITY' };
  }
}
