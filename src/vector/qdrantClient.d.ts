/**
 * Qdrant Vector Store Client
 * Manages connections and operations with Qdrant vector database.
 */
interface QdrantPoint {
    id: string | number;
    vector: number[];
    payload: Record<string, any>;
}
interface QdrantCollection {
    name: string;
    size: number;
    vectors_count: number;
}
interface UpsertResponse {
    operation_id: number;
    status: string;
}
/**
 * Minimal Qdrant client for vector storage.
 * In production, would use @qdrant/js-client-rest library.
 * For now, provides the interface needed by adapters.
 */
declare class QdrantClient {
    private url;
    private collections;
    private points;
    constructor(url?: string);
    /**
     * Ensure collection exists, creating if needed.
     */
    ensureCollection(collectionName: string, vectorSize?: number): Promise<void>;
    /**
     * Upsert points into collection.
     */
    upsertPoints(collectionName: string, points: QdrantPoint[]): Promise<UpsertResponse>;
    /**
     * Get collection info.
     */
    getCollection(collectionName: string): Promise<QdrantCollection | null>;
    /**
     * List all collections.
     */
    listCollections(): Promise<QdrantCollection[]>;
    /**
     * Delete collection.
     */
    deleteCollection(collectionName: string): Promise<void>;
    /**
     * Search vectors in collection.
     */
    search(collectionName: string, vector: number[], limit?: number): Promise<QdrantPoint[]>;
    private cosineSimilarity;
}
export declare const qdrantClient: QdrantClient;
export {};
//# sourceMappingURL=qdrantClient.d.ts.map