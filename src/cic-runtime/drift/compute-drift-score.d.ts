/**
 * Compute drift score using embedding model.
 * S3 uses deterministic seed for reproducibility.
 */
export declare function computeDriftScore(modelOutput: string, executionOutput: string, deterministicSeed?: number): Promise<number>;
//# sourceMappingURL=compute-drift-score.d.ts.map