import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
import { CacheKeyGenerator } from "../cache-engine/cache-key";

export class OfflineModeHandler {
  private lastKnownGood = new Map<string, any>();
  private offlineStartTime: number | null = null;
  private isOffline = false;

  constructor(private l1: L1MemoryCache, private l2: L2DiskCache) {}

  setOffline(offline: boolean): void {
    this.isOffline = offline;
    if (offline && !this.offlineStartTime) {
      this.offlineStartTime = Date.now();
    } else if (!offline) {
      this.offlineStartTime = null;
    }
  }

  getOfflineStatus(): { isOffline: boolean; durationMs: number } {
    if (!this.isOffline) {
      return { isOffline: false, durationMs: 0 };
    }
    return {
      isOffline: true,
      durationMs: this.offlineStartTime ? Date.now() - this.offlineStartTime : 0,
    };
  }

  recordLastKnownGood(key: string, value: any): void {
    this.lastKnownGood.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  async tryGetOfflineFallback(key: string): Promise<any | null> {
    const l1Hit = this.l1.get(key);
    if (l1Hit !== null) {
      return l1Hit;
    }

    const l2Hit = await this.l2.get(key);
    if (l2Hit !== null) {
      return l2Hit;
    }

    const lastGood = this.lastKnownGood.get(key);
    if (lastGood) {
      return lastGood.value;
    }

    return null;
  }

  async preloadOfflineCache(keys: string[]): Promise<number> {
    let preloaded = 0;
    for (const key of keys) {
      const value = await this.l2.get(key);
      if (value !== null) {
        this.l1.set(key, value);
        preloaded++;
      }
    }
    return preloaded;
  }

  getLastKnownGoodAge(key: string): number | null {
    const entry = this.lastKnownGood.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }

  clearStaleOfflineEntries(maxAgeMs: number): number {
    let cleared = 0;
    const now = Date.now();
    for (const [key, entry] of this.lastKnownGood.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.lastKnownGood.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  getOfflineStats(): {
    cachedKeys: number;
    lastKnownGoodCount: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.lastKnownGood.values());
    const ages = entries.map((e) => Date.now() - e.timestamp);
    return {
      cachedKeys: this.l1.size(),
      lastKnownGoodCount: this.lastKnownGood.size,
      oldestEntry: ages.length > 0 ? Math.max(...ages) : null,
    };
  }
}
