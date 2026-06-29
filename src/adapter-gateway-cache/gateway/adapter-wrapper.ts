import { CacheKeyGenerator } from "../cache-engine/cache-key";
import { L1MemoryCache } from "../cache-engine/l1-memory-cache";
import { L2DiskCache } from "../cache-engine/l2-disk-cache";
import { CacheMetricsCollector } from "../cache-engine/cache-metrics";
import { CachePolicyManager, CachePolicy } from "./cache-policy";
import { OfflineModeHandler } from "./offline-mode";
import { CacheHit, AdapterResponse } from "../cache-engine/cache-types";

export class AdapterWrapper {
  constructor(
    private adapterId: string,
    private adapter: any,
    private l1: L1MemoryCache,
    private l2: L2DiskCache,
    private metrics: CacheMetricsCollector,
    private policyManager: CachePolicyManager,
    private offlineHandler: OfflineModeHandler
  ) {}

  async invoke(payload: any, skipCache = false): Promise<AdapterResponse> {
    const cacheKey = CacheKeyGenerator.computeWithAdapter(this.adapterId, payload);

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
      const offlineFallback = await this.offlineHandler.tryGetOfflineFallback(
        cacheKey
      );
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

  private async invokeAdapter(
    payload: any,
    cacheKey: string
  ): Promise<AdapterResponse> {
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
    } catch (error) {
      this.metrics.recordError();

      const offlineFallback = await this.offlineHandler.tryGetOfflineFallback(
        cacheKey
      );
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

  async invalidateCache(pattern?: string): Promise<number> {
    const patterns = this.policyManager.getInvalidationPatterns(this.adapterId);
    const allPatterns = pattern ? [pattern, ...patterns] : patterns;

    let invalidated = 0;
    const keys = await this.l2.list();

    for (const key of keys) {
      if (this.policyManager.matchesInvalidation(key, allPatterns)) {
        this.l1.delete(key);
        await this.l2.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }
}
