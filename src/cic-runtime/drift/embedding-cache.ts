import * as crypto from 'crypto';

export class EmbeddingCache {
  private cache = new Map<string, { embedding: number[], timestamp: number }>();
  private readonly maxSize = 1000;

  get(text: string, seed?: number): number[] | undefined {
    const key = this.generateKey(text, seed);
    const entry = this.cache.get(key);
    if (entry) {
      entry.timestamp = Date.now();
      return entry.embedding;
    }
    return undefined;
  }

  set(text: string, embedding: number[], seed?: number) {
    const key = this.generateKey(text, seed);

    if (this.cache.size >= this.maxSize) {
      const lruKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
      if (lruKey) this.cache.delete(lruKey);
    }

    this.cache.set(key, { embedding, timestamp: Date.now() });
  }

  private generateKey(text: string, seed?: number): string {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `${hash}-${seed ?? 'none'}`;
  }
}
export const embeddingCache = new EmbeddingCache();
