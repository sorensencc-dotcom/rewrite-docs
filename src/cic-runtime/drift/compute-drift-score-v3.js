import { ONNXEmbeddingModel } from './embedding-model-onnx';
import { embeddingCache } from './embedding-cache';
import { DRIFT_MED, DRIFT_HIGH } from './drift-thresholds';
const model = new ONNXEmbeddingModel();
function cosineDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
    }
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    if (magA === 0 || magB === 0) {
        throw new Error('Zero-magnitude embedding detected');
    }
    return 1 - (dot / (magA * magB));
}
export async function computeDriftScoreV3(expected, actual, seed) {
    let embExpected = embeddingCache.get(expected, seed);
    if (!embExpected) {
        embExpected = await model.embed(expected, seed);
        embeddingCache.set(expected, embExpected, seed);
    }
    let embActual = embeddingCache.get(actual, seed);
    if (!embActual) {
        embActual = await model.embed(actual, seed);
        embeddingCache.set(actual, embActual, seed);
    }
    const distance = cosineDistance(embExpected, embActual);
    return {
        score: distance,
        level: distance > DRIFT_HIGH ? 'high' : distance > DRIFT_MED ? 'medium' : 'low'
    };
}
//# sourceMappingURL=compute-drift-score-v3.js.map