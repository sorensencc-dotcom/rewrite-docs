// src/cic-runtime/drift/embedding-model.ts

import crypto from "crypto";

/**
 * Minimal local embedding model wrapper.
 * Uses deterministic pseudo-random vectors for Sandbox‑2.
 * Sandbox‑3 (S3) uses seeded deterministic mode.
 */
class LocalEmbeddingModel {
  private seed: number | null;

  constructor(seed: number | null = null) {
    this.seed = seed;
  }

  /**
   * Produce a deterministic embedding vector for a given string.
   * This is a stub for Sandbox‑2; Sandbox‑3 will replace with ONNX model.
   */
  async embed(text: string): Promise<number[]> {
    const hash = crypto
      .createHash("sha256")
      .update(text + (this.seed ?? ""))
      .digest();

    // Convert hash bytes → float vector
    const vector = Array.from(hash).map(b => (b / 255) * 2 - 1);

    return vector;
  }
}

/**
 * Load embedding model.
 * If deterministicSeed is provided → deterministic mode (S3).
 */
export async function getEmbeddingModel(
  deterministicSeed?: number
): Promise<LocalEmbeddingModel> {
  return new LocalEmbeddingModel(deterministicSeed ?? null);
}
