import { InferenceSession, Tensor } from 'onnxruntime-node';
import * as path from 'path';
import * as fs from 'fs';
import { preprocessText } from './deterministic-preprocess';

export class ONNXEmbeddingModel {
  private session: InferenceSession | null = null;
  private lastSeed: number | undefined;

  async load(seed?: number) {
    if (this.session && this.lastSeed === seed) {
      return;
    }

    // Enforce deterministic ONNX runtime
    if (seed !== undefined) {
      process.env.ORT_DETERMINISTIC = '1';
      process.env.ORT_NUM_THREADS = '1';
    }

    const modelPath = path.resolve(process.cwd(), 'models', 'minilm.onnx');
    if (!fs.existsSync(modelPath)) {
      throw new Error(`ONNX model not found at ${modelPath}`);
    }

    this.session = await InferenceSession.create(modelPath, {
      executionProviders: seed ? ['cpu'] : ['cpu', 'cuda'],
      graphOptimizationLevel: 'all'
    });

    this.lastSeed = seed;
  }

  async embed(text: string, seed?: number): Promise<number[]> {
    await this.load(seed);
    const processedText = preprocessText(text, seed);
    const tensor = new Tensor('string', [processedText], [1]);
    const output = await this.session!.run({ input: tensor });
    return Array.from(output['embedding'].data as Float32Array);
  }
}
