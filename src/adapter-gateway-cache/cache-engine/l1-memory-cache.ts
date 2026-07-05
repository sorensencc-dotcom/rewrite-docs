import { CacheEntry } from "./cache-types";

export class L1MemoryCache {
  private store = new Map<string, CacheEntry>();
  private maxEntries: number;
  private onEviction?: (key: string) => void;

  constructor(maxEntries: number = 500, onEviction?: (key: string) => void) {
    this.maxEntries = maxEntries;
    this.onEviction = onEviction;
  }

  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
      this.store.delete(key);
      return null;
    }

    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  set(key: string, value: any, ttlMs?: number): void {
    this.store.delete(key);

    if (this.store.size >= this.maxEntries) {
      const first = this.store.keys().next().value as string;
      if (first) {
        this.store.delete(first);
        this.onEviction?.(first);
      }
    }

    this.store.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  entries(): Array<[string, any]> {
    const result: Array<[string, any]> = [];
    this.store.forEach((entry, key) => {
      if (entry.ttlMs && Date.now() - entry.timestamp > entry.ttlMs) {
        this.store.delete(key);
      } else {
        result.push([key, entry.value]);
      }
    });
    return result;
  }
}
