export class OfflineModeHandler {
    l1;
    l2;
    lastKnownGood = new Map();
    offlineStartTime = null;
    isOffline = false;
    constructor(l1, l2) {
        this.l1 = l1;
        this.l2 = l2;
    }
    setOffline(offline) {
        this.isOffline = offline;
        if (offline && !this.offlineStartTime) {
            this.offlineStartTime = Date.now();
        }
        else if (!offline) {
            this.offlineStartTime = null;
        }
    }
    getOfflineStatus() {
        if (!this.isOffline) {
            return { isOffline: false, durationMs: 0 };
        }
        return {
            isOffline: true,
            durationMs: this.offlineStartTime ? Date.now() - this.offlineStartTime : 0,
        };
    }
    recordLastKnownGood(key, value) {
        this.lastKnownGood.set(key, {
            value,
            timestamp: Date.now(),
        });
    }
    async tryGetOfflineFallback(key) {
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
    async preloadOfflineCache(keys) {
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
    getLastKnownGoodAge(key) {
        const entry = this.lastKnownGood.get(key);
        if (!entry)
            return null;
        return Date.now() - entry.timestamp;
    }
    clearStaleOfflineEntries(maxAgeMs) {
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
    getOfflineStats() {
        const entries = Array.from(this.lastKnownGood.values());
        const ages = entries.map((e) => Date.now() - e.timestamp);
        return {
            cachedKeys: this.l1.size(),
            lastKnownGoodCount: this.lastKnownGood.size,
            oldestEntry: ages.length > 0 ? Math.max(...ages) : null,
        };
    }
}
//# sourceMappingURL=offline-mode.js.map