export declare class EmbeddingCache {
    private cache;
    private readonly maxSize;
    get(text: string, seed?: number): number[] | undefined;
    set(text: string, embedding: number[], seed?: number): void;
    private generateKey;
}
export declare const embeddingCache: EmbeddingCache;
//# sourceMappingURL=embedding-cache.d.ts.map