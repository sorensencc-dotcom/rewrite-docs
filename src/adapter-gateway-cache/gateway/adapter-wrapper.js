import { CacheKeyGenerator } from "../cache-engine/cache-key";
import { CachePolicy } from "./cache-policy";
export class AdapterWrapper {
    adapterId;
    adapter;
    l1;
    l2;
    metrics;
    policyManager;
    offlineHandler;
    trackedKeys = new Set();
    constructor(adapterId, adapter, l1, l2, metrics, policyManager, offlineHandler) {
        this.adapterId = adapterId;
        this.adapter = adapter;
        this.l1 = l1;
        this.l2 = l2;
        this.metrics = metrics;
        this.policyManager = policyManager;
        this.offlineHandler = offlineHandler;
    }
    async invoke(payload, skipCache = false) {
        const cacheKey = CacheKeyGenerator.computeWithAdapter(this.adapterId, payload);
        this.trackedKeys.add(cacheKey);
        if (skipCache) {
            return this.invokeAdapter(payload, cacheKey);
        }
        const policy = this.policyManager.getPolicy(this.adapterId);
        if (policy === CachePolicy.NEVER) {
            return this.invokeAdapter(payload, cacheKey);
        }
        const l1Hit = this.l1.get(cacheKey);
        if (l1Hit !== null) {
            this.metrics.recordL1Hit();
            return {
                success: true,
                data: l1Hit,
                source: "l1",
                timestamp: Date.now(),
                cacheKey,
            };
        }
        const l2Hit = await this.l2.get(cacheKey);
        if (l2Hit !== null) {
            this.metrics.recordL2Hit();
            this.l1.set(cacheKey, l2Hit, this.policyManager.getTTL(this.adapterId));
            return {
                success: true,
                data: l2Hit,
                source: "l2",
                timestamp: Date.now(),
                cacheKey,
            };
        }
        if (policy === CachePolicy.READ_ONLY) {
            const offlineFallback = await this.offlineHandler.tryGetOfflineFallback(cacheKey);
            if (offlineFallback !== null) {
                this.metrics.recordOfflineHit();
                return {
                    success: true,
                    data: offlineFallback,
                    source: "offline",
                    timestamp: Date.now(),
                    cacheKey,
                };
            }
            return {
                success: false,
                source: "error",
                error: "Read-only policy: no cache hit and no provider access allowed",
                timestamp: Date.now(),
                cacheKey,
            };
        }
        return this.invokeAdapter(payload, cacheKey);
    }
    async invokeAdapter(payload, cacheKey) {
        try {
            const result = await this.adapter.run(payload);
            if (result === null || result === undefined) {
                this.metrics.recordError();
                return {
                    success: false,
                    source: "error",
                    error: "Adapter returned null/undefined",
                    timestamp: Date.now(),
                    cacheKey,
                };
            }
            this.metrics.recordProviderHit();
            const ttl = this.policyManager.getTTL(this.adapterId);
            this.l1.set(cacheKey, result, ttl);
            this.metrics.recordDiskWrite();
            await this.l2.set(cacheKey, result, ttl);
            this.offlineHandler.recordLastKnownGood(cacheKey, result);
            return {
                success: true,
                data: result,
                source: "provider",
                timestamp: Date.now(),
                cacheKey,
            };
        }
        catch (error) {
            this.metrics.recordError();
            const offlineFallback = await this.offlineHandler.tryGetOfflineFallback(cacheKey);
            if (offlineFallback !== null) {
                this.metrics.recordOfflineHit();
                return {
                    success: true,
                    data: offlineFallback,
                    source: "offline",
                    timestamp: Date.now(),
                    cacheKey,
                    error: `Provider error, serving from offline cache: ${error}`,
                };
            }
            return {
                success: false,
                source: "error",
                error: `Provider error: ${error}`,
                timestamp: Date.now(),
                cacheKey,
            };
        }
    }
    getMetrics() {
        return this.metrics.getMetrics();
    }
    async invalidateCache(pattern) {
        const patterns = this.policyManager.getInvalidationPatterns(this.adapterId);
        const allPatterns = pattern ? [pattern, ...patterns] : patterns;
        let invalidated = 0;
        if (allPatterns.length === 0) {
            for (const key of this.trackedKeys) {
                this.l1.delete(key);
                await this.l2.delete(key);
                invalidated++;
            }
            this.trackedKeys.clear();
        }
        else {
            const keys = await this.l2.list();
            for (const key of keys) {
                if (this.policyManager.matchesInvalidation(key, allPatterns)) {
                    this.l1.delete(key);
                    await this.l2.delete(key);
                    invalidated++;
                }
            }
        }
        return invalidated;
    }
}
//# sourceMappingURL=adapter-wrapper.js.map