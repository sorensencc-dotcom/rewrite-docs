// src/cic-runtime/drift/compute-drift-score.ts

import { getEmbeddingModel } from "./embedding-model";

/**
 * Compute cosine distance between two embedding vectors.
 */
function cosineDistance(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return 1 - dot / (magA * magB);
}

/**
 * Compute drift score using embedding model.
 * S3 uses deterministic seed for reproducibility.
 */
export async function computeDriftScore(
  modelOutput: string,
  executionOutput: string,
  deterministicSeed?: number
): Promise<number> {
  const model = await getEmbeddingModel(deterministicSeed);

  const embModel = await model.embed(modelOutput);
  const embExec = await model.embed(executionOutput);

  return cosineDistance(embModel, embExec);
}
