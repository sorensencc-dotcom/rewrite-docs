import { computeDriftScoreV3 } from '../../cic-runtime/drift/compute-drift-score-v3';
import { preprocessText } from '../../cic-runtime/drift/deterministic-preprocess';
jest.mock('../../cic-runtime/drift/embedding-model-onnx', () => {
    return {
        ONNXEmbeddingModel: class {
            async load() { }
            async embed(text) {
                return [0.1, 0.2, 0.3];
            }
        }
    };
});
describe('ONNX Drift V3', () => {
    it('should apply deterministic preprocessing using seed', () => {
        const text1 = preprocessText('Hello World', 123);
        const text2 = preprocessText('Hello World', 123);
        expect(text1).toEqual(text2);
    });
    it('should compute zero drift for identical mock embeddings', async () => {
        const { score, level } = await computeDriftScoreV3('test one', 'test two', 123);
        expect(score).toBeLessThan(0.001);
        expect(level).toBe('low');
    });
});
//# sourceMappingURL=onnx-drift.test.js.map