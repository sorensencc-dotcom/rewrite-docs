import { AdapterWrapper } from "./adapter-wrapper";
import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
import { CacheMetricsCollector } from "../cache-engine/cache-metrics";
import { CachePolicyManager } from "./cache-policy";
import { OfflineModeHandler } from "./offline-mode";
import { CacheConfig, AdapterResponse, CacheMetrics } from "../cache-engine/cache-types";

export class AdapterGateway {
  private wrappers = new Map<string, AdapterWrapper>();
  private l1: L1MemoryCache;
  private l2: L2DiskCache;
  private metrics: CacheMetricsCollector;
  private policyManager: CachePolicyManager;
  private offlineHandler: OfflineModeHandler;
  private initialized = false;

  constructor(config: CacheConfig) {
    this.l1 = new L1MemoryCache(config.l1MaxEntries, (key) => {
      this.metrics.recordEviction();
    });

    this.l2 = new L2DiskCache(config.l2DiskDir);
    this.metrics = new CacheMetricsCollector();
    this.policyManager = new CachePolicyManager(config.defaultTTLMs);
    this.offlineHandler = new OfflineModeHandler(this.l1, this.l2);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.l2.init();
    this.initialized = true;
  }

  registerAdapter(adapterId: string, adapter: any): void {
    if (this.wrappers.has(adapterId)) {
      throw new Error(`Adapter already registered: ${adapterId}`);
    }

    const wrapper = new AdapterWrapper(
      adapterId,
      adapter,
      this.l1,
      this.l2,
      this.metrics,
      this.policyManager,
      this.offlineHandler
    );

    this.wrappers.set(adapterId, wrapper);
  }

  unregisterAdapter(adapterId: string): boolean {
    return this.wrappers.delete(adapterId);
  }

  async invoke(
    adapterId: string,
    payload: any,
    skipCache = false
  ): Promise<AdapterResponse> {
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

  setOfflineMode(enabled: boolean): void {
    this.offlineHandler.setOffline(enabled);
  }

  getOfflineStatus(): { isOffline: boolean; durationMs: number } {
    return this.offlineHandler.getOfflineStatus();
  }

  async preloadOfflineCache(adapterId: string, keys: string[]): Promise<number> {
    return this.offlineHandler.preloadOfflineCache(keys);
  }

  async invalidateAdapter(adapterId: string, pattern?: string): Promise<number> {
    const wrapper = this.wrappers.get(adapterId);
    if (!wrapper) {
      throw new Error(`Adapter not registered: ${adapterId}`);
    }
    return wrapper.invalidateCache(pattern);
  }

  async invalidateAll(): Promise<number> {
    let total = 0;
    for (const wrapper of this.wrappers.values()) {
      total += await wrapper.invalidateCache();
    }
    this.l1.clear();
    return total;
  }

  getMetrics(): CacheMetrics {
    return this.metrics.getMetrics();
  }

  getMetricsSummary(): string {
    return this.metrics.summarize();
  }

  getHitRate(): number {
    return this.metrics.getHitRate();
  }

  getOfflineStats() {
    return this.offlineHandler.getOfflineStats();
  }

  async shutdown(): Promise<void> {
    this.l1.clear();
    await this.l2.clear();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getRegisteredAdapters(): string[] {
    return Array.from(this.wrappers.keys());
  }
}
