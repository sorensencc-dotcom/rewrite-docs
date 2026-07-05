/**
 * Minimal local embedding model wrapper.
 * Uses deterministic pseudo-random vectors for Sandbox‑2.
 * Sandbox‑3 (S3) uses seeded deterministic mode.
 */
declare class LocalEmbeddingModel {
    private seed;
    constructor(seed?: number | null);
    /**
     * Produce a deterministic embedding vector for a given string.
     * This is a stub for Sandbox‑2; Sandbox‑3 will replace with ONNX model.
     */
    embed(text: string): Promise<number[]>;
}
/**
 * Load embedding model.
 * If deterministicSeed is provided → deterministic mode (S3).
 */
export declare function getEmbeddingModel(deterministicSeed?: number): Promise<LocalEmbeddingModel>;
export {};
//# sourceMappingURL=embedding-model.d.ts.map