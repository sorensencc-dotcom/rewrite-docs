import crypto from "crypto";
export class RagCache {
    cache;
    maxSize;
    defaultTtlMs;
    stats;
    constructor(maxSize = 1000, defaultTtlMs = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTtlMs = defaultTtlMs;
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    set(key, data, ttlMs) {
        const ttl = ttlMs ?? this.defaultTtlMs;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttlMs: ttl,
        });
        // LRU eviction: if over capacity, remove oldest
        if (this.cache.size > this.maxSize) {
            let oldest = null;
            for (const entry of this.cache.entries()) {
                if (!oldest || entry[1].timestamp < oldest[1].timestamp) {
                    oldest = entry;
                }
            }
            if (oldest) {
                this.cache.delete(oldest[0]);
                this.stats.evictions++;
            }
        }
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        // Check TTL expiration
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttlMs) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        this.stats.hits++;
        return entry.data;
    }
    has(key) {
        return this.get(key) !== null;
    }
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    getStats() {
        return { ...this.stats };
    }
    getHitRate() {
        const total = this.stats.hits + this.stats.misses;
        return total === 0 ? 0 : this.stats.hits / total;
    }
    size() {
        return this.cache.size;
    }
    // Generate cache key from query + params
    static generateKey(query, params) {
        const str = JSON.stringify({ query, params });
        return crypto.createHash("sha256").update(str).digest("hex");
    }
}
// Singleton instance for RAG search cache
export const ragSearchCache = new RagCache(1000, 3600000 // 1 hour
);
// Cache for RAG context builds
export const ragContextCache = new RagCache(500, 1800000 // 30 minutes
);
//# sourceMappingURL=ragCache.js.map