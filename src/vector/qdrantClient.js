/**
 * Qdrant Vector Store Client
 * Manages connections and operations with Qdrant vector database.
 */
/**
 * Minimal Qdrant client for vector storage.
 * In production, would use @qdrant/js-client-rest library.
 * For now, provides the interface needed by adapters.
 */
class QdrantClient {
    url;
    collections = new Map();
    points = new Map();
    constructor(url = process.env.QDRANT_URL || "http://localhost:6333") {
        this.url = url;
    }
    /**
     * Ensure collection exists, creating if needed.
     */
    async ensureCollection(collectionName, vectorSize = 384) {
        if (!this.collections.has(collectionName)) {
            this.collections.set(collectionName, {
                name: collectionName,
                size: 0,
                vectors_count: 0,
            });
            if (!this.points.has(collectionName)) {
                this.points.set(collectionName, []);
            }
        }
    }
    /**
     * Upsert points into collection.
     */
    async upsertPoints(collectionName, points) {
        await this.ensureCollection(collectionName);
        const collection = this.points.get(collectionName) || [];
        const existingIds = new Set(collection.map(p => p.id));
        for (const point of points) {
            if (existingIds.has(point.id)) {
                const idx = collection.findIndex(p => p.id === point.id);
                if (idx !== -1) {
                    collection[idx] = point;
                }
            }
            else {
                collection.push(point);
            }
        }
        this.points.set(collectionName, collection);
        const collInfo = this.collections.get(collectionName);
        if (collInfo) {
            collInfo.vectors_count = collection.length;
            collInfo.size = collection.length;
        }
        return {
            operation_id: Date.now(),
            status: "completed",
        };
    }
    /**
     * Get collection info.
     */
    async getCollection(collectionName) {
        return this.collections.get(collectionName) || null;
    }
    /**
     * List all collections.
     */
    async listCollections() {
        return Array.from(this.collections.values());
    }
    /**
     * Delete collection.
     */
    async deleteCollection(collectionName) {
        this.collections.delete(collectionName);
        this.points.delete(collectionName);
    }
    /**
     * Search vectors in collection.
     */
    async search(collectionName, vector, limit = 10) {
        const points = this.points.get(collectionName) || [];
        // Simple cosine similarity search stub
        const scored = points.map(p => ({
            point: p,
            score: this.cosineSimilarity(vector, p.vector),
        }));
        return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.point);
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
}
export const qdrantClient = new QdrantClient();
//# sourceMappingURL=qdrantClient.js.map