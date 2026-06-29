export class ModelScoringV3 {
  /**
   * Computes a unified trust score for a model instance based on all MAAL metrics.
   * Score ranges from 0 (Do Not Route) to 100 (Perfect Trust)
   */
  static computeTrustScore(
    driftScore: number,
    sloViolationRate: number, // 0.0 to 1.0
    reproScore: number // 0.0 to 1.0
  ): number {
    let score = 100;
    
    // Penalize for drift
    if (driftScore > 0.3) score -= 40;
    else if (driftScore > 0.1) score -= 20;

    // Penalize for SLO violations
    if (sloViolationRate > 0.05) score -= 30;
    else if (sloViolationRate > 0.01) score -= 10;

    // Penalize for non-determinism
    if (reproScore < 0.95) score -= (1.0 - reproScore) * 100;

    return Math.max(0, Math.floor(score));
  }
}
