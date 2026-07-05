export declare class ONNXEmbeddingModel {
    private session;
    private lastSeed;
    load(seed?: number): Promise<void>;
    embed(text: string, seed?: number): Promise<number[]>;
}
//# sourceMappingURL=embedding-model-onnx.d.ts.map