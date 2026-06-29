export class ModelScoringV3 {
  static computeTrustScore(
    driftScore: number,
    sloViolationRate: number,
    reproScore: number
  ): number {
    let score = 100;
    
    if (driftScore > 0.3) score -= 40;
    else if (driftScore > 0.1) score -= 20;

    if (sloViolationRate > 0.05) score -= 30;
    else if (sloViolationRate > 0.01) score -= 10;

    if (reproScore < 0.95) score -= (1.0 - reproScore) * 100;

    return Math.max(0, Math.floor(score));
  }
}
