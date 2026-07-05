export class L1MemoryCache {
    store = new Map();
    maxEntries;
    onEviction;
    constructor(maxEntries = 500, onEviction) {
        this.maxEntries = maxEntries;
        this.onEviction = onEviction;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
            this.store.delete(key);
            return null;
        }
        this.store.delete(key);
        this.store.set(key, entry);
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.store.delete(key);
        if (this.store.size >= this.maxEntries) {
            const first = this.store.keys().next().value;
            this.store.delete(first);
            this.onEviction?.(first);
        }
        this.store.set(key, {
            key,
            value,
            timestamp: Date.now(),
            ttlMs,
        });
    }
    has(key) {
        const entry = this.store.get(key);
        if (!entry)
            return false;
        if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
            this.store.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        return this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
    size() {
        return this.store.size;
    }
    entries() {
        const result = [];
        this.store.forEach((entry, key) => {
            if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
                this.store.delete(key);
            }
            else {
                result.push([key, entry.value]);
            }
        });
        return result;
    }
}
//# sourceMappingURL=l1-memory-cache.js.map