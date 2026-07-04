/**
 * Qdrant Vector Store Client
 * Manages connections and operations with Qdrant vector database.
 */

import { getEmbeddingModel } from "../cic-runtime/drift/embedding-model";

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
class QdrantClient {
  private url: string;
  private collections: Map<string, QdrantCollection> = new Map();
  private points: Map<string, QdrantPoint[]> = new Map();

  constructor(url: string = process.env.QDRANT_URL || "http://localhost:6333") {
    this.url = url;
  }

  /**
   * Ensure collection exists, creating if needed.
   */
  async ensureCollection(collectionName: string, vectorSize: number = 384): Promise<void> {
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
  async upsertPoints(collectionName: string, points: QdrantPoint[]): Promise<UpsertResponse> {
    await this.ensureCollection(collectionName);

    const collection = this.points.get(collectionName) || [];
    const existingIds = new Set(collection.map(p => p.id));

    for (const point of points) {
      if (existingIds.has(point.id)) {
        const idx = collection.findIndex(p => p.id === point.id);
        if (idx !== -1) {
          collection[idx] = point;
        }
      } else {
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
  async getCollection(collectionName: string): Promise<QdrantCollection | null> {
    return this.collections.get(collectionName) || null;
  }

  /**
   * List all collections.
   */
  async listCollections(): Promise<QdrantCollection[]> {
    return Array.from(this.collections.values());
  }

  /**
   * Delete collection.
   */
  async deleteCollection(collectionName: string): Promise<void> {
    this.collections.delete(collectionName);
    this.points.delete(collectionName);
  }

  /**
   * Search vectors in collection.
   */
  async search(
    collectionName: string,
    vector: number[],
    limit: number = 10
  ): Promise<QdrantPoint[]> {
    const points = this.points.get(collectionName) || [];

    // Simple cosine similarity search stub
    const scored = points.map(p => ({
      point: p,
      score: this.cosineSimilarity(vector, p.vector),
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.point);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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
