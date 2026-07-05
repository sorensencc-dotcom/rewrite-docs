export declare class ModelScoringV3 {
    /**
     * Computes a unified trust score for a model instance based on all MAAL metrics.
     * Score ranges from 0 (Do Not Route) to 100 (Perfect Trust)
     */
    static computeTrustScore(driftScore: number, sloViolationRate: number, // 0.0 to 1.0
    reproScore: number): number;
}
//# sourceMappingURL=model-scoring-v3.d.ts.map