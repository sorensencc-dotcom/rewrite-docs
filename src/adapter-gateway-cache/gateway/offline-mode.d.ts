import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
export declare class OfflineModeHandler {
    private l1;
    private l2;
    private lastKnownGood;
    private offlineStartTime;
    private isOffline;
    constructor(l1: L1MemoryCache, l2: L2DiskCache);
    setOffline(offline: boolean): void;
    getOfflineStatus(): {
        isOffline: boolean;
        durationMs: number;
    };
    recordLastKnownGood(key: string, value: any): void;
    tryGetOfflineFallback(key: string): Promise<any | null>;
    preloadOfflineCache(keys: string[]): Promise<number>;
    getLastKnownGoodAge(key: string): number | null;
    clearStaleOfflineEntries(maxAgeMs: number): number;
    getOfflineStats(): {
        cachedKeys: number;
        lastKnownGoodCount: number;
        oldestEntry: number | null;
    };
}
//# sourceMappingURL=offline-mode.d.ts.map