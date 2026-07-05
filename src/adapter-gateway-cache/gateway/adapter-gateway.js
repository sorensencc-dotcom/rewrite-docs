import { AdapterWrapper } from "./adapter-wrapper";
import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
import { CacheMetricsCollector } from "../cache-engine/cache-metrics";
import { CachePolicyManager } from "./cache-policy";
import { OfflineModeHandler } from "./offline-mode";
export class AdapterGateway {
    wrappers = new Map();
    l1;
    l2;
    metrics;
    policyManager;
    offlineHandler;
    initialized = false;
    constructor(config) {
        this.l1 = new L1MemoryCache(config.l1MaxEntries, (key) => {
            this.metrics.recordEviction();
        });
        this.l2 = new L2DiskCache(config.l2DiskDir);
        this.metrics = new CacheMetricsCollector();
        this.policyManager = new CachePolicyManager(config.defaultTTLMs);
        this.offlineHandler = new OfflineModeHandler(this.l1, this.l2);
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.l2.init();
        this.initialized = true;
    }
    registerAdapter(adapterId, adapter) {
        if (this.wrappers.has(adapterId)) {
            throw new Error(`Adapter already registered: ${adapterId}`);
        }
        const wrapper = new AdapterWrapper(adapterId, adapter, this.l1, this.l2, this.metrics, this.policyManager, this.offlineHandler);
        this.wrappers.set(adapterId, wrapper);
    }
    unregisterAdapter(adapterId) {
        return this.wrappers.delete(adapterId);
    }
    async invoke(adapterId, payload, skipCache = false) {
        const wrapper = this.wrappers.get(adapterId);
        if (!wrapper) {
            return {
                success: false,
                source: "error",
                error: `Adapter not registered: ${adapterId}`,
                timestamp: Date.now(),
            };
        }
        return wrapper.invoke(payload, skipCache);
    }
    setOfflineMode(enabled) {
        this.offlineHandler.setOffline(enabled);
    }
    getOfflineStatus() {
        return this.offlineHandler.getOfflineStatus();
    }
    async preloadOfflineCache(adapterId, keys) {
        return this.offlineHandler.preloadOfflineCache(keys);
    }
    async invalidateAdapter(adapterId, pattern) {
        const wrapper = this.wrappers.get(adapterId);
        if (!wrapper) {
            throw new Error(`Adapter not registered: ${adapterId}`);
        }
        return wrapper.invalidateCache(pattern);
    }
    async invalidateAll() {
        let total = 0;
        for (const wrapper of this.wrappers.values()) {
            total += await wrapper.invalidateCache();
        }
        this.l1.clear();
        return total;
    }
    getMetrics() {
        return this.metrics.getMetrics();
    }
    getMetricsSummary() {
        return this.metrics.summarize();
    }
    getHitRate() {
        return this.metrics.getHitRate();
    }
    getOfflineStats() {
        return this.offlineHandler.getOfflineStats();
    }
    async shutdown() {
        this.l1.clear();
        await this.l2.clear();
    }
    isInitialized() {
        return this.initialized;
    }
    getRegisteredAdapters() {
        return Array.from(this.wrappers.keys());
    }
}
//# sourceMappingURL=adapter-gateway.js.map